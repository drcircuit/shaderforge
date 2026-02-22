/**
 * Returns a user-friendly error message when WebGPU is unavailable or fails to initialize.
 * The message may contain a `\n` line-break; render it inside an element with
 * `white-space: pre-wrap` so the newline displays correctly in HTML.
 */
export function webgpuInitError(err: unknown): string {
  const base = 'Failed to initialize WebGPU. Please ensure your browser supports WebGPU.';
  return err instanceof Error && err.message ? `${base}\nDetails: ${err.message}` : base;
}
