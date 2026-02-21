/**
 * Default WGSL shaders used when none are supplied by the caller.
 *
 * The built-in uniform block (BuiltinUniforms) is automatically prepended to
 * every shader so that `uniforms.time`, `uniforms.beat`, etc. are always
 * available without the author having to declare them.
 */
/** WGSL struct declaration injected at the top of every shader. */
export declare const BUILTIN_UNIFORMS_WGSL = "\nstruct BuiltinUniforms {\n  time           : f32,   // seconds since effect start\n  frame          : u32,   // frame counter\n  resolution     : vec2f, // viewport size in pixels\n  mouse          : vec2f, // pointer position in pixels\n  bpm            : f32,   // beats per minute\n  beat           : f32,   // absolute beat (fractional)\n  barProgress    : f32,   // 0\u21921 progress within the current bar\n  quarterPhase   : f32,   // 0\u21921 phase within a quarter note\n  eighthPhase    : f32,   // 0\u21921 phase within an eighth note\n  sixteenthPhase : f32,   // 0\u21921 phase within a sixteenth note\n}\n@group(0) @binding(0) var<uniform> uniforms : BuiltinUniforms;\n";
/**
 * Default fullscreen-quad vertex shader.
 * Produces a clip-space triangle pair that covers the entire viewport.
 * No vertex buffer is needed — positions are computed from the vertex index.
 */
export declare const DEFAULT_VERTEX_WGSL = "\n\nstruct BuiltinUniforms {\n  time           : f32,   // seconds since effect start\n  frame          : u32,   // frame counter\n  resolution     : vec2f, // viewport size in pixels\n  mouse          : vec2f, // pointer position in pixels\n  bpm            : f32,   // beats per minute\n  beat           : f32,   // absolute beat (fractional)\n  barProgress    : f32,   // 0\u21921 progress within the current bar\n  quarterPhase   : f32,   // 0\u21921 phase within a quarter note\n  eighthPhase    : f32,   // 0\u21921 phase within an eighth note\n  sixteenthPhase : f32,   // 0\u21921 phase within a sixteenth note\n}\n@group(0) @binding(0) var<uniform> uniforms : BuiltinUniforms;\n\n\n@vertex\nfn main(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4f {\n  // Two triangles covering the full screen, driven by vertex index alone\n  let pos = array<vec2f, 6>(\n    vec2f(-1.0, -1.0), vec2f( 1.0, -1.0), vec2f(-1.0,  1.0),\n    vec2f(-1.0,  1.0), vec2f( 1.0, -1.0), vec2f( 1.0,  1.0),\n  );\n  return vec4f(pos[vertexIndex], 0.0, 1.0);\n}\n";
/**
 * WGSL channel binding declarations — injected before user shader code in
 * every RenderPass and PostFxPass.
 *
 * Mirrors ShaderLabDX12's root signature (t0–t3) and ShaderToy's iChannel0..3.
 * Channels that are not wired to a source receive a 1×1 black fallback texture
 * so the shader always compiles successfully regardless of which slots are used.
 *
 * Usage in a fragment shader (no redeclaration needed):
 * ```wgsl
 *   let col = textureSample(iChannel0, iChannel0Sampler, uv);
 * ```
 */
export declare const CHANNEL_BINDINGS_WGSL = "\n@group(0) @binding(1) var iChannel0        : texture_2d<f32>;\n@group(0) @binding(2) var iChannel0Sampler : sampler;\n@group(0) @binding(3) var iChannel1        : texture_2d<f32>;\n@group(0) @binding(4) var iChannel1Sampler : sampler;\n@group(0) @binding(5) var iChannel2        : texture_2d<f32>;\n@group(0) @binding(6) var iChannel2Sampler : sampler;\n@group(0) @binding(7) var iChannel3        : texture_2d<f32>;\n@group(0) @binding(8) var iChannel3Sampler : sampler;\n";
export declare const DEFAULT_FRAGMENT_WGSL = "\n\nstruct BuiltinUniforms {\n  time           : f32,   // seconds since effect start\n  frame          : u32,   // frame counter\n  resolution     : vec2f, // viewport size in pixels\n  mouse          : vec2f, // pointer position in pixels\n  bpm            : f32,   // beats per minute\n  beat           : f32,   // absolute beat (fractional)\n  barProgress    : f32,   // 0\u21921 progress within the current bar\n  quarterPhase   : f32,   // 0\u21921 phase within a quarter note\n  eighthPhase    : f32,   // 0\u21921 phase within an eighth note\n  sixteenthPhase : f32,   // 0\u21921 phase within a sixteenth note\n}\n@group(0) @binding(0) var<uniform> uniforms : BuiltinUniforms;\n\n\n@fragment\nfn main(@builtin(position) fragCoord : vec4f) -> @location(0) vec4f {\n  let uv    = fragCoord.xy / uniforms.resolution;\n  let pulse = 1.0 - uniforms.quarterPhase * 0.3; // subtle brightness pulse on beat\n  let col   = 0.5 + 0.5 * cos(uniforms.time + uv.xyx + vec3f(0.0, 2.0, 4.0));\n  return vec4f(col * pulse, 1.0);\n}\n";
//# sourceMappingURL=defaults.d.ts.map