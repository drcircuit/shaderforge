<template>
  <div class="demo-view">
    <!-- Transport bar -->
    <div class="transport-bar tile">
      <v-btn icon size="small" @click="handlePlay" :color="isPlaying ? 'primary' : undefined">
        <v-icon>{{ isPlaying ? 'mdi-pause' : 'mdi-play' }}</v-icon>
      </v-btn>
      <v-btn icon size="small" @click="handleStop">
        <v-icon>mdi-stop</v-icon>
      </v-btn>
      <v-text-field
        v-model.number="bpm"
        type="number"
        label="BPM"
        min="20"
        max="300"
        density="compact"
        hide-details
        variant="outlined"
        class="bpm-input"
        @change="onBpmChange"
      />
      <span class="position-display">Bar {{ barCount + 1 }} &nbsp;|&nbsp; Beat {{ beatInBar + 1 }}</span>
      <!-- Panel selector on small screens -->
      <v-btn-toggle v-model="activePanel" density="compact" class="panel-toggle d-flex d-lg-none ml-auto" mandatory>
        <v-btn value="preview" size="small" icon><v-icon size="16">mdi-monitor</v-icon></v-btn>
        <v-btn value="tracker" size="small" icon><v-icon size="16">mdi-view-list</v-icon></v-btn>
        <v-btn value="inspector" size="small" icon><v-icon size="16">mdi-information</v-icon></v-btn>
      </v-btn-toggle>
    </div>

    <!-- Three-panel layout (desktop) / single-panel (mobile) -->
    <div class="demo-panels">
      <!-- Preview panel -->
      <div
        class="preview-panel tile"
        :class="{ 'panel-hidden': activePanel !== 'preview' }"
      >
        <canvas ref="previewCanvas" class="preview-canvas"></canvas>
        <div v-if="initError" class="init-error-overlay">
          <v-icon class="error-icon">mdi-alert-circle</v-icon>
          <span>{{ initError }}</span>
        </div>
      </div>

      <!-- Tracker timeline -->
      <div
        class="tracker-panel tile"
        :class="{ 'panel-hidden': activePanel !== 'tracker' }"
      >
        <div class="tracker-header">
          <div class="row-label">Bar:Beat</div>
          <div v-for="name in trackNames" :key="name" class="track-header">{{ name }}</div>
        </div>
        <div class="tracker-rows" ref="trackerRowsEl">
          <div
            v-for="row in visibleRows"
            :key="row"
            class="tracker-row"
            :class="{
              'beat-line':    row % rowsPerBeat === 0,
              'bar-line':     row % (rowsPerBeat * beatsPerBar) === 0,
              'current-row':  row === currentRow,
            }"
          >
            <div class="row-label">{{ rowToBarBeat(row) }}</div>
            <div
              v-for="name in trackNames"
              :key="name"
              class="tracker-cell"
              :class="[`col-${name.replace(' ', '-').toLowerCase()}`, { 'has-keyframe': hasKeyframe(name, row) }]"
              :title="`${name} @ ${rowToBarBeat(row)}: ${getValueAt(name, row)}`"
            >
              <span v-if="hasKeyframe(name, row)" class="keyframe-val">{{ formatCell(name, getValueAt(name, row)) }}</span>
              <span v-else class="cell-empty">—</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Inspector -->
      <div
        class="inspector-panel tile"
        :class="{ 'panel-hidden': activePanel !== 'inspector' }"
      >
        <div class="inspector-title">Track Values</div>
        <div v-for="name in trackNames" :key="name" class="track-value-row">
          <span class="track-name">{{ name }}</span>
          <span class="track-value">{{ formatCell(name, getValueAt(name, currentRow)) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { ShaderEffect, Tracker, DEFAULT_FRAGMENT_WGSL } from '@shaderforge/engine';
import { webgpuInitError } from '@/utils/webgpu';

// ---- Tracker config ----
const bpm = ref(120);
const beatsPerBar = 4;
const rowsPerBeat = 4;
const totalRows = 128;
const ROWS_BEFORE_CURRENT = 4;
const VISIBLE_ROW_COUNT = 64;

const trackerConfig: Record<string, Array<{ row: number; value: number; interpolation?: 'linear' | 'smooth' | 'constant' }>> = {
  Scene: [
    { row: 0,   value: 1, interpolation: 'constant' },
    { row: 32,  value: 2, interpolation: 'constant' },
    { row: 64,  value: 1, interpolation: 'constant' },
    { row: 96,  value: 3, interpolation: 'constant' },
    { row: 127, value: 1 },
  ],
  Offset: [
    { row: 0,   value: 0.0,  interpolation: 'linear' },
    { row: 32,  value: 0.5,  interpolation: 'smooth' },
    { row: 64,  value: 1.0,  interpolation: 'linear' },
    { row: 96,  value: 0.25, interpolation: 'smooth' },
    { row: 127, value: 0.0 },
  ],
  Transition: [
    { row: 0,   value: 0, interpolation: 'constant' },
    { row: 32,  value: 1, interpolation: 'constant' },
    { row: 48,  value: 0, interpolation: 'constant' },
    { row: 64,  value: 2, interpolation: 'constant' },
    { row: 80,  value: 0, interpolation: 'constant' },
    { row: 96,  value: 1, interpolation: 'constant' },
    { row: 112, value: 0, interpolation: 'constant' },
  ],
  'Trans Time': [
    { row: 0,   value: 0.50, interpolation: 'constant' },
    { row: 32,  value: 1.00, interpolation: 'constant' },
    { row: 64,  value: 0.25, interpolation: 'constant' },
    { row: 96,  value: 0.75, interpolation: 'constant' },
  ],
  Music: [
    { row: 0,   value: 0, interpolation: 'constant' },
    { row: 16,  value: 1, interpolation: 'constant' },
    { row: 17,  value: 0, interpolation: 'constant' },
    { row: 48,  value: 1, interpolation: 'constant' },
    { row: 49,  value: 0, interpolation: 'constant' },
    { row: 80,  value: 1, interpolation: 'constant' },
    { row: 81,  value: 0, interpolation: 'constant' },
  ],
  OneShot: [
    { row: 0,   value: 0, interpolation: 'constant' },
    { row: 32,  value: 1, interpolation: 'constant' },
    { row: 33,  value: 0, interpolation: 'constant' },
    { row: 64,  value: 1, interpolation: 'constant' },
    { row: 65,  value: 0, interpolation: 'constant' },
    { row: 96,  value: 1, interpolation: 'constant' },
    { row: 97,  value: 0, interpolation: 'constant' },
  ],
};

const trackNames = Object.keys(trackerConfig);

// ---- Runtime state ----
const previewCanvas = ref<HTMLCanvasElement | null>(null);
const trackerRowsEl = ref<HTMLElement | null>(null);
const isPlaying = ref(false);
const currentRow = ref(0);
const barCount = ref(0);
const beatInBar = ref(0);
const initError = ref<string | null>(null);
const activePanel = ref<'preview' | 'tracker' | 'inspector'>('preview');

let effect: ShaderEffect | null = null;
let tracker: Tracker | null = null;
let rafId = 0;

const visibleRows = computed(() => {
  const start = Math.max(0, currentRow.value - ROWS_BEFORE_CURRENT);
  const end = Math.min(totalRows - 1, start + VISIBLE_ROW_COUNT - 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

function hasKeyframe(name: string, row: number): boolean {
  return trackerConfig[name]?.some(k => k.row === row) ?? false;
}

function getValueAt(name: string, row: number): number {
  return tracker?.getValueAt(name, row) ?? 0;
}

/** Format row number as Bar:Beat (e.g. row 4 @ 4 rows/beat, 4 beats/bar = "1:2") */
function rowToBarBeat(row: number): string {
  const barNumber = Math.floor(row / (rowsPerBeat * beatsPerBar)) + 1;
  const beat      = Math.floor((row % (rowsPerBeat * beatsPerBar)) / rowsPerBeat) + 1;
  return `${barNumber}:${beat}`;
}

const EMPTY_CELL = '·';

/** Format a tracker cell value based on column type */
function formatCell(name: string, value: number): string {
  switch (name) {
    case 'Scene':      return `S${Math.round(value)}`;
    case 'Transition': return value > 0 ? `T${Math.round(value)}` : EMPTY_CELL;
    case 'Trans Time': return value.toFixed(2);
    case 'Offset':     return value.toFixed(2);
    case 'Music':      return value > 0 ? '▶' : EMPTY_CELL;
    case 'OneShot':    return value > 0 ? '★' : EMPTY_CELL;
    default:           return value.toFixed(2);
  }
}

function handlePlay() {
  if (!tracker || !effect) return;
  if (isPlaying.value) {
    tracker.pause();
    effect.pause();
    isPlaying.value = false;
  } else {
    tracker.play();
    effect.play();
    isPlaying.value = true;
    scheduleTick();
  }
}

function handleStop() {
  if (!tracker || !effect) return;
  tracker.stop();
  effect.stop();
  isPlaying.value = false;
  currentRow.value = 0;
  barCount.value = 0;
  beatInBar.value = 0;
  cancelAnimationFrame(rafId);
}

function onBpmChange() {
  if (isPlaying.value) handleStop();
  buildTracker();
}

function scheduleTick() {
  if (!isPlaying.value) return;
  rafId = requestAnimationFrame(() => {
    if (tracker) {
      const state = tracker.tick();
      currentRow.value = tracker.row;
      barCount.value = state.barCount;
      beatInBar.value = state.beatInBar;
    }
    scheduleTick();
  });
}

function buildTracker(): void {
  tracker = new Tracker({ bpm: bpm.value, rowsPerBeat, beatsPerBar, rows: totalRows });
  for (const [name, keyframes] of Object.entries(trackerConfig)) {
    tracker.track(name, keyframes);
  }
}

onMounted(async () => {
  buildTracker();
  if (previewCanvas.value) {
    try {
      effect = await ShaderEffect.create(previewCanvas.value, { tracker: tracker! });
      await effect.compile(DEFAULT_FRAGMENT_WGSL);
    } catch (err) {
      initError.value = webgpuInitError(err);
    }
  }
});

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId);
  effect?.destroy();
  effect = null;
  tracker = null;
});
</script>

<style scoped>
.demo-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.6rem;
  overflow: hidden;
  box-sizing: border-box;
}

.tile {
  background: rgba(16, 18, 24, 0.92);
  border: 1px solid rgba(64, 192, 255, 0.15);
  border-radius: 6px;
}

/* ---- Transport bar ------------------------------------------------------ */
.transport-bar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.75rem;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.bpm-input {
  max-width: 88px;
  min-width: 72px;
}

.position-display {
  font-family: 'Audiowide', monospace;
  font-size: 0.82rem;
  color: #40c0ff;
}

.panel-toggle {
  background: transparent !important;
}

/* ---- Three-panel layout ------------------------------------------------- */
.demo-panels {
  display: grid;
  grid-template-columns: 1fr 2fr minmax(160px, 200px);
  gap: 0.6rem;
  flex: 1;
  min-height: 0;
}

/* ---- Preview panel ------------------------------------------------------ */
.preview-panel {
  position: relative;
  overflow: hidden;
}

.preview-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.init-error-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.75);
  color: #ff6b6b;
  font-size: 0.78rem;
  text-align: center;
  padding: 1rem;
  white-space: pre-wrap;
  word-break: break-word;
}

