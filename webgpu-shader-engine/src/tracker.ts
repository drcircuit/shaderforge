/**
 * Tracker — Beat-synchronised animation for shader uniforms.
 *
 * Two classes work together, mirroring ShaderLabDX12's audio module:
 *
 *  • BeatClock  — translates a raw audio/wall-clock time into BPM-derived
 *                 counters and phase values (ported from src/audio/BeatClock.cpp).
 *
 *  • Tracker    — a GNU-Rocket-style keyframe timeline where each "track"
 *                 animates one named value over rows (rows = beat subdivisions).
 *                 Tracks can be bound to shader uniforms so they update
 *                 automatically every frame.
 */

// ---------------------------------------------------------------------------
// BeatClock
// ---------------------------------------------------------------------------

export interface BeatClockState {
  /** Absolute beat count (fractional). */
  beat: number;
  /** 0 → 1 progress through the current bar. */
  barProgress: number;
  /** 0 → 1 phase within a quarter note. */
  quarterPhase: number;
  /** 0 → 1 phase within an eighth note. */
  eighthPhase: number;
  /** 0 → 1 phase within a sixteenth note. */
  sixteenthPhase: number;
  /** Integer quarter-note count since start. */
  quarterNoteCount: number;
  /** Integer eighth-note count since start. */
  eighthNoteCount: number;
  /** Integer sixteenth-note count since start. */
  sixteenthNoteCount: number;
  /** Integer bar count since start. */
  barCount: number;
  /** True for exactly one frame when a new quarter note begins. */
  hitQuarterNote: boolean;
  /** True for exactly one frame when a new eighth note begins. */
  hitEighthNote: boolean;
  /** True for exactly one frame when a new sixteenth note begins. */
  hitSixteenthNote: boolean;
  /** True for exactly one frame when a new bar begins. */
  hitBar: boolean;
  /** The beat within the current bar (0 … beatsPerBar − 1). */
  beatInBar: number;
}

export class BeatClock {
  private bpm = 120;
  private beatsPerBar = 4;
  private audioTime = 0;
  private prevQuarter = 0;
  private prevEighth = 0;
  private prevSixteenth = 0;
  private prevBar = 0;

  setBPM(bpm: number): void {
    this.bpm = bpm > 0 ? bpm : 120;
  }

  setTimeSignature(beatsPerBar: number): void {
    this.beatsPerBar = beatsPerBar > 0 ? beatsPerBar : 4;
  }

  getBPM(): number {
    return this.bpm;
  }

  /** Feed the current playback position (in seconds) to update all counters. */
  update(audioTimeInSeconds: number): BeatClockState {
    this.audioTime = audioTimeInSeconds;

    const spb = 60 / this.bpm;           // seconds per beat (quarter note)
    const spe = spb * 0.5;               // seconds per eighth note
    const sps = spb * 0.25;              // seconds per sixteenth note
    const spBar = spb * this.beatsPerBar; // seconds per bar

    const t = this.audioTime;

    const quarterNoteCount = Math.floor(t / spb);
    const eighthNoteCount = Math.floor(t / spe);
    const sixteenthNoteCount = Math.floor(t / sps);
    const barCount = Math.floor(t / spBar);

    const hitQuarterNote = quarterNoteCount !== this.prevQuarter;
    const hitEighthNote = eighthNoteCount !== this.prevEighth;
    const hitSixteenthNote = sixteenthNoteCount !== this.prevSixteenth;
    const hitBar = barCount !== this.prevBar;

    this.prevQuarter = quarterNoteCount;
    this.prevEighth = eighthNoteCount;
    this.prevSixteenth = sixteenthNoteCount;
    this.prevBar = barCount;

    const beat = t / spb;
    const barProgress = spBar > 0 ? (t % spBar) / spBar : 0;
    const quarterPhase = spb > 0 ? (t % spb) / spb : 0;
    const eighthPhase = spe > 0 ? (t % spe) / spe : 0;
    const sixteenthPhase = sps > 0 ? (t % sps) / sps : 0;
    const beatInBar = quarterNoteCount % this.beatsPerBar;

    return {
      beat,
      barProgress,
      quarterPhase,
      eighthPhase,
      sixteenthPhase,
      quarterNoteCount,
      eighthNoteCount,
      sixteenthNoteCount,
      barCount,
      hitQuarterNote,
      hitEighthNote,
      hitSixteenthNote,
      hitBar,
      beatInBar,
    };
  }

  reset(): void {
    this.audioTime = 0;
    this.prevQuarter = 0;
    this.prevEighth = 0;
    this.prevSixteenth = 0;
    this.prevBar = 0;
  }
}

// ---------------------------------------------------------------------------
// Tracker timeline
// ---------------------------------------------------------------------------

export type InterpolationType = 'linear' | 'smooth' | 'constant';

export interface Keyframe {
  /** Row index on the timeline. One row = one beat subdivision (see rowsPerBeat). */
  row: number;
  /** Value at this keyframe. */
  value: number;
  /** How to interpolate from this keyframe to the next. Default: 'linear'. */
  interpolation?: InterpolationType;
}

export interface TrackerOptions {
  /** Beats per minute. Default: 120. */
  bpm?: number;
  /** How many rows equal one quarter-note beat. Default: 4 (so 16 rows = one bar in 4/4). */
  rowsPerBeat?: number;
  /** Beats per bar (time signature numerator). Default: 4. */
  beatsPerBar?: number;
  /** Total rows in the timeline. Default: 512. */
  rows?: number;
}

/** Smooth-step (cubic ease-in-out) — same as GLSL smoothstep. */
function smoothStep(t: number): number {
  return t * t * (3 - 2 * t);
}

