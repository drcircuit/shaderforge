/**
 * @shaderforge/engine
 *
 * Zero-boilerplate WebGPU shader engine with beat-clock tracker sync and a
 * scene/post-FX layer stack — the browser counterpart to ShaderLabDX12.
 *
 * Hidden from callers: adapter, device, swap-chain, bind-group layouts,
 * render pipelines, uniform buffers, resize observers, ping-pong textures.
 *
 * Feature parity with ShaderLabDX12:
 *   - Fullscreen-quad rendering with auto-injected BuiltinUniforms
 *   - BeatClock: BPM-synced quarter/eighth/sixteenth/bar counters + phases
 *   - Tracker timeline: keyframe-animated values bound to shader uniforms
 *   - LayerStack: scene + post-FX chain where each layer samples the previous
 *     via iChannel0..3 (mirrors Scene.bindings + Scene.postFxChain)
 *   - Playlist: beat-anchored scene sequencing (M4)
 */

export { BeatClock, Tracker, Playlist } from './tracker.js';
export type {
  BeatClockState,
  Keyframe,
  InterpolationType,
  TrackerOptions,
  PlaylistEntry,
} from './tracker.js';

export { LayerStack } from './passes.js';
export type { ChannelInput, SceneDescriptor } from './passes.js';

export {
  DEFAULT_VERTEX_WGSL,
  DEFAULT_FRAGMENT_WGSL,
  DEFAULT_SCENE_FRAGMENT_WGSL,
  DEFAULT_CUBE_VERTEX_WGSL,
  DEFAULT_SPHERE_VERTEX_WGSL,
  BUILTIN_UNIFORMS_WGSL,
  CHANNEL_BINDINGS_WGSL,
} from './defaults.js';

export { UniformBuffer, BUILTIN_BUFFER_SIZE } from './uniforms.js';

import { DEFAULT_VERTEX_WGSL, DEFAULT_FRAGMENT_WGSL } from './defaults.js';
import { UniformBuffer } from './uniforms.js';
import { Tracker } from './tracker.js';
import { LayerStack } from './passes.js';
import type { BeatClockState } from './tracker.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ShaderEffectOptions {
  /**
   * A Tracker instance to drive BPM uniforms and timeline values each frame.
   */
  tracker?: Tracker;
  /**
   * A LayerStack describing a multi-scene + post-FX rendering pipeline.
   * When provided, the `compile()` method is unused — the stack owns all shaders.
   */
  layerStack?: LayerStack;
  /**
   * Called once per frame after uniforms are updated but before the draw call.
   */
  onFrame?: (state: FrameState) => void;
}

export interface FrameState {
  /** Seconds elapsed since `play()` was first called (pauses excluded). */
  time: number;
  /** Frame index starting at 0. */
  frame: number;
  /** Current beat-clock state, or null when no Tracker is attached. */
  beat: BeatClockState | null;
  /** The Tracker instance, if one was provided. */
  tracker: Tracker | null;
}

export interface CompileResult {
  ok: boolean;
  /** Error message, populated when `ok` is false. */
  error?: string;
}

// ---------------------------------------------------------------------------
// ShaderEffect
// ---------------------------------------------------------------------------

/**
 * Core rendering component.
 *
 * **Single-pass (simple)**
 * ```ts
 * const effect = await ShaderEffect.create(canvas);
 * await effect.compile(myFragmentWGSL);
 * effect.play();
 * ```
 *
 * **Multi-pass with layer stack (mirrors ShaderLabDX12 scene chain)**
 * ```ts
 * const stack = new LayerStack()
 *   .scene({ name: 'base', fragmentShader: baseWGSL })
 *   .postFx(bloomWGSL);   // iChannel0 = output of 'base'
 *
 * const effect = await ShaderEffect.create(canvas, { layerStack: stack });
 * effect.play();
 * ```
 */
export class ShaderEffect {
  private device!: GPUDevice;
  private context!: GPUCanvasContext;
  private format!: GPUTextureFormat;

  // --- single-pass resources (null when layerStack is used) ---
  private pipeline: GPURenderPipeline | null = null;
  private bindGroupLayout!: GPUBindGroupLayout;
  private bindGroup: GPUBindGroup | null = null;
  /** Number of vertices to draw in the single-pass path. */
  private vertexCount = 6;

  private uniforms!: UniformBuffer;

  private readonly canvas: HTMLCanvasElement;
  private readonly tracker: Tracker | null;
  private readonly layerStack: LayerStack | null;
  private readonly onFrameCb: ((s: FrameState) => void) | null;

  // Timing — tracked as wall-clock elapsed to avoid drift across pause/resume
  private elapsedMs = 0;
  private lastFrameTime = 0;
  private frameCount = 0;
  private rafId = 0;
  private _playing = false;

  private resizeObserver: ResizeObserver | null = null;

