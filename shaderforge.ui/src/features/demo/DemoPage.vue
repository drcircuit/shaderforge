<template>
  <div class="demo-view">
    <!-- Transport bar (mirrors ShaderLabDX12 Demo View controls) -->
    <div class="transport-bar tile">
      <v-btn icon @click="handlePlay" :color="isPlaying ? 'primary' : undefined">
        <v-icon>{{ isPlaying ? 'mdi-pause' : 'mdi-play' }}</v-icon>
      </v-btn>
      <v-btn icon @click="handleStop">
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
        class="bpm-input"
        @change="onBpmChange"
      />
      <span class="position-display">Bar {{ barCount + 1 }} | Beat {{ beatInBar + 1 }}</span>
    </div>

    <!-- Three-panel layout: Preview | Timeline | Track inspector -->
    <div class="demo-panels">
      <!-- Left: canvas preview -->
      <div class="preview-panel tile">
        <canvas ref="previewCanvas" class="preview-canvas"></canvas>
        <div v-if="initError" class="init-error-overlay">
          <v-icon class="error-icon">mdi-alert-circle</v-icon>
          <span>{{ initError }}</span>
        </div>
      </div>

      <!-- Center: row-grid tracker timeline -->
      <div class="tracker-panel tile">
        <div class="tracker-header">
          <div class="row-label">Row</div>
          <div v-for="name in trackNames" :key="name" class="track-header">{{ name }}</div>
        </div>
        <div class="tracker-rows" ref="trackerRowsEl">
          <div
            v-for="row in visibleRows"
            :key="row"
            class="tracker-row"
            :class="{
              'beat-line':  row % rowsPerBeat === 0,
              'bar-line':   row % (rowsPerBeat * beatsPerBar) === 0,
              'current-row': row === currentRow,
            }"
          >
            <div class="row-label">{{ row }}</div>
            <div
              v-for="name in trackNames"
              :key="name"
              class="tracker-cell"
              :class="{ 'has-keyframe': hasKeyframe(name, row) }"
              :title="`${name} @ row ${row}: ${getValueAt(name, row).toFixed(3)}`"
            >
              <span v-if="hasKeyframe(name, row)" class="keyframe-dot">◆</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: track value inspector -->
      <div class="inspector-panel tile">
        <div class="inspector-title">Track Values</div>
        <div v-for="name in trackNames" :key="name" class="track-value-row">
          <span class="track-name">{{ name }}</span>
          <span class="track-value">{{ getValueAt(name, currentRow).toFixed(4) }}</span>
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

