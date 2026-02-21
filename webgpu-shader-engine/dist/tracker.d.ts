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
export declare class BeatClock {
    private bpm;
    private beatsPerBar;
    private audioTime;
    private prevQuarter;
    private prevEighth;
    private prevSixteenth;
    private prevBar;
    setBPM(bpm: number): void;
    setTimeSignature(beatsPerBar: number): void;
    getBPM(): number;
    /** Feed the current playback position (in seconds) to update all counters. */
    update(audioTimeInSeconds: number): BeatClockState;
    reset(): void;
}
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
export declare class Tracker {
    private readonly clock;
    private readonly rowsPerBeat;
    private readonly totalRows;
    private readonly tracks;
    private currentRow;
    private playing;
    private startTime;
    private offsetSeconds;
    constructor(options?: TrackerOptions);
    /**
     * Add (or replace) a named track on the timeline.
     * @param name   The name used to reference this track (and optionally bind to a uniform).
     * @param keyframes  Array of keyframes — does not need to be sorted.
     */
    track(name: string, keyframes: Keyframe[]): this;
    getBPM(): number;
    /** Get the current interpolated value for a named track at the current playhead position. */
    getValue(name: string): number;
    /** Get the interpolated value for a named track at an explicit row. */
    getValueAt(name: string, row: number): number;
    /** Start (or resume) playback. */
    play(): void;
    /** Pause playback, preserving the current position. */
    pause(): void;
    /** Stop playback and reset to row 0. */
    stop(): void;
    /** Seek to a specific row. */
    seekRow(row: number): void;
    /**
     * Advance the tracker by one frame and return the current BeatClockState.
     * Call this once per animation frame (inside your requestAnimationFrame loop).
     * The ShaderEffect class calls this automatically when a Tracker is attached.
     */
    tick(): BeatClockState;
    get row(): number;
    get isPlaying(): boolean;
}
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
export declare class Playlist {
    private entries;
    add(entry: PlaylistEntry): this;
    getEntries(): readonly PlaylistEntry[];
    /**
     * Given a bar number, return the active playlist entry and the local bar
     * offset within that entry.
     */
    resolve(barNumber: number): {
        entry: PlaylistEntry;
        localBar: number;
    } | null;
    get totalBars(): number;
}
//# sourceMappingURL=tracker.d.ts.map