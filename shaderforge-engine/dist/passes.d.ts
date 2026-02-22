/**
 * LayerStack — scene + post-FX rendering stack.
 *
 * Mirrors the ShaderLabDX12 model from ShaderLabData.h / PreviewRenderer.cpp:
 *
 *   ShaderLabDX12              @shaderforge/engine
 *   ─────────────────────────  ────────────────────────────────────────
 *   Scene                   →  RenderPass (named, renders to off-screen texture)
 *   Scene.bindings          →  ChannelInput[] (sourceScene → pass name)
 *   iChannel0..3 (HLSL t0)  →  iChannel0..3 (WGSL @binding(1,3,5,7))
 *   Scene.postFxChain[]     →  postFx() calls on LayerStack
 *   postFxTextureA/B        →  ping-pong GPUTextures inside LayerStack
 *
 * The rendering flow each frame:
 *   1. Each named scene renders in the order it was added → own GPUTexture
 *   2. Each post-FX pass reads the previous layer's texture as iChannel0
 *      using a ping-pong pair of off-screen textures.
 *   3. The very last pass (post-FX or final scene) renders directly to the
 *      canvas swap-chain view supplied by ShaderEffect.
 *
 * Example:
 * ```ts
 * const stack = new LayerStack()
 *   .scene({ name: 'base',   fragmentShader: baseWGSL })
 *   .scene({ name: 'trails', fragmentShader: trailsWGSL,
 *            channels: [{ channel: 0, source: 'base' }] })
 *   .postFx(bloomWGSL)     // iChannel0 = output of 'trails'
 *   .postFx(vignetteWGSL); // iChannel0 = output of bloom
 *
 * const effect = await createEffect(canvas, undefined, { layerStack: stack });
 * effect.play();
 * ```
 */
import type { UniformBuffer } from './uniforms.js';
/** Connects a texture-channel slot to the output of a named scene. */
export interface ChannelInput {
    /** Slot index 0–3 → iChannel0..3 in the shader. */
    channel: 0 | 1 | 2 | 3;
    /** Name of a previously declared scene in this stack. */
    source: string;
}
export interface SceneDescriptor {
    name: string;
    /** WGSL fragment shader. Do NOT redeclare BuiltinUniforms or iChannel bindings. */
    fragmentShader: string;
    /** Optional WGSL vertex shader. Defaults to the built-in fullscreen quad. */
    vertexShader?: string;
    /** Wire up to 4 scene outputs into iChannel0..3 of this pass. */
    channels?: ChannelInput[];
}
export declare class LayerStack {
    private readonly sceneMap;
    private readonly sceneOrder;
    private readonly postFxRecords;
    private device;
    private format;
    private passBGL;
    private sampler;
    /** 1×1 black texture used as placeholder for unconnected channel slots. */
    private fallback;
    /** Ping-pong pair for the post-FX chain. */
    private pingTex;
    private pongTex;
    private width;
    private height;
    /**
     * Add a named scene to the stack.
     * Scenes render in the order they are added.
     * Any scene can read earlier scenes' outputs via `channels`.
     */
    scene(desc: SceneDescriptor): this;
    /**
     * Append a post-processing pass after all scenes.
     * The output of the preceding layer is automatically wired to `iChannel0`.
     * Multiple calls chain in order (output of pass N → iChannel0 of pass N+1).
     */
    postFx(fragmentShader: string): this;
    /**
     * Allocate GPU resources and compile all pipelines.
     * Called by ShaderEffect.create(); do not invoke directly.
     */
    compile(device: GPUDevice, format: GPUTextureFormat, uniformBuffer: UniformBuffer, width: number, height: number): Promise<void>;
    /**
     * Destroy and recreate all size-dependent textures, then rebuild bind groups.
     * Called by ShaderEffect when the canvas is resized.
     */
    resize(uniformBuffer: UniformBuffer, width: number, height: number): void;
    /**
     * Execute the full stack for one frame.
     * The final output lands on `canvasView` (the current swap-chain texture view).
     * Called by ShaderEffect._renderFrame(); do not invoke directly.
     */
    render(encoder: GPUCommandEncoder, canvasView: GPUTextureView, uniformBuffer: UniformBuffer): void;
    destroy(): void;
    private _makeTexture;
    private _compilePipeline;
    /**
     * Build a bind group for a scene pass, resolving channel sources from the
     * scene map. `overridePrev` is used for post-FX passes where iChannel0 is
     * the dynamically determined previous-layer texture.
     */
    private _makeBindGroup;
    /** Rebuild the cached bind groups for all named scenes. */
    private _rebuildSceneBindGroups;
    /** Execute one render pass into `targetView`. */
    private _drawPass;
    /**
     * Fallback blit: renders `srcTex` into `targetView` using a trivial
     * passthrough shader. Used when there are no post-FX passes and we need to
     * get the last scene's texture onto the canvas.
     */
    private _blitToCanvas;
    private _blitPipeline;
    private _initBlitPipeline;
}
//# sourceMappingURL=passes.d.ts.map