// Example tracks demonstrating beat-synced animation (mirrors ShaderLabDX12 demo flow)
const trackerConfig: Record<string, Array<{ row: number; value: number; interpolation?: 'linear' | 'smooth' | 'constant' }>> = {
  brightness: [
    { row: 0,   value: 0.2, interpolation: 'linear' },
    { row: 16,  value: 1.0, interpolation: 'smooth' },
    { row: 32,  value: 0.5, interpolation: 'linear' },
    { row: 64,  value: 0.8, interpolation: 'smooth' },
    { row: 96,  value: 0.2, interpolation: 'linear' },
    { row: 127, value: 0.2 },
  ],
  hueShift: [
    { row: 0,   value: 0.0, interpolation: 'linear' },
    { row: 64,  value: 3.14 },
    { row: 127, value: 6.28 },
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

let effect: ShaderEffect | null = null;
let tracker: Tracker | null = null;
let rafId = 0;

// ---- Visible rows (show VISIBLE_ROW_COUNT rows starting ROWS_BEFORE_CURRENT before current) ----
const visibleRows = computed(() => {
  const start = Math.max(0, currentRow.value - ROWS_BEFORE_CURRENT);
  const end = Math.min(totalRows - 1, start + VISIBLE_ROW_COUNT - 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

// ---- Keyframe helpers ----
function hasKeyframe(name: string, row: number): boolean {
  return trackerConfig[name]?.some(k => k.row === row) ?? false;
}

function getValueAt(name: string, row: number): number {
  return tracker?.getValueAt(name, row) ?? 0;
}

// ---- Transport handlers ----
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
  if (isPlaying.value) {
    handleStop();
  }
  buildTracker();
}

// ---- Tick loop (updates row display) ----
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

// ---- Build tracker with current config ----
function buildTracker(): void {
  tracker = new Tracker({ bpm: bpm.value, rowsPerBeat, beatsPerBar, rows: totalRows });
  for (const [name, keyframes] of Object.entries(trackerConfig)) {
    tracker.track(name, keyframes);
  }
}

// ---- Lifecycle ----
onMounted(async () => {
  buildTracker();

  if (previewCanvas.value) {
    try {
      effect = await ShaderEffect.create(previewCanvas.value, { tracker: tracker! });
      await effect.compile(DEFAULT_FRAGMENT_WGSL);
    } catch (err) {
      console.error('ShaderEffect init failed:', err);
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
  gap: 0.75rem;
  padding: 0.75rem;
  overflow: hidden;
}

.tile {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(64, 192, 255, 0.15);
  border-radius: 6px;
}

/* Transport bar */
.transport-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  flex-shrink: 0;
}

.bpm-input {
  max-width: 90px;
}

.position-display {
  font-family: 'Audiowide', monospace;
  font-size: 0.85rem;
  color: #40c0ff;
  margin-left: auto;
}

/* Three-panel layout */
.demo-panels {
  display: grid;
  grid-template-columns: 1fr 2fr 180px;
  gap: 0.75rem;
  flex: 1;
  min-height: 0;
}

/* Preview canvas */
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
  font-size: 0.8rem;
  text-align: center;
  padding: 1rem;
  /* Required so \n line-breaks in the error message string render in HTML */
  white-space: pre-wrap;
  word-break: break-word;
}

.error-icon {
  font-size: 2rem;
  color: #ff6b6b;
}

/* Tracker timeline */
.tracker-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tracker-header {
  display: flex;
  gap: 2px;
  padding: 4px 6px;
  background: rgba(64, 192, 255, 0.08);
  border-bottom: 1px solid rgba(64, 192, 255, 0.2);
  flex-shrink: 0;
}

.tracker-rows {
  flex: 1;
  overflow-y: auto;
  font-family: monospace;
  font-size: 0.7rem;
}

.tracker-row {
  display: flex;
  gap: 2px;
  padding: 1px 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.tracker-row.beat-line {
  border-bottom-color: rgba(64, 192, 255, 0.15);
}

.tracker-row.bar-line {
  border-bottom: 1px solid rgba(64, 192, 255, 0.4);
  background: rgba(64, 192, 255, 0.05);
}

.tracker-row.current-row {
  background: rgba(64, 192, 255, 0.15);
  border-left: 2px solid #40c0ff;
}

.row-label {
  width: 36px;
  color: rgba(255, 255, 255, 0.35);
  text-align: right;
  padding-right: 8px;
  flex-shrink: 0;
}

.tracker-header .row-label {
  color: rgba(64, 192, 255, 0.7);
  font-size: 0.7rem;
}

.track-header {
  flex: 1;
  text-align: center;
  color: #40c0ff;
  font-size: 0.7rem;
  font-family: 'Audiowide', monospace;
}

.tracker-cell {
  flex: 1;
  text-align: center;
  color: rgba(255, 255, 255, 0.2);
}

.tracker-cell.has-keyframe .keyframe-dot {
  color: #40c0ff;
  font-size: 0.65rem;
}

/* Inspector panel */
.inspector-panel {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
}

.inspector-title {
  font-family: 'Audiowide', monospace;
  font-size: 0.75rem;
  color: #40c0ff;
  margin-bottom: 0.25rem;
}

.track-value-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}

.track-name {
  color: rgba(255, 255, 255, 0.6);
}

.track-value {
  font-family: monospace;
  color: #40c0ff;
}
</style>
