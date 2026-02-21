/**
 * UniformBuffer
 *
 * Hides WebGPU buffer alignment rules (std140 / std430) from callers.
 * Users set values by name; padding and stride are computed automatically.
 *
 * The buffer layout is fixed at construction time and matches the
 * `BuiltinUniforms` struct declared in defaults.ts:
 *
 *   offset  0 : f32   time           — seconds since effect start
 *   offset  4 : u32   frame          — frame counter
 *   offset  8 : vec2f resolution     — viewport size in pixels  (8-byte aligned)
 *   offset 16 : vec2f mouse          — mouse/pointer position   (8-byte aligned)
 *   offset 24 : f32   bpm            — beats-per-minute
 *   offset 28 : f32   beat           — absolute beat count (fractional)
 *   offset 32 : f32   barProgress    — 0.0 → 1.0 progress through the current bar
 *   offset 36 : f32   quarterPhase   — 0.0 → 1.0 phase within a quarter note
 *   offset 40 : f32   eighthPhase    — 0.0 → 1.0 phase within an eighth note
 *   offset 44 : f32   sixteenthPhase — 0.0 → 1.0 phase within a sixteenth note
 *   --- total: 48 bytes (already a multiple of 16) ---
 */

/** Total byte size of the built-in uniform block. */
export const BUILTIN_BUFFER_SIZE = 48;

/** Byte offsets for each built-in field (divide by 4 to get Float32Array index). */
const F = {
  time: 0,
  frame: 4,          // written as u32
  resolution: 8,     // vec2f
  mouse: 16,         // vec2f
  bpm: 24,
  beat: 28,
  barProgress: 32,
  quarterPhase: 36,
  eighthPhase: 40,
  sixteenthPhase: 44,
} as const;

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
    this.f32[F.time / 4] = value;
  }

  /** Update `frame` counter. */
  setFrame(value: number): void {
    this.u32[F.frame / 4] = value;
  }

  /** Update `resolution` (width, height in pixels). */
  setResolution(width: number, height: number): void {
    this.f32[F.resolution / 4] = width;
    this.f32[F.resolution / 4 + 1] = height;
  }

  /** Update `mouse` (x, y in pixels from top-left). */
  setMouse(x: number, y: number): void {
    this.f32[F.mouse / 4] = x;
    this.f32[F.mouse / 4 + 1] = y;
  }

  /** Update all beat-clock derived uniforms in one call (zero overhead path). */
  setBeatUniforms(
    bpm: number,
    beat: number,
    barProgress: number,
    quarterPhase: number,
    eighthPhase: number,
    sixteenthPhase: number,
  ): void {
    this.f32[F.bpm / 4] = bpm;
    this.f32[F.beat / 4] = beat;
    this.f32[F.barProgress / 4] = barProgress;
    this.f32[F.quarterPhase / 4] = quarterPhase;
    this.f32[F.eighthPhase / 4] = eighthPhase;
    this.f32[F.sixteenthPhase / 4] = sixteenthPhase;
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