function interpolate(a: number, b: number, t: number, mode: InterpolationType): number {
  switch (mode) {
    case 'constant': return a;
    case 'smooth':   return a + (b - a) * smoothStep(Math.max(0, Math.min(1, t)));
    case 'linear':
    default:         return a + (b - a) * Math.max(0, Math.min(1, t));
  }
}

class Track {
  private readonly sorted: Required<Keyframe>[];

  constructor(keyframes: Keyframe[]) {
    this.sorted = keyframes
      .map(k => ({ row: k.row, value: k.value, interpolation: k.interpolation ?? 'linear' }))
      .sort((a, b) => a.row - b.row);
  }

  getValue(row: number): number {
    const kf = this.sorted;
    if (kf.length === 0) return 0;
    if (row <= kf[0].row) return kf[0].value;
    if (row >= kf[kf.length - 1].row) return kf[kf.length - 1].value;

    // Binary search for the surrounding pair
    let lo = 0;
    let hi = kf.length - 2;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (kf[mid + 1].row <= row) lo = mid + 1;
      else hi = mid;
    }

    const a = kf[lo];
    const b = kf[lo + 1];
    const span = b.row - a.row;
    const t = span > 0 ? (row - a.row) / span : 0;
    return interpolate(a.value, b.value, t, a.interpolation);
  }
}

export class Tracker {
  private readonly clock: BeatClock;
  private readonly rowsPerBeat: number;
  private readonly totalRows: number;
  private readonly tracks = new Map<string, Track>();

  private currentRow = 0;
  private playing = false;
  private startTime = 0;         // performance.now() snapshot when play() was called
  private offsetSeconds = 0;    // seconds already elapsed before the current play() call

  constructor(options: TrackerOptions = {}) {
    const {
      bpm = 120,
      rowsPerBeat = 4,
      beatsPerBar = 4,
      rows = 512,
    } = options;

    this.clock = new BeatClock();
    this.clock.setBPM(bpm);
    this.clock.setTimeSignature(beatsPerBar);
    this.rowsPerBeat = rowsPerBeat;
    this.totalRows = rows;
  }

  /**
   * Add (or replace) a named track on the timeline.
   * @param name   The name used to reference this track (and optionally bind to a uniform).
   * @param keyframes  Array of keyframes — does not need to be sorted.
   */
  track(name: string, keyframes: Keyframe[]): this {
    this.tracks.set(name, new Track(keyframes));
    return this;
  }

  getBPM(): number {
    return this.clock.getBPM();
  }

  /** Get the current interpolated value for a named track at the current playhead position. */
  getValue(name: string): number {
    return this.tracks.get(name)?.getValue(this.currentRow) ?? 0;
  }

  /** Get the interpolated value for a named track at an explicit row. */
  getValueAt(name: string, row: number): number {
    return this.tracks.get(name)?.getValue(row) ?? 0;
  }

  /** Start (or resume) playback. */
  play(): void {
    if (!this.playing) {
      this.startTime = performance.now();
      this.playing = true;
    }
  }

  /** Pause playback, preserving the current position. */
  pause(): void {
    if (this.playing) {
      this.offsetSeconds += (performance.now() - this.startTime) / 1000;
      this.playing = false;
    }
  }

  /** Stop playback and reset to row 0. */
  stop(): void {
    this.playing = false;
    this.offsetSeconds = 0;
    this.currentRow = 0;
    this.clock.reset();
  }

  /** Seek to a specific row. */
  seekRow(row: number): void {
    this.currentRow = Math.max(0, Math.min(this.totalRows - 1, row));
    const secondsPerRow = (60 / this.clock.getBPM()) / this.rowsPerBeat;
    this.offsetSeconds = this.currentRow * secondsPerRow;
    if (this.playing) {
      this.startTime = performance.now();
    }
  }

  /**
   * Advance the tracker by one frame and return the current BeatClockState.
   * Call this once per animation frame (inside your requestAnimationFrame loop).
   * The ShaderEffect class calls this automatically when a Tracker is attached.
   */
  tick(): BeatClockState {
    const elapsed = this.playing
      ? this.offsetSeconds + (performance.now() - this.startTime) / 1000
      : this.offsetSeconds;

    const secondsPerRow = (60 / this.clock.getBPM()) / this.rowsPerBeat;
    this.currentRow = Math.floor(elapsed / secondsPerRow) % this.totalRows;

    return this.clock.update(elapsed);
  }

  get row(): number { return this.currentRow; }
  get isPlaying(): boolean { return this.playing; }
}

// ---------------------------------------------------------------------------
// Playlist
// ---------------------------------------------------------------------------

/** One entry in a demo playlist: a shader plus how long it runs (in bars). */
export interface PlaylistEntry {
  /** WGSL fragment shader source. */
  fragmentShader: string;
  /** Optional WGSL vertex shader source. Defaults to the built-in fullscreen quad. */
  vertexShader?: string;
  /** Duration in bars. */
  durationBars: number;
}

/**
 * Playlist sequences multiple shaders with beat-anchored transitions.
 * Hand a Playlist to ShaderEffect (future M4 feature) to run a full demo.
 */
export class Playlist {
  private entries: PlaylistEntry[] = [];

  add(entry: PlaylistEntry): this {
    this.entries.push(entry);
    return this;
  }

  getEntries(): readonly PlaylistEntry[] {
    return this.entries;
  }

  /**
   * Given a bar number, return the active playlist entry and the local bar
   * offset within that entry.
   */
  resolve(barNumber: number): { entry: PlaylistEntry; localBar: number } | null {
    let bar = barNumber;
    for (const entry of this.entries) {
      if (bar < entry.durationBars) {
        return { entry, localBar: bar };
      }
      bar -= entry.durationBars;
    }
    return null;
  }

  get totalBars(): number {
    return this.entries.reduce((s, e) => s + e.durationBars, 0);
  }
}
