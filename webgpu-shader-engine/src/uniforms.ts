/**
 * UniformBuffer
 *
 * Hides WebGPU buffer alignment rules (std140 / std430) from callers.
 * Users set values by name; padding and stride are computed automatically.
 *
 * The buffer layout is fixed at construction time and matches the
 * `BuiltinUniforms` struct declared in defaults.ts:
 *
 *   offset 0  : f32  time
 *   offset 4  : u32  frame
 *   offset 8  : vec2f resolution   (8-byte aligned)
 *   offset 16 : vec2f mouse        (8-byte aligned)
 *   --- total: 24 bytes, padded to 32 bytes (next 16-byte boundary) ---
 *
 * Custom uniforms can be layered on top of this in future milestones.
 */

/** Total byte size of the built-in uniform block (padded to 16-byte boundary). */
export const BUILTIN_BUFFER_SIZE = 32;

/** Byte offsets for each built-in field. */
const OFFSETS = {
  time: 0,
  frame: 4,
  resolution: 8,
  mouse: 16,
} as const;

export type BuiltinUniformName = keyof typeof OFFSETS;

export class UniformBuffer {
  private readonly buffer: GPUBuffer;
  private readonly data: ArrayBuffer;
  private readonly f32: Float32Array;
  private readonly u32: Uint32Array;

  constructor(private readonly device: GPUDevice) {
    this.data = new ArrayBuffer(BUILTIN_BUFFER_SIZE);
    this.f32 = new Float32Array(this.data);
    this.u32 = new Uint32Array(this.data);

    this.buffer = device.createBuffer({
      size: BUILTIN_BUFFER_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  /** Update `time` (seconds since effect start). */
  setTime(value: number): void {
    this.f32[OFFSETS.time / 4] = value;
  }

  /** Update `frame` counter. */
  setFrame(value: number): void {
    this.u32[OFFSETS.frame / 4] = value;
  }

  /** Update `resolution` (width, height in pixels). */
  setResolution(width: number, height: number): void {
    const base = OFFSETS.resolution / 4;
    this.f32[base] = width;
    this.f32[base + 1] = height;
  }

  /** Update `mouse` (x, y in pixels from top-left). */
  setMouse(x: number, y: number): void {
    const base = OFFSETS.mouse / 4;
    this.f32[base] = x;
    this.f32[base + 1] = y;
  }

  /** Push the CPU-side data to the GPU buffer. Call once per frame. */
  upload(): void {
    this.device.queue.writeBuffer(this.buffer, 0, this.data);
  }

  /** The underlying `GPUBuffer` to bind in a bind group. */
  get gpuBuffer(): GPUBuffer {
    return this.buffer;
  }

  destroy(): void {
    this.buffer.destroy();
  }
}