.error-icon {
  font-size: 2rem !important;
  color: #ff6b6b;
}

/* ---- Tracker panel ------------------------------------------------------ */
.tracker-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.tracker-header {
  display: flex;
  gap: 2px;
  padding: 4px 6px;
  background: rgba(64, 192, 255, 0.07);
  border-bottom: 1px solid rgba(64, 192, 255, 0.2);
  flex-shrink: 0;
}

.tracker-rows {
  flex: 1;
  overflow-y: auto;
  font-family: monospace;
  font-size: 0.68rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(64, 192, 255, 0.2) transparent;
}

.tracker-row {
  display: flex;
  gap: 2px;
  padding: 1px 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.tracker-row.beat-line  { border-bottom-color: rgba(64, 192, 255, 0.15); }
.tracker-row.bar-line   { border-bottom: 1px solid rgba(64, 192, 255, 0.4); background: rgba(64, 192, 255, 0.05); }
.tracker-row.current-row { background: rgba(64, 192, 255, 0.15); border-left: 2px solid #40c0ff; }

.row-label {
  width: 44px;
  color: rgba(255, 255, 255, 0.32);
  text-align: right;
  padding-right: 6px;
  flex-shrink: 0;
  font-size: 0.62rem;
}

.tracker-header .row-label {
  color: rgba(64, 192, 255, 0.7);
  font-size: 0.62rem;
}

.track-header {
  flex: 1;
  min-width: 48px;
  text-align: center;
  color: #40c0ff;
  font-size: 0.62rem;
  font-family: 'Audiowide', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tracker-cell {
  flex: 1;
  min-width: 48px;
  text-align: center;
  font-size: 0.65rem;
  font-family: monospace;
}

.cell-empty {
  color: rgba(255, 255, 255, 0.1);
}

/* Per-column keyframe value colors */
.keyframe-val { font-weight: 600; }
.col-scene      .keyframe-val { color: #56d3c2; }
.col-offset     .keyframe-val { color: #6ec2ff; }
.col-transition .keyframe-val { color: #e0c987; }
.col-trans-time .keyframe-val { color: #eca493; }
.col-music      .keyframe-val { color: #96d166; font-size: 0.8rem; }
.col-oneshot    .keyframe-val { color: #ec714c; font-size: 0.75rem; }

/* ---- Inspector panel ---------------------------------------------------- */
.inspector-panel {
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  overflow-y: auto;
}

.inspector-title {
  font-family: 'Audiowide', monospace;
  font-size: 0.72rem;
  color: #40c0ff;
  margin-bottom: 0.2rem;
  flex-shrink: 0;
}

.track-value-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.72rem;
}

.track-name  { color: rgba(255, 255, 255, 0.6); }
.track-value { font-family: monospace; color: #40c0ff; }

/* ---- Responsive --------------------------------------------------------- */

/* On lg+ the panel-toggle button group is hidden, panels always visible */
@media (min-width: 1280px) {
  .panel-hidden { display: flex !important; }
}

/* Below lg: show only the active panel */
@media (max-width: 1279px) {
  .demo-panels {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
  }

  .panel-hidden {
    display: none !important;
  }

  /* The visible panel fills the whole area */
  .preview-panel,
  .tracker-panel,
  .inspector-panel {
    grid-column: 1;
    grid-row: 1;
  }
}

/* Compact transport on small phones */
@media (max-width: 479px) {
  .position-display {
    font-size: 0.72rem;
  }
}
</style>