  private constructor(canvas: HTMLCanvasElement, options: ShaderEffectOptions) {
    this.canvas = canvas;
    this.tracker = options.tracker ?? null;
    this.layerStack = options.layerStack ?? null;
    this.onFrameCb = options.onFrame ?? null;
  }

  // -------------------------------------------------------------------------
  // Factory
  // -------------------------------------------------------------------------

  /**
   * Create a `ShaderEffect` bound to `canvas` and initialise the WebGPU context.
   * Throws if WebGPU is unavailable or no suitable adapter is found.
   */
  static async create(
    canvas: HTMLCanvasElement,
    options: ShaderEffectOptions = {},
  ): Promise<ShaderEffect> {
    if (!navigator.gpu) {
      throw new Error('@shaderforge/engine: WebGPU is not supported in this browser.');
    }
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error('@shaderforge/engine: No suitable GPUAdapter found.');
    }

    const effect = new ShaderEffect(canvas, options);
    await effect._init(adapter);
    return effect;
  }

  private async _init(adapter: GPUAdapter): Promise<void> {
    this.device = await adapter.requestDevice();

    const ctx = this.canvas.getContext('webgpu');
    if (!ctx) throw new Error('@shaderforge/engine: Failed to get WebGPU canvas context.');
    this.context = ctx;

    this.format = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({ device: this.device, format: this.format });

    this.uniforms = new UniformBuffer(this.device);

    // Bind group layout for the single-pass path (uniform buffer only)
    this.bindGroupLayout = this.device.createBindGroupLayout({
      label: 'sf:bgl',
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
        buffer: { type: 'uniform' },
      }],
    });

    this.resizeObserver = new ResizeObserver(() => this._onResize());
    this.resizeObserver.observe(this.canvas);
    this.canvas.addEventListener('pointermove', this._onPointer);
    this._onResize();

    if (this.layerStack) {
      const w = this.canvas.width;
      const h = this.canvas.height;
      await this.layerStack.compile(this.device, this.format, this.uniforms, w, h);
    } else {
      // Compile the default shader so the canvas is live immediately
      await this.compile(DEFAULT_FRAGMENT_WGSL, DEFAULT_VERTEX_WGSL);
    }
  }

  // -------------------------------------------------------------------------
  // Single-pass shader compilation
  // -------------------------------------------------------------------------

  /**
   * Compile new WGSL shaders and hot-swap the single-pass render pipeline.
   * Not used when a `LayerStack` was provided at creation time.
   *
   * The `BuiltinUniforms` struct is prepended automatically.
   *
   * @param vertexCount  Number of vertices to draw.  Defaults to 6 (fullscreen
   *                     quad).  Pass 36 for a cube or 3072 for a UV sphere.
   */
  async compile(
    fragmentShader: string,
    vertexShader: string = DEFAULT_VERTEX_WGSL,
    vertexCount = 6,
  ): Promise<CompileResult> {
    try {
      const vertModule = this.device.createShaderModule({ code: vertexShader, label: 'sf:vert' });
      const fragModule = this.device.createShaderModule({ code: fragmentShader, label: 'sf:frag' });

      // Use getCompilationInfo() for line/column-accurate error messages
      const [vertInfo, fragInfo] = await Promise.all([
        vertModule.getCompilationInfo(),
        fragModule.getCompilationInfo(),
      ]);

      const vertErrors = vertInfo.messages.filter(m => m.type === 'error');
      const fragErrors = fragInfo.messages.filter(m => m.type === 'error');

      if (vertErrors.length || fragErrors.length) {
        const fmt = (msgs: readonly GPUCompilationMessage[], stage: string) =>
          msgs.map(m => `${stage} line ${m.lineNum}:${m.linePos} — ${m.message}`).join('\n');
        const errText = [
          vertErrors.length ? fmt(vertErrors, 'vertex') : '',
          fragErrors.length ? fmt(fragErrors, 'fragment') : '',
        ].filter(Boolean).join('\n');
        return { ok: false, error: errText || 'Shader compilation failed' };
      }

      const pipeline = await this.device.createRenderPipelineAsync({
        label: 'sf:pipeline',
        layout: this.device.createPipelineLayout({ bindGroupLayouts: [this.bindGroupLayout] }),
        vertex: { module: vertModule, entryPoint: 'main' },
        fragment: {
          module: fragModule,
          entryPoint: 'main',
          targets: [{ format: this.format }],
        },
        primitive: { topology: 'triangle-list' },
      });

      this.pipeline = pipeline;
      this.bindGroup = this.device.createBindGroup({
        label: 'sf:bg',
        layout: this.bindGroupLayout,
        entries: [{ binding: 0, resource: { buffer: this.uniforms.gpuBuffer } }],
      });
      this.vertexCount = vertexCount;

      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('@shaderforge/engine compile error:', msg);
      return { ok: false, error: msg };
    }
  }

  // -------------------------------------------------------------------------
  // Playback control
  // -------------------------------------------------------------------------

  /** Start the render loop. Resumes from the paused position if called after `pause()`. */
  play(): void {
    if (this._playing) return;
    this._playing = true;
    this.lastFrameTime = performance.now();
    this.tracker?.play();
    this._loop();
  }

  /** Pause the render loop, preserving the current playback position. */
  pause(): void {
    if (!this._playing) return;
    this._playing = false;
    this.elapsedMs += performance.now() - this.lastFrameTime;
    this.tracker?.pause();
    cancelAnimationFrame(this.rafId);
  }

  /** Stop playback and reset to frame 0. */
  stop(): void {
    this._playing = false;
    this.elapsedMs = 0;
    this.frameCount = 0;
    this.tracker?.stop();
    cancelAnimationFrame(this.rafId);
    this._renderFrame(0, null);
  }

  get isPlaying(): boolean { return this._playing; }

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  destroy(): void {
    this.pause();
    this.resizeObserver?.disconnect();
    this.canvas.removeEventListener('pointermove', this._onPointer);
    this.layerStack?.destroy();
    this.uniforms.destroy();
    this.device.destroy();
  }

  // -------------------------------------------------------------------------
  // Internal render loop
  // -------------------------------------------------------------------------

  private _loop(): void {
    if (!this._playing) return;
    this.rafId = requestAnimationFrame((now) => {
      // Elapsed time is accumulated across pause/resume — no drift from assumed FPS
      const time = (this.elapsedMs + (now - this.lastFrameTime)) / 1000;
      const beat = this.tracker ? this.tracker.tick() : null;
      this._renderFrame(time, beat);
      this._loop();
    });
  }

  private _renderFrame(time: number, beat: BeatClockState | null): void {
    // --- Update uniforms ---
    this.uniforms.setTime(time);
    this.uniforms.setFrame(this.frameCount);

    if (beat && this.tracker) {
      this.uniforms.setBeatUniforms(
        this.tracker.getBPM(),
        beat.beat,
        beat.barProgress,
        beat.quarterPhase,
        beat.eighthPhase,
        beat.sixteenthPhase,
      );
    }

    this.uniforms.upload();

    // --- User hook ---
    this.onFrameCb?.({ time, frame: this.frameCount, beat, tracker: this.tracker });

    // --- GPU draw ---
    const encoder = this.device.createCommandEncoder({ label: 'sf:encoder' });
    const canvasView = this.context.getCurrentTexture().createView();

    if (this.layerStack) {
      // Multi-pass: delegate entirely to the LayerStack
      this.layerStack.render(encoder, canvasView, this.uniforms);
    } else {
      // Single-pass: use the compiled pipeline directly
      if (this.pipeline && this.bindGroup) {
        const pass = encoder.beginRenderPass({
          colorAttachments: [{
            view: canvasView,
            loadOp: 'clear',
            storeOp: 'store',
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
          }],
        });
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.draw(this.vertexCount);
        pass.end();
      }
    }

    this.device.queue.submit([encoder.finish()]);
    this.frameCount++;
  }

  private _onResize(): void {
    const w = this.canvas.clientWidth || this.canvas.width;
    const h = this.canvas.clientHeight || this.canvas.height;
    if (w > 0 && h > 0) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.uniforms.setResolution(w, h);
      this.layerStack?.resize(this.uniforms, w, h);
    }
  }

  private _onPointer = (e: PointerEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.uniforms.setMouse(e.clientX - rect.left, e.clientY - rect.top);
  };
}

// ---------------------------------------------------------------------------
// Convenience factory
// ---------------------------------------------------------------------------

/**
 * Create a `ShaderEffect`, optionally compile a fragment shader, and return
 * the ready-to-play instance.
 *
 * @example Single-pass
 * ```ts
 * const effect = await createEffect(canvas, myFragmentWGSL);
 * effect.play();
 * ```
 *
 * @example Multi-pass layer stack
 * ```ts
 * const stack = new LayerStack()
 *   .scene({ name: 'base', fragmentShader: baseWGSL })
 *   .postFx(bloomWGSL);
 *
 * const effect = await createEffect(canvas, undefined, { layerStack: stack });
 * effect.play();
 * ```
 */
export async function createEffect(
  canvas: HTMLCanvasElement,
  fragmentShader?: string,
  options: ShaderEffectOptions = {},
): Promise<ShaderEffect> {
  const effect = await ShaderEffect.create(canvas, options);
  if (fragmentShader && !options.layerStack) {
    const result = await effect.compile(fragmentShader);
    if (!result.ok) {
      throw new Error(`@shaderforge/engine: Shader compilation failed — ${result.error}`);
    }
  }
  return effect;
}

