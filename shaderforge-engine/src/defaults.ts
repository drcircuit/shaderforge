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

/**
 * Fragment shader body for use inside a LayerStack scene or post-FX pass.
 * Unlike DEFAULT_FRAGMENT_WGSL, this does NOT redeclare BuiltinUniforms —
 * the LayerStack prepends them automatically via BUILTIN_UNIFORMS_WGSL +
 * CHANNEL_BINDINGS_WGSL.
 */
export const DEFAULT_SCENE_FRAGMENT_WGSL = /* wgsl */ `
@fragment
fn main(@builtin(position) fragCoord : vec4f) -> @location(0) vec4f {
  let uv    = fragCoord.xy / uniforms.resolution;
  let pulse = 1.0 - uniforms.quarterPhase * 0.3;
  let col   = 0.5 + 0.5 * cos(uniforms.time + uv.xyx + vec3f(0.0, 2.0, 4.0));
  return vec4f(col * pulse, 1.0);
}
`;

/**
 * Vertex shader for a rotating unit cube.
 * Outputs 36 vertices (6 faces × 2 triangles × 3 vertices) from vertex_index.
 * The cube auto-rotates using uniforms.time.
 */
export const DEFAULT_CUBE_VERTEX_WGSL = /* wgsl */ `
${BUILTIN_UNIFORMS_WGSL}

@vertex
fn main(@builtin(vertex_index) idx : u32) -> @builtin(position) vec4f {
  // 36 vertices — unit cube centered at origin
  var p = array<vec3f, 36>(
    // -Z face
    vec3f(-1.0,-1.0,-1.0), vec3f( 1.0,-1.0,-1.0), vec3f(-1.0, 1.0,-1.0),
    vec3f(-1.0, 1.0,-1.0), vec3f( 1.0,-1.0,-1.0), vec3f( 1.0, 1.0,-1.0),
    // +Z face
    vec3f( 1.0,-1.0, 1.0), vec3f(-1.0,-1.0, 1.0), vec3f( 1.0, 1.0, 1.0),
    vec3f( 1.0, 1.0, 1.0), vec3f(-1.0,-1.0, 1.0), vec3f(-1.0, 1.0, 1.0),
    // -X face
    vec3f(-1.0,-1.0, 1.0), vec3f(-1.0,-1.0,-1.0), vec3f(-1.0, 1.0, 1.0),
    vec3f(-1.0, 1.0, 1.0), vec3f(-1.0,-1.0,-1.0), vec3f(-1.0, 1.0,-1.0),
    // +X face
    vec3f( 1.0,-1.0,-1.0), vec3f( 1.0,-1.0, 1.0), vec3f( 1.0, 1.0,-1.0),
    vec3f( 1.0, 1.0,-1.0), vec3f( 1.0,-1.0, 1.0), vec3f( 1.0, 1.0, 1.0),
    // -Y face
    vec3f(-1.0,-1.0, 1.0), vec3f( 1.0,-1.0, 1.0), vec3f(-1.0,-1.0,-1.0),
    vec3f(-1.0,-1.0,-1.0), vec3f( 1.0,-1.0, 1.0), vec3f( 1.0,-1.0,-1.0),
    // +Y face
    vec3f(-1.0, 1.0,-1.0), vec3f( 1.0, 1.0,-1.0), vec3f(-1.0, 1.0, 1.0),
    vec3f(-1.0, 1.0, 1.0), vec3f( 1.0, 1.0,-1.0), vec3f( 1.0, 1.0, 1.0),
  );

  let angle = uniforms.time * 0.5;
  let c = cos(angle); let s = sin(angle);
  // Rotate around Y axis (columns of mat3x3f)
  let rotY = mat3x3f(
    vec3f( c,   0.0, s  ),
    vec3f( 0.0, 1.0, 0.0),
    vec3f(-s,   0.0, c  ),
  );
  let worldPos = rotY * p[idx];

  // Perspective projection: camera at z = -4, fov ~60°
  let aspect = uniforms.resolution.x / uniforms.resolution.y;
  let camDist = 4.0;
  let viewZ   = worldPos.z + camDist;
  let fov     = 1.732; // 1 / tan(30°) ≈ 1.732 for 60° vertical fov
  let clipX   = worldPos.x * fov / (viewZ * aspect);
  let clipY   = worldPos.y * fov / viewZ;
  let clipZ   = (viewZ - 0.1) / (100.0 - 0.1);
  return vec4f(clipX, clipY, clipZ, 1.0);
}
`;

/**
 * Vertex shader for a rotating UV sphere (32 slices × 16 stacks = 3072 vertices).
 * The sphere auto-rotates using uniforms.time.
 */
export const DEFAULT_SPHERE_VERTEX_WGSL = /* wgsl */ `
${BUILTIN_UNIFORMS_WGSL}

const PI = 3.14159265358979;
const SLICES = 32u;
const STACKS = 16u;

@vertex
fn main(@builtin(vertex_index) idx : u32) -> @builtin(position) vec4f {
  // Each quad cell = 6 vertices (2 triangles)
  let quadIdx  = idx / 6u;
  let vertInQ  = idx % 6u;
  let stack    = quadIdx / SLICES;
  let slice    = quadIdx % SLICES;

  let phi0   = f32(stack)      / f32(STACKS) * PI;
  let phi1   = f32(stack + 1u) / f32(STACKS) * PI;
  let theta0 = f32(slice)      / f32(SLICES) * 2.0 * PI;
  let theta1 = f32(slice + 1u) / f32(SLICES) * 2.0 * PI;

  let c0 = vec3f(sin(phi0)*cos(theta0), cos(phi0), sin(phi0)*sin(theta0));
  let c1 = vec3f(sin(phi0)*cos(theta1), cos(phi0), sin(phi0)*sin(theta1));
  let c2 = vec3f(sin(phi1)*cos(theta0), cos(phi1), sin(phi1)*sin(theta0));
  let c3 = vec3f(sin(phi1)*cos(theta1), cos(phi1), sin(phi1)*sin(theta1));

  var worldPos: vec3f;
  switch(vertInQ) {
    case 0u: { worldPos = c0; }
    case 1u: { worldPos = c1; }
    case 2u: { worldPos = c2; }
    case 3u: { worldPos = c2; }
    case 4u: { worldPos = c1; }
    default: { worldPos = c3; }
  }

  let angle = uniforms.time * 0.4;
  let c = cos(angle); let s = sin(angle);
  let rotY = mat3x3f(
    vec3f( c,   0.0, s  ),
    vec3f( 0.0, 1.0, 0.0),
    vec3f(-s,   0.0, c  ),
  );
  worldPos = rotY * worldPos;

  let aspect  = uniforms.resolution.x / uniforms.resolution.y;
  let camDist = 3.0;
  let viewZ   = worldPos.z + camDist;
  let fov     = 1.732;
  let clipX   = worldPos.x * fov / (viewZ * aspect);
  let clipY   = worldPos.y * fov / viewZ;
  let clipZ   = (viewZ - 0.1) / (100.0 - 0.1);
  return vec4f(clipX, clipY, clipZ, 1.0);
}
`;

