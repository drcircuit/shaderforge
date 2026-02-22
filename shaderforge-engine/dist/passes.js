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
import { BUILTIN_UNIFORMS_WGSL, CHANNEL_BINDINGS_WGSL, DEFAULT_VERTEX_WGSL } from './defaults.js';
// ---------------------------------------------------------------------------
// LayerStack
// ---------------------------------------------------------------------------
export class LayerStack {
    sceneMap = new Map();
    sceneOrder = [];
    postFxRecords = [];
    // GPU state — null until compile()
    device = null;
    format = null;
    passBGL = null;
    sampler = null;
    /** 1×1 black texture used as placeholder for unconnected channel slots. */
    fallback = null;
    /** Ping-pong pair for the post-FX chain. */
    pingTex = null;
    pongTex = null;
    width = 1;
    height = 1;
    // -------------------------------------------------------------------------
    // Builder API
    // -------------------------------------------------------------------------
    /**
     * Add a named scene to the stack.
     * Scenes render in the order they are added.
     * Any scene can read earlier scenes' outputs via `channels`.
     */
    scene(desc) {
        const record = {
            name: desc.name,
            fragSrc: desc.fragmentShader,
            vertSrc: desc.vertexShader ?? DEFAULT_VERTEX_WGSL,
            channels: desc.channels ?? [],
            texture: null,
            pipeline: null,
            bindGroup: null,
        };
        this.sceneMap.set(desc.name, record);
        this.sceneOrder.push(desc.name);
        return this;
    }
    /**
     * Append a post-processing pass after all scenes.
     * The output of the preceding layer is automatically wired to `iChannel0`.
     * Multiple calls chain in order (output of pass N → iChannel0 of pass N+1).
     */
    postFx(fragmentShader) {
        this.postFxRecords.push({
            name: `__postfx_${this.postFxRecords.length}`,
            fragSrc: fragmentShader,
            vertSrc: DEFAULT_VERTEX_WGSL,
            channels: [], // resolved dynamically at render time via ping-pong
            texture: null,
            pipeline: null,
            bindGroup: null,
        });
        return this;
    }
    // -------------------------------------------------------------------------
    // GPU lifecycle (called by ShaderEffect — not public API)
    // -------------------------------------------------------------------------
    /**
     * Allocate GPU resources and compile all pipelines.
     * Called by ShaderEffect.create(); do not invoke directly.
     */
    async compile(device, format, uniformBuffer, width, height) {
        this.device = device;
        this.format = format;
        this.width = width;
        this.height = height;
        // Shared linear-clamp sampler (same for all channels, like DX12 static samplers)
        this.sampler = device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
        });
        // 1×1 black fallback texture for unconnected channel slots
        this.fallback = this._makeTexture(1, 1);
        device.queue.writeTexture({ texture: this.fallback }, new Uint8Array([0, 0, 0, 255]), { bytesPerRow: 4 }, [1, 1]);
        // Bind group layout used by ALL passes:
        //   binding 0 : BuiltinUniforms (uniform buffer)
        //   binding 1 : iChannel0 texture
        //   binding 2 : iChannel0Sampler
        //   binding 3 : iChannel1 texture
        //   binding 4 : iChannel1Sampler
        //   binding 5 : iChannel2 texture
        //   binding 6 : iChannel2Sampler
        //   binding 7 : iChannel3 texture
        //   binding 8 : iChannel3Sampler
        this.passBGL = device.createBindGroupLayout({
            label: 'sf:passBGL',
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {} },
                { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
                { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: {} },
                { binding: 4, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
                { binding: 5, visibility: GPUShaderStage.FRAGMENT, texture: {} },
                { binding: 6, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
                { binding: 7, visibility: GPUShaderStage.FRAGMENT, texture: {} },
                { binding: 8, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
            ],
        });
        const pipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [this.passBGL],
        });
        // Compile all scene pipelines and allocate their render textures
        for (const name of this.sceneOrder) {
            const p = this.sceneMap.get(name);
            p.texture = this._makeTexture(width, height);
            p.pipeline = await this._compilePipeline(device, pipelineLayout, format, p.fragSrc, p.vertSrc, name);
        }
        // Compile all post-FX pipelines (each reads iChannel0 = previous layer)
        for (const p of this.postFxRecords) {
            p.pipeline = await this._compilePipeline(device, pipelineLayout, format, p.fragSrc, p.vertSrc, p.name);
        }
        // Ping-pong textures for the post-FX chain
        if (this.postFxRecords.length > 0) {
            this.pingTex = this._makeTexture(width, height);
            this.pongTex = this._makeTexture(width, height);
        }
        this._rebuildSceneBindGroups(uniformBuffer);
    }
    /**
     * Destroy and recreate all size-dependent textures, then rebuild bind groups.
     * Called by ShaderEffect when the canvas is resized.
     */
    resize(uniformBuffer, width, height) {
        if (!this.device)
            return;
        this.width = width;
        this.height = height;
        for (const name of this.sceneOrder) {
            const p = this.sceneMap.get(name);
            p.texture?.destroy();
            p.texture = this._makeTexture(width, height);
        }
        if (this.postFxRecords.length > 0) {
            this.pingTex?.destroy();
            this.pongTex?.destroy();
            this.pingTex = this._makeTexture(width, height);
            this.pongTex = this._makeTexture(width, height);
        }
        this._rebuildSceneBindGroups(uniformBuffer);
    }
    /**
     * Execute the full stack for one frame.
     * The final output lands on `canvasView` (the current swap-chain texture view).
     * Called by ShaderEffect._renderFrame(); do not invoke directly.
     */
    render(encoder, canvasView, uniformBuffer) {
        if (!this.passBGL)
            return;
        const hasPostFx = this.postFxRecords.length > 0;
        // ---- 1. Render each named scene to its own off-screen texture ----------
        //
        // All scenes always render to their own texture so that later scenes can
        // sample any earlier scene regardless of order. The last scene's texture
        // seeds the post-FX chain (if present) or is blitted to the canvas.
        for (const name of this.sceneOrder) {
            const p = this.sceneMap.get(name);
            if (!p.pipeline || !p.texture)
                continue;
            // Lazily rebuild the bind group if it is missing (e.g. after resize)
            if (!p.bindGroup) {
                p.bindGroup = this._makeBindGroup(uniformBuffer, p.channels);
            }
            this._drawPass(encoder, p.pipeline, p.bindGroup, p.texture.createView());
        }
        // ---- 2. Post-FX chain with ping-pong textures --------------------------
        //
        // Each post-FX pass reads the previous layer via iChannel0.
        // The last post-FX pass renders directly to the canvas swap-chain view.
        if (hasPostFx) {
            // Seed: the last scene's output, or the fallback if there are no scenes.
            let prevTex = this.sceneOrder.length > 0
                ? this.sceneMap.get(this.sceneOrder[this.sceneOrder.length - 1]).texture
                : this.fallback;
            let pingA = this.pingTex;
            let pingB = this.pongTex;
            for (let i = 0; i < this.postFxRecords.length; i++) {
                const p = this.postFxRecords[i];
                if (!p.pipeline)
                    continue;
                const isLast = i === this.postFxRecords.length - 1;
                const targetView = isLast ? canvasView : pingA.createView();
                const bg = this._makeBindGroup(uniformBuffer, [
                    { channel: 0, source: '__prev' },
                ], prevTex);
                this._drawPass(encoder, p.pipeline, bg, targetView);
                if (!isLast) {
                    prevTex = pingA; // we just wrote to pingA
                    [pingA, pingB] = [pingB, pingA]; // swap for the next pass
                }
            }
            return;
        }
        // ---- 3. No post-FX: blit last scene to canvas --------------------------
        //
        // Use copyTextureToTexture for a zero-cost final blit when the off-screen
        // format matches the canvas format (guaranteed because we use `format`
        // for all textures).
        if (this.sceneOrder.length > 0) {
            const lastTex = this.sceneMap.get(this.sceneOrder[this.sceneOrder.length - 1]).texture;
            const canvasTex = canvasView.__texture;
            // We can't access the canvas GPUTexture directly from a view; use a blit pass instead.
            this._blitToCanvas(encoder, uniformBuffer, lastTex, canvasView);
        }
    }
    destroy() {
        for (const name of this.sceneOrder) {
            this.sceneMap.get(name)?.texture?.destroy();
        }
        this.pingTex?.destroy();
        this.pongTex?.destroy();
        this.fallback?.destroy();
    }
    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------
    _makeTexture(width, height) {
        return this.device.createTexture({
            size: [width, height],
            format: this.format,
            // TEXTURE_BINDING: can be sampled as iChannel input
            // RENDER_ATTACHMENT: can be used as a render target
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
        });
    }
    async _compilePipeline(device, layout, format, fragSrc, vertSrc, label) {
        // Prepend the built-in uniform struct and channel binding declarations
        const fullFrag = BUILTIN_UNIFORMS_WGSL + '\n' + CHANNEL_BINDINGS_WGSL + '\n' + fragSrc;
        return device.createRenderPipelineAsync({
            label: `sf:pass:${label}`,
            layout,
            vertex: {
                module: device.createShaderModule({ code: vertSrc, label: `sf:vert:${label}` }),
                entryPoint: 'main',
            },
            fragment: {
                module: device.createShaderModule({ code: fullFrag, label: `sf:frag:${label}` }),
                entryPoint: 'main',
                targets: [{ format }],
            },
            primitive: { topology: 'triangle-list' },
        });
    }
    /**
     * Build a bind group for a scene pass, resolving channel sources from the
     * scene map. `overridePrev` is used for post-FX passes where iChannel0 is
     * the dynamically determined previous-layer texture.
     */
    _makeBindGroup(uniformBuffer, channels, overridePrev) {
        const fallback = this.fallback;
        // Resolve the 4 channel textures
        const channelTextures = [
            fallback, fallback, fallback, fallback,
        ];
        for (const ch of channels) {
            if (ch.source === '__prev' && overridePrev) {
                channelTextures[ch.channel] = overridePrev;
            }
            else {
                const srcRecord = this.sceneMap.get(ch.source);
                if (srcRecord?.texture) {
                    channelTextures[ch.channel] = srcRecord.texture;
                }
            }
        }
        const s = this.sampler;
        return this.device.createBindGroup({
            label: 'sf:passBG',
            layout: this.passBGL,
            entries: [
                { binding: 0, resource: { buffer: uniformBuffer.gpuBuffer } },
                { binding: 1, resource: channelTextures[0].createView() },
                { binding: 2, resource: s },
                { binding: 3, resource: channelTextures[1].createView() },
                { binding: 4, resource: s },
                { binding: 5, resource: channelTextures[2].createView() },
                { binding: 6, resource: s },
                { binding: 7, resource: channelTextures[3].createView() },
                { binding: 8, resource: s },
            ],
        });
    }
    /** Rebuild the cached bind groups for all named scenes. */
    _rebuildSceneBindGroups(uniformBuffer) {
        for (const name of this.sceneOrder) {
            const p = this.sceneMap.get(name);
            p.bindGroup = this._makeBindGroup(uniformBuffer, p.channels);
        }
    }
    /** Execute one render pass into `targetView`. */
    _drawPass(encoder, pipeline, bindGroup, targetView) {
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                    view: targetView,
                    loadOp: 'clear',
                    storeOp: 'store',
                    clearValue: { r: 0, g: 0, b: 0, a: 1 },
                }],
        });
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.draw(6); // fullscreen-quad: 2 triangles, 6 vertices
        pass.end();
    }
    /**
     * Fallback blit: renders `srcTex` into `targetView` using a trivial
     * passthrough shader. Used when there are no post-FX passes and we need to
     * get the last scene's texture onto the canvas.
     */
    _blitToCanvas(encoder, uniformBuffer, srcTex, targetView) {
        if (!this.postFxRecords.length) {
            // Compile a one-shot blit pipeline if we haven't already
            if (!this._blitPipeline) {
                this._initBlitPipeline();
            }
            if (!this._blitPipeline)
                return;
            const bg = this._makeBindGroup(uniformBuffer, [{ channel: 0, source: '__prev' }], srcTex);
            this._drawPass(encoder, this._blitPipeline, bg, targetView);
        }
    }
    _blitPipeline = null;
    _initBlitPipeline() {
        if (!this.device || !this.format || !this.passBGL)
            return;
        const blitFrag = /* wgsl */ `
${BUILTIN_UNIFORMS_WGSL}
${CHANNEL_BINDINGS_WGSL}
@fragment
fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let uv = pos.xy / uniforms.resolution;
  return textureSample(iChannel0, iChannel0Sampler, vec2f(uv.x, 1.0 - uv.y));
}
`;
        // Fire-and-forget async compile — will be ready by the next frame
        this.device.createRenderPipelineAsync({
            label: 'sf:blit',
            layout: this.device.createPipelineLayout({ bindGroupLayouts: [this.passBGL] }),
            vertex: {
                module: this.device.createShaderModule({ code: DEFAULT_VERTEX_WGSL }),
                entryPoint: 'main',
            },
            fragment: {
                module: this.device.createShaderModule({ code: blitFrag }),
                entryPoint: 'main',
                targets: [{ format: this.format }],
            },
            primitive: { topology: 'triangle-list' },
        }).then(p => { this._blitPipeline = p; });
    }
}
//# sourceMappingURL=passes.js.map