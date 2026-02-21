/**
 * @shaderforge/engine
 *
 * Zero-boilerplate WebGPU shader engine with beat-clock tracker sync.
 *
 * The entire WebGPU surface (adapter, device, swap-chain, bind-group layout,
 * render pipeline, uniform buffers, resize observers) is managed internally.
 * Callers only see a clean, high-level API.
 *
 * Mirrors the feature set of ShaderLabDX12:
 *   - Fullscreen-quad rendering with auto-injected built-in uniforms
 *   - BeatClock: BPM-synced quarter/eighth/sixteenth/bar counters + phases
 *   - Tracker timeline: keyframe-animated values bound to shader uniforms
 *   - Multi-pass support: render-to-texture "buffer passes" (M3+)
 *   - Playlist: beat-anchored scene sequencing (M4+)
 */

export { BeatClock, Tracker, Playlist } from './tracker.js';
export type {
  BeatClockState,
  Keyframe,
  InterpolationType,
  TrackerOptions,
  PlaylistEntry,
} from './tracker.js';
export { DEFAULT_VERTEX_WGSL, DEFAULT_FRAGMENT_WGSL, BUILTIN_UNIFORMS_WGSL } from './defaults.js';
export { UniformBuffer, BUILTIN_BUFFER_SIZE } from './uniforms.js';

import { DEFAULT_VERTEX_WGSL, DEFAULT_FRAGMENT_WGSL } from './defaults.js';
import { UniformBuffer } from './uniforms.js';
import { Tracker } from './tracker.js';
import type { BeatClockState } from './tracker.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ShaderEffectOptions {
  /**
   * A Tracker instance to drive BPM uniforms and timeline values
   * automatically each frame.
   */
  tracker?: Tracker;
  /**
   * Called once per frame after uniforms are updated but before the draw call.
   * Use this hook to push custom uniform values or read tracker state.
   */
  onFrame?: (state: FrameState) => void;
}

export interface FrameState {
  /** Seconds since the effect started playing. */
  time: number;
  /** Frame index (starts at 0). */
  frame: number;
  /** Current beat-clock state. Populated only when a Tracker is attached. */
  beat: BeatClockState | null;
  /** The Tracker instance, if one was provided. */
  tracker: Tracker | null;
}

export interface CompileResult {
  ok: boolean;
  /** Populated when `ok` is false. */
  error?: string;
}

// ---------------------------------------------------------------------------
// ShaderEffect
// ---------------------------------------------------------------------------

/**
 * Core rendering component. Attach to any `<canvas>` element and start
 * rendering immediately with as little as two lines of code.
 *
 * @example
 * ```ts
 * const effect = await ShaderEffect.create(canvas);
 * await effect.compile(myFragmentWGSL);
 * effect.play();
 * ```
 */
export class ShaderEffect {
  private device!: GPUDevice;
  private context!: GPUCanvasContext;
  private format!: GPUTextureFormat;
  private pipeline: GPURenderPipeline | null = null;
  private bindGroupLayout!: GPUBindGroupLayout;
  private bindGroup: GPUBindGroup | null = null;
  private uniforms!: UniformBuffer;

  private readonly canvas: HTMLCanvasElement;
  private readonly tracker: Tracker | null;
  private readonly onFrame: ((s: FrameState) => void) | null;

  private rafId = 0;
  private startTime = 0;
  private frameCount = 0;
  private _playing = false;
  private resizeObserver: ResizeObserver | null = null;

  private constructor(
    canvas: HTMLCanvasElement,
    options: ShaderEffectOptions,
  ) {
    this.canvas = canvas;
    this.tracker = options.tracker ?? null;
    this.onFrame = options.onFrame ?? null;
  }

  // -------------------------------------------------------------------------
  // Factory (async GPU init)
  // -------------------------------------------------------------------------

  /**
   * Create a ShaderEffect bound to `canvas` and initialise the WebGPU context.
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

    // Bind group layout — binding 0 is always the built-in uniform buffer.
    this.bindGroupLayout = this.device.createBindGroupLayout({
      label: 'shaderforge:bgl',
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
        buffer: { type: 'uniform' },
      }],
    });

    // Observe canvas resize and update the uniform resolution automatically.
    this.resizeObserver = new ResizeObserver(() => this._onResize());
    this.resizeObserver.observe(this.canvas);
    this._onResize();

    // Track mouse position.
    this.canvas.addEventListener('pointermove', this._onPointer);

    // Compile with the default shaders so the canvas is immediately live.
    await this.compile(DEFAULT_FRAGMENT_WGSL, DEFAULT_VERTEX_WGSL);
  }

  // -------------------------------------------------------------------------
  // Shader compilation
  // -------------------------------------------------------------------------

  /**
   * Compile new WGSL shaders and hot-swap the render pipeline.
   * The `BuiltinUniforms` struct is prepended automatically — do NOT declare it
   * again inside your shader source.
   *
   * @param fragmentShader  WGSL fragment shader source (without uniform struct).
   * @param vertexShader    Optional WGSL vertex shader. Defaults to fullscreen quad.
   */
  async compile(
    fragmentShader: string,
    vertexShader: string = DEFAULT_VERTEX_WGSL,
  ): Promise<CompileResult> {
    try {
      const vertModule = this.device.createShaderModule({ code: vertexShader, label: 'sf:vert' });
      const fragModule = this.device.createShaderModule({ code: fragmentShader, label: 'sf:frag' });

      const pipeline = await this.device.createRenderPipelineAsync({
        label: 'shaderforge:pipeline',
        layout: this.device.createPipelineLayout({
          bindGroupLayouts: [this.bindGroupLayout],
        }),
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
        label: 'shaderforge:bg',
        layout: this.bindGroupLayout,
        entries: [{ binding: 0, resource: { buffer: this.uniforms.gpuBuffer } }],
      });

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

  /** Start the render loop. */
  play(): void {
    if (this._playing) return;
    this._playing = true;
    this.startTime = performance.now() - this.frameCount * (1000 / 60);
    this.tracker?.play();
    this._loop();
  }

  /** Pause the render loop. A single frame is still rendered to avoid a blank canvas. */
  pause(): void {
    this._playing = false;
    this.tracker?.pause();
    cancelAnimationFrame(this.rafId);
  }

  /** Stop and reset to frame 0. */
  stop(): void {
    this._playing = false;
    this.tracker?.stop();
    cancelAnimationFrame(this.rafId);
    this.frameCount = 0;
    this.startTime = 0;
    this._renderFrame(0, null);
  }

  get isPlaying(): boolean { return this._playing; }

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  /** Release all GPU and DOM resources. */
  destroy(): void {
    this.pause();
    this.resizeObserver?.disconnect();
    this.canvas.removeEventListener('pointermove', this._onPointer);
    this.uniforms.destroy();
    this.device.destroy();
  }

  // -------------------------------------------------------------------------
  // Internal render loop
  // -------------------------------------------------------------------------

  private _loop(): void {
    if (!this._playing) return;
    this.rafId = requestAnimationFrame(() => {
      const time = (performance.now() - this.startTime) / 1000;
      const beat = this.tracker ? this.tracker.tick() : null;
      this._renderFrame(time, beat);
      this._loop();
    });
  }

  private _renderFrame(time: number, beat: BeatClockState | null): void {
    if (!this.pipeline || !this.bindGroup) return;

    // --- Update uniforms ---
    this.uniforms.setTime(time);
    this.uniforms.setFrame(this.frameCount);

    if (beat) {
      this.uniforms.setBeatUniforms(
        this.tracker!.isPlaying || beat.beat > 0 ? (this.tracker as any).clock?.getBPM?.() ?? 120 : 120,
        beat.beat,
        beat.barProgress,
        beat.quarterPhase,
        beat.eighthPhase,
        beat.sixteenthPhase,
      );
    }

    this.uniforms.upload();

    // --- User hook ---
    this.onFrame?.({
      time,
      frame: this.frameCount,
      beat,
      tracker: this.tracker,
    });

    // --- GPU draw ---
    const encoder = this.device.createCommandEncoder({ label: 'sf:encoder' });
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.context.getCurrentTexture().createView(),
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
      }],
    });

    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.draw(6); // two triangles (fullscreen quad)
    pass.end();

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
 * the ready-to-play instance.  This is the recommended entry point for most
 * use cases.
 *
 * @example
 * ```ts
 * const effect = await createEffect(canvas, myFragmentWGSL);
 * effect.play();
 * ```
 */
export async function createEffect(
  canvas: HTMLCanvasElement,
  fragmentShader?: string,
  options: ShaderEffectOptions = {},
): Promise<ShaderEffect> {
  const effect = await ShaderEffect.create(canvas, options);
  if (fragmentShader) {
    const result = await effect.compile(fragmentShader);
    if (!result.ok) {
      throw new Error(`@shaderforge/engine: Shader compilation failed — ${result.error}`);
    }
  }
  return effect;
}
