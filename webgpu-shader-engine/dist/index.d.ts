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
export type { BeatClockState, Keyframe, InterpolationType, TrackerOptions, PlaylistEntry, } from './tracker.js';
export { LayerStack } from './passes.js';
export type { ChannelInput, SceneDescriptor } from './passes.js';
export { DEFAULT_VERTEX_WGSL, DEFAULT_FRAGMENT_WGSL, BUILTIN_UNIFORMS_WGSL, CHANNEL_BINDINGS_WGSL, } from './defaults.js';
export { UniformBuffer, BUILTIN_BUFFER_SIZE } from './uniforms.js';
import { Tracker } from './tracker.js';
import { LayerStack } from './passes.js';
import type { BeatClockState } from './tracker.js';
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
export declare class ShaderEffect {
    private device;
    private context;
    private format;
    private pipeline;
    private bindGroupLayout;
    private bindGroup;
    private uniforms;
    private readonly canvas;
    private readonly tracker;
    private readonly layerStack;
    private readonly onFrameCb;
    private elapsedMs;
    private lastFrameTime;
    private frameCount;
    private rafId;
    private _playing;
    private resizeObserver;
    private constructor();
    /**
     * Create a `ShaderEffect` bound to `canvas` and initialise the WebGPU context.
     * Throws if WebGPU is unavailable or no suitable adapter is found.
     */
    static create(canvas: HTMLCanvasElement, options?: ShaderEffectOptions): Promise<ShaderEffect>;
    private _init;
    /**
     * Compile new WGSL shaders and hot-swap the single-pass render pipeline.
     * Not used when a `LayerStack` was provided at creation time.
     *
     * The `BuiltinUniforms` struct is prepended automatically.
     */
    compile(fragmentShader: string, vertexShader?: string): Promise<CompileResult>;
    /** Start the render loop. Resumes from the paused position if called after `pause()`. */
    play(): void;
    /** Pause the render loop, preserving the current playback position. */
    pause(): void;
    /** Stop playback and reset to frame 0. */
    stop(): void;
    get isPlaying(): boolean;
    destroy(): void;
    private _loop;
    private _renderFrame;
    private _onResize;
    private _onPointer;
}
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
export declare function createEffect(canvas: HTMLCanvasElement, fragmentShader?: string, options?: ShaderEffectOptions): Promise<ShaderEffect>;
//# sourceMappingURL=index.d.ts.map