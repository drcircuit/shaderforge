/**
 * Default WGSL shaders used when none are supplied by the caller.
 *
 * The built-in uniform block (BuiltinUniforms) is automatically prepended to
 * every shader so that `uniforms.time`, `uniforms.resolution`, etc. are always
 * available without the author having to declare them.
 */

/** WGSL struct declaration injected at the top of every shader. */
export const BUILTIN_UNIFORMS_WGSL = /* wgsl */ `
struct BuiltinUniforms {
  time       : f32,
  frame      : u32,
  resolution : vec2f,
  mouse      : vec2f,
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
 * Starter fragment shader shown in the editor when creating a new effect.
 * Displays a classic UV colour sweep that reacts to time.
 */
export const DEFAULT_FRAGMENT_WGSL = /* wgsl */ `
${BUILTIN_UNIFORMS_WGSL}

@fragment
fn main(@builtin(position) fragCoord : vec4f) -> @location(0) vec4f {
  let uv  = fragCoord.xy / uniforms.resolution;
  let col = 0.5 + 0.5 * cos(uniforms.time + uv.xyx + vec3f(0.0, 2.0, 4.0));
  return vec4f(col, 1.0);
}
`;
