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
export class BeatClock {
    bpm = 120;
    beatsPerBar = 4;
    audioTime = 0;
    prevQuarter = 0;
    prevEighth = 0;
    prevSixteenth = 0;
    prevBar = 0;
    setBPM(bpm) {
        this.bpm = bpm > 0 ? bpm : 120;
    }
    setTimeSignature(beatsPerBar) {
        this.beatsPerBar = beatsPerBar > 0 ? beatsPerBar : 4;
    }
    getBPM() {
        return this.bpm;
    }
    /** Feed the current playback position (in seconds) to update all counters. */
    update(audioTimeInSeconds) {
        this.audioTime = audioTimeInSeconds;
        const spb = 60 / this.bpm; // seconds per beat (quarter note)
        const spe = spb * 0.5; // seconds per eighth note
        const sps = spb * 0.25; // seconds per sixteenth note
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
    reset() {
        this.audioTime = 0;
        this.prevQuarter = 0;
        this.prevEighth = 0;
        this.prevSixteenth = 0;
        this.prevBar = 0;
    }
}
/** Smooth-step (cubic ease-in-out) — same as GLSL smoothstep. */
function smoothStep(t) {
    return t * t * (3 - 2 * t);
}
function interpolate(a, b, t, mode) {
    switch (mode) {
        case 'constant': return a;
        case 'smooth': return a + (b - a) * smoothStep(Math.max(0, Math.min(1, t)));
        case 'linear':
        default: return a + (b - a) * Math.max(0, Math.min(1, t));
    }
}
class Track {
    sorted;
    constructor(keyframes) {
        this.sorted = keyframes
            .map(k => ({ row: k.row, value: k.value, interpolation: k.interpolation ?? 'linear' }))
            .sort((a, b) => a.row - b.row);
    }
    getValue(row) {
        const kf = this.sorted;
        if (kf.length === 0)
            return 0;
        if (row <= kf[0].row)
            return kf[0].value;
        if (row >= kf[kf.length - 1].row)
            return kf[kf.length - 1].value;
        // Binary search for the surrounding pair
        let lo = 0;
        let hi = kf.length - 2;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (kf[mid + 1].row <= row)
                lo = mid + 1;
            else
                hi = mid;
        }
        const a = kf[lo];
        const b = kf[lo + 1];
        const span = b.row - a.row;
        const t = span > 0 ? (row - a.row) / span : 0;
        return interpolate(a.value, b.value, t, a.interpolation);
    }
}
export class Tracker {
    clock;
    rowsPerBeat;
    totalRows;
    tracks = new Map();
    currentRow = 0;
    playing = false;
    startTime = 0; // performance.now() snapshot when play() was called
    offsetSeconds = 0; // seconds already elapsed before the current play() call
    constructor(options = {}) {
        const { bpm = 120, rowsPerBeat = 4, beatsPerBar = 4, rows = 512, } = options;
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
    track(name, keyframes) {
        this.tracks.set(name, new Track(keyframes));
        return this;
    }
    getBPM() {
        return this.clock.getBPM();
    }
    /** Get the current interpolated value for a named track at the current playhead position. */
    getValue(name) {
        return this.tracks.get(name)?.getValue(this.currentRow) ?? 0;
    }
    /** Get the interpolated value for a named track at an explicit row. */
    getValueAt(name, row) {
        return this.tracks.get(name)?.getValue(row) ?? 0;
    }
    /** Start (or resume) playback. */
    play() {
        if (!this.playing) {
            this.startTime = performance.now();
            this.playing = true;
        }
    }
    /** Pause playback, preserving the current position. */
    pause() {
        if (this.playing) {
            this.offsetSeconds += (performance.now() - this.startTime) / 1000;
            this.playing = false;
        }
    }
    /** Stop playback and reset to row 0. */
    stop() {
        this.playing = false;
        this.offsetSeconds = 0;
        this.currentRow = 0;
        this.clock.reset();
    }
    /** Seek to a specific row. */
    seekRow(row) {
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
    tick() {
        const elapsed = this.playing
            ? this.offsetSeconds + (performance.now() - this.startTime) / 1000
            : this.offsetSeconds;
        const secondsPerRow = (60 / this.clock.getBPM()) / this.rowsPerBeat;
        this.currentRow = Math.floor(elapsed / secondsPerRow) % this.totalRows;
        return this.clock.update(elapsed);
    }
    get row() { return this.currentRow; }
    get isPlaying() { return this.playing; }
}
/**
 * Playlist sequences multiple shaders with beat-anchored transitions.
 * Hand a Playlist to ShaderEffect (future M4 feature) to run a full demo.
 */
export class Playlist {
    entries = [];
    add(entry) {
        this.entries.push(entry);
        return this;
    }
    getEntries() {
        return this.entries;
    }
    /**
     * Given a bar number, return the active playlist entry and the local bar
     * offset within that entry.
     */
    resolve(barNumber) {
        let bar = barNumber;
        for (const entry of this.entries) {
            if (bar < entry.durationBars) {
                return { entry, localBar: bar };
            }
            bar -= entry.durationBars;
        }
        return null;
    }
    get totalBars() {
        return this.entries.reduce((s, e) => s + e.durationBars, 0);
    }
}
//# sourceMappingURL=tracker.js.map