/**
 * Default WGSL shaders used when none are supplied by the caller.
 *
 * The built-in uniform block (BuiltinUniforms) is automatically prepended to
 * every shader so that `uniforms.time`, `uniforms.beat`, etc. are always
 * available without the author having to declare them.
 */
/** WGSL struct declaration injected at the top of every shader. */
export const BUILTIN_UNIFORMS_WGSL = /* wgsl */ `
struct BuiltinUniforms {
  time           : f32,   // seconds since effect start
  frame          : u32,   // frame counter
  resolution     : vec2f, // viewport size in pixels
  mouse          : vec2f, // pointer position in pixels
  bpm            : f32,   // beats per minute
  beat           : f32,   // absolute beat (fractional)
  barProgress    : f32,   // 0→1 progress within the current bar
  quarterPhase   : f32,   // 0→1 phase within a quarter note
  eighthPhase    : f32,   // 0→1 phase within an eighth note
  sixteenthPhase : f32,   // 0→1 phase within a sixteenth note
}
@group(0) @binding(0) var<uniform> uniforms : BuiltinUniforms;
`;
/**
 * Default fullscreen-quad vertex shader.
 * Produces a clip-space triangle pair that covers the entire viewport.
 * No vertex buffer is needed — positions are computed from the vertex index.
 */
export const DEFAULT_VERTEX_WGSL = /* wgsl */ `
${BUILTIN_UNIFORMS_WGSL}

@vertex
fn main(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4f {
  // Two triangles covering the full screen, driven by vertex index alone
  let pos = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f( 1.0, -1.0), vec2f(-1.0,  1.0),
    vec2f(-1.0,  1.0), vec2f( 1.0, -1.0), vec2f( 1.0,  1.0),
  );
  return vec4f(pos[vertexIndex], 0.0, 1.0);
}
`;
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
export const CHANNEL_BINDINGS_WGSL = /* wgsl */ `
@group(0) @binding(1) var iChannel0        : texture_2d<f32>;
@group(0) @binding(2) var iChannel0Sampler : sampler;
@group(0) @binding(3) var iChannel1        : texture_2d<f32>;
@group(0) @binding(4) var iChannel1Sampler : sampler;
@group(0) @binding(5) var iChannel2        : texture_2d<f32>;
@group(0) @binding(6) var iChannel2Sampler : sampler;
@group(0) @binding(7) var iChannel3        : texture_2d<f32>;
@group(0) @binding(8) var iChannel3Sampler : sampler;
`;
export const DEFAULT_FRAGMENT_WGSL = /* wgsl */ `
${BUILTIN_UNIFORMS_WGSL}

@fragment
fn main(@builtin(position) fragCoord : vec4f) -> @location(0) vec4f {
  let uv    = fragCoord.xy / uniforms.resolution;
  let pulse = 1.0 - uniforms.quarterPhase * 0.3; // subtle brightness pulse on beat
  let col   = 0.5 + 0.5 * cos(uniforms.time + uv.xyx + vec3f(0.0, 2.0, 4.0));
  return vec4f(col * pulse, 1.0);
}
`;
//# sourceMappingURL=defaults.js.map