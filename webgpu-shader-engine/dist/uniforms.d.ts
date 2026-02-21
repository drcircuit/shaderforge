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
export declare const BUILTIN_BUFFER_SIZE = 48;
export declare class UniformBuffer {
    private readonly device;
    private readonly buffer;
    private readonly data;
    private readonly f32;
    private readonly u32;
    constructor(device: GPUDevice);
    /** Update `time` (seconds since effect start). */
    setTime(value: number): void;
    /** Update `frame` counter. */
    setFrame(value: number): void;
    /** Update `resolution` (width, height in pixels). */
    setResolution(width: number, height: number): void;
    /** Update `mouse` (x, y in pixels from top-left). */
    setMouse(x: number, y: number): void;
    /** Update all beat-clock derived uniforms in one call (zero overhead path). */
    setBeatUniforms(bpm: number, beat: number, barProgress: number, quarterPhase: number, eighthPhase: number, sixteenthPhase: number): void;
    /** Push the CPU-side data to the GPU buffer. Call once per frame. */
    upload(): void;
    /** The underlying `GPUBuffer` to bind in a bind group. */
    get gpuBuffer(): GPUBuffer;
    destroy(): void;
}
//# sourceMappingURL=uniforms.d.ts.map