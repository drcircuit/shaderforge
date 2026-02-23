<template>
  <div class="scene-view">
    <!-- Toolbar -->
    <div class="scene-toolbar tile">
      <div class="toolbar-section">
        <v-btn size="small" variant="outlined" color="primary" @click="addScene">
          Add Scene
        </v-btn>
        <v-btn size="small" variant="outlined" color="secondary" @click="addPostFx">
          Add Post-FX
        </v-btn>
        <v-btn size="small" variant="outlined" color="warning" @click="addTransition">
          Add Transition
        </v-btn>
        <v-divider vertical class="mx-2" />
        <v-btn
          size="small"
          :color="isPlaying ? 'primary' : 'default'"
          variant="outlined"
          @click="togglePlay"
        >{{ isPlaying ? 'Pause' : 'Play' }}</v-btn>
        <v-btn size="small" variant="outlined" @click="stopAll">Stop</v-btn>
        <v-btn size="small" color="primary" @click="recompileStack">
          Compile Stack
        </v-btn>
      </div>
      <div class="toolbar-section ml-auto">
        <span class="status-text">Layers: {{ layers.length }}</span>
      </div>
    </div>

    <div class="scene-panels">
      <!-- Left: Layer stack + wiring inspector -->
      <div class="layer-stack-panel tile">
        <div class="panel-header">
          <v-icon size="18" color="primary">mdi-layers</v-icon>
          <span>Layer Stack</span>
        </div>

        <div v-if="layers.length === 0" class="empty-stack">
          <v-icon size="48" color="rgba(64,192,255,0.3)">mdi-layers-outline</v-icon>
          <p>No layers yet. Add a Scene, Post-FX, or Transition layer.</p>
        </div>

        <div v-else class="layers-list">
          <div
            v-for="(layer, idx) in layers"
            :key="layer.id"
            class="layer-item"
            :class="{ 'layer-selected': selectedLayerIdx === idx }"
            @click="selectLayer(idx)"
          >
            <div class="layer-drag-handle">
              <v-icon size="16" color="rgba(255,255,255,0.3)">mdi-drag-vertical</v-icon>
            </div>
            <div class="layer-info">
              <v-icon size="15" :color="layerColor(layer.type)">{{ layerIcon(layer.type) }}</v-icon>
              <span class="layer-name">{{ layer.name }}</span>
              <v-chip size="x-small" :color="layerColor(layer.type)" variant="tonal">
                {{ layerLabel(layer.type) }}
              </v-chip>
            </div>
            <div class="layer-actions">
              <v-btn icon size="x-small" variant="text" color="rgba(200,200,200,0.7)"
                title="Move up" aria-label="Move layer up"
                @click.stop="moveLayerUp(idx)" :disabled="idx === 0">
                <v-icon size="14">mdi-chevron-up</v-icon>
              </v-btn>
              <v-btn icon size="x-small" variant="text" color="rgba(200,200,200,0.7)"
                title="Move down" aria-label="Move layer down"
                @click.stop="moveLayerDown(idx)" :disabled="idx === layers.length - 1">
                <v-icon size="14">mdi-chevron-down</v-icon>
              </v-btn>
              <v-btn icon size="x-small" variant="text" color="rgba(255,100,100,0.85)"
                title="Remove layer" aria-label="Remove layer"
                @click.stop="removeLayer(idx)">
                <v-icon size="14">mdi-close</v-icon>
              </v-btn>
            </div>
          </div>
        </div>

        <!-- ---- Wiring inspector (updates based on selected layer type) ---- -->
        <div v-if="selectedLayer" class="wiring-inspector">
          <!-- SCENE: output mode + channel inputs -->
          <template v-if="selectedLayer.type === 'scene'">
            <div class="wiring-header">
              <v-icon size="15" color="primary">mdi-connection</v-icon>
              <span>Scene: {{ selectedLayer.name }}</span>
            </div>
            <div class="wiring-row">
              <span class="wiring-label">Output</span>
              <v-btn-toggle
                v-model="selectedLayer.outputMode"
                mandatory
                density="compact"
                class="output-toggle"
              >
                <v-btn value="buffer" size="x-small">Buffer</v-btn>
                <v-btn value="screen" size="x-small">Screen</v-btn>
              </v-btn-toggle>
            </div>
            <div v-for="ch in 4" :key="ch" class="wiring-row">
              <span class="wiring-label">iCh{{ ch - 1 }}</span>
              <v-select
                v-model="selectedLayer.channels[ch - 1]"
                :items="namedBufferLayers"
                density="compact"
                hide-details
                variant="outlined"
                placeholder="None"
                clearable
                class="wiring-select"
              />
            </div>
          </template>

          <!-- POSTFX: single input buffer -->
          <template v-else-if="selectedLayer.type === 'postfx'">
            <div class="wiring-header">
              <v-icon size="15" color="secondary">mdi-connection</v-icon>
              <span>PostFX: {{ selectedLayer.name }}</span>
            </div>
            <div class="wiring-row">
              <span class="wiring-label">iCh0 (in)</span>
              <v-select
                v-model="selectedLayer.channels[0]"
                :items="namedBufferLayers"
                density="compact"
                hide-details
                variant="outlined"
                placeholder="Previous layer"
                clearable
                class="wiring-select"
              />
            </div>
          </template>

          <!-- TRANSITION: buffer A, buffer B, time factor -->
          <template v-else-if="selectedLayer.type === 'transition'">
            <div class="wiring-header">
              <v-icon size="15" color="warning">mdi-swap-horizontal</v-icon>
              <span>Transition: {{ selectedLayer.name }}</span>
            </div>
            <div class="wiring-row">
              <span class="wiring-label">Buffer A</span>
              <v-select
                v-model="selectedLayer.transitionSourceA"
                :items="namedBufferLayers"
                density="compact"
                hide-details
                variant="outlined"
                placeholder="None"
                clearable
                class="wiring-select"
              />
            </div>
            <div class="wiring-row">
              <span class="wiring-label">Buffer B</span>
              <v-select
                v-model="selectedLayer.transitionSourceB"
                :items="namedBufferLayers"
                density="compact"
                hide-details
                variant="outlined"
                placeholder="None"
                clearable
                class="wiring-select"
              />
            </div>
            <div class="wiring-row">
              <span class="wiring-label">Time ({{ selectedLayer.transitionTimeFactor.toFixed(2) }})</span>
              <v-slider
                v-model="selectedLayer.transitionTimeFactor"
                min="0"
                max="1"
                step="0.01"
                hide-details
                density="compact"
                color="warning"
                class="wiring-slider"
              />
            </div>
          </template>
        </div>
      </div>

      <!-- Center: Monaco code editor -->
      <div class="code-panel tile">
        <div class="panel-header">
          <v-icon size="18" :color="selectedLayer ? layerColor(selectedLayer.type) : 'primary'">
            mdi-code-braces
          </v-icon>
          <span>{{ selectedLayer ? selectedLayer.name : 'Select a layer' }} — Fragment Shader</span>
        </div>
        <div class="editor-body" v-if="selectedLayer">
          <MonacoEditor
            :key="selectedLayer.id"
            v-model="selectedLayer.fragmentShader"
            language="wgsl"
            :options="editorOptions"
            class="fill-editor"
          />
        </div>
        <div v-else class="empty-editor">
          <v-icon size="48" color="rgba(64,192,255,0.3)">mdi-code-braces</v-icon>
          <p>Select a layer to edit its shader</p>
        </div>
        <div v-if="compileError" class="compile-error-overlay">
          <pre>{{ compileError }}</pre>
        </div>
      </div>

      <!-- Right: Preview -->
      <div class="preview-panel tile">
        <div class="panel-header">
          <v-icon size="18" color="primary">mdi-monitor</v-icon>
          <span>Preview</span>
        </div>
        <div class="preview-container">
          <canvas ref="previewCanvas" class="preview-canvas"></canvas>
          <div v-if="initError" class="init-error-overlay">
            <v-icon size="32" color="#ff6b6b">mdi-alert-circle</v-icon>
            <span>{{ initError }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import MonacoEditor from '@/components/MonacoEditor.vue';
import { ShaderEffect, LayerStack, DEFAULT_SCENE_FRAGMENT_WGSL } from '@shaderforge/engine';
import { webgpuInitError } from '@/utils/webgpu';

// ---- Types ----------------------------------------------------------------
type LayerType = 'scene' | 'postfx' | 'transition';

interface SceneLayer {
  id: string;
  name: string;
  type: LayerType;
  fragmentShader: string;
  /** iChannel0–3 → named buffer scene (scene/transition layers) */
  channels: (string | null)[];
  /** Scene only: render to a named off-screen buffer or directly to screen */
  outputMode: 'buffer' | 'screen';
  /** Transition only: first source buffer (→ iChannel0) */
  transitionSourceA: string | null;
  /** Transition only: second source buffer (→ iChannel1) */
  transitionSourceB: string | null;
  /** Transition only: blend factor 0–1 (exposed to shader as iChannel2 value or uniform) */
  transitionTimeFactor: number;
}

// ---- State ----------------------------------------------------------------
const previewCanvas = ref<HTMLCanvasElement | null>(null);
const isPlaying = ref(false);
const initError = ref<string | null>(null);
const compileError = ref<string | null>(null);
const selectedLayerIdx = ref<number>(-1);
let effect: ShaderEffect | null = null;
let layerCounter = 0;

const layers = ref<SceneLayer[]>([
  {
    id: crypto.randomUUID(),
    name: 'base',
    type: 'scene',
    fragmentShader: DEFAULT_SCENE_FRAGMENT_WGSL,
    channels: [null, null, null, null],
    outputMode: 'buffer',
    transitionSourceA: null,
    transitionSourceB: null,
    transitionTimeFactor: 0,
  },
]);

// ---- Derived --------------------------------------------------------------
const selectedLayer = computed<SceneLayer | null>(() =>
  selectedLayerIdx.value >= 0 ? layers.value[selectedLayerIdx.value] : null
);

/** Names of all scene/transition layers that produce a buffer — usable as inputs */
const namedBufferLayers = computed<string[]>(() =>
  layers.value
    .filter(l => l.type === 'scene' || l.type === 'transition')
    .map(l => l.name)
);

// ---- Layer type helpers ---------------------------------------------------
function layerIcon(type: LayerType): string {
  if (type === 'scene') return 'mdi-image';
  if (type === 'transition') return 'mdi-swap-horizontal';
  return 'mdi-image-filter-drama';
}

function layerColor(type: LayerType): string {
  if (type === 'scene') return '#40c0ff';
  if (type === 'transition') return '#ffa040';
  return '#9b59b6';
}

function layerLabel(type: LayerType): string {
  if (type === 'scene') return 'Scene';
  if (type === 'transition') return 'Transition';
  return 'PostFX';
}

// ---- Editor options -------------------------------------------------------
const editorOptions = {
  theme: 'shaderforge-dark',
  minimap: { enabled: false },
  fontSize: 13,
  automaticLayout: true,
  scrollBeyondLastLine: false,
  wordWrap: 'on' as 'on',
  padding: { top: 12, bottom: 12 },
};

// ---- Layer management -----------------------------------------------------
function makeLayer(type: LayerType, suffix: string): SceneLayer {
  layerCounter += 1;
  return {
    id: crypto.randomUUID(),
    name: `${suffix}${layerCounter}`,
    type,
    fragmentShader: DEFAULT_SCENE_FRAGMENT_WGSL,
    channels: [null, null, null, null],
    outputMode: 'buffer',
    transitionSourceA: null,
    transitionSourceB: null,
    transitionTimeFactor: 0,
  };
}

function addScene() {
  layers.value.push(makeLayer('scene', 'scene'));
  selectedLayerIdx.value = layers.value.length - 1;
}

function addPostFx() {
  layers.value.push(makeLayer('postfx', 'postfx'));
  selectedLayerIdx.value = layers.value.length - 1;
}

function addTransition() {
  layers.value.push(makeLayer('transition', 'transition'));
  selectedLayerIdx.value = layers.value.length - 1;
}

function removeLayer(idx: number) {
  layers.value.splice(idx, 1);
  if (selectedLayerIdx.value >= layers.value.length) {
    selectedLayerIdx.value = layers.value.length - 1;
  }
}

function moveLayerUp(idx: number) {
  if (idx <= 0) return;
  const arr = layers.value;
  [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
  if (selectedLayerIdx.value === idx) selectedLayerIdx.value = idx - 1;
  else if (selectedLayerIdx.value === idx - 1) selectedLayerIdx.value = idx;
}

function moveLayerDown(idx: number) {
  const arr = layers.value;
  if (idx >= arr.length - 1) return;
  [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
  if (selectedLayerIdx.value === idx) selectedLayerIdx.value = idx + 1;
  else if (selectedLayerIdx.value === idx + 1) selectedLayerIdx.value = idx;
}

function selectLayer(idx: number) {
  selectedLayerIdx.value = idx;
}

// ---- Stack compilation ----------------------------------------------------
async function recompileStack() {
  if (!previewCanvas.value) return;
  compileError.value = null;

  try {
    const stack = new LayerStack();

    for (const layer of layers.value) {
      if (layer.type === 'postfx') {
        stack.postFx(layer.fragmentShader);
      } else {
        // Scene and Transition both compile as named scene passes with channel wiring
        const channels = layer.type === 'transition'
          ? [
              layer.transitionSourceA ? { channel: 0 as const, source: layer.transitionSourceA } : null,
              layer.transitionSourceB ? { channel: 1 as const, source: layer.transitionSourceB } : null,
            ].filter((c): c is NonNullable<typeof c> => c !== null)
          : layer.channels
              .map((src, ch) => src ? { channel: ch as 0 | 1 | 2 | 3, source: src } : null)
              .filter((c): c is NonNullable<typeof c> => c !== null);

        stack.scene({ name: layer.name, fragmentShader: layer.fragmentShader, channels });
      }
    }

    effect?.destroy();
    effect = await ShaderEffect.create(previewCanvas.value, { layerStack: stack });
    if (isPlaying.value) effect.play();
  } catch (err) {
    compileError.value = String(err);
  }
}

// ---- Playback -------------------------------------------------------------
function togglePlay() {
  if (!effect) return;
  if (isPlaying.value) {
    effect.pause();
    isPlaying.value = false;
  } else {
    effect.play();
    isPlaying.value = true;
  }
}

function stopAll() {
  effect?.stop();
  isPlaying.value = false;
}

// ---- Lifecycle ------------------------------------------------------------
onMounted(async () => {
  if (previewCanvas.value) {
    try {
      const stack = new LayerStack().scene({ name: 'base', fragmentShader: DEFAULT_SCENE_FRAGMENT_WGSL });
      effect = await ShaderEffect.create(previewCanvas.value, { layerStack: stack });
      effect.play();
      isPlaying.value = true;
    } catch (err) {
      initError.value = webgpuInitError(err);
    }
  }
  selectedLayerIdx.value = 0;
});

onBeforeUnmount(() => {
  effect?.destroy();
  effect = null;
});
</script>

<style scoped>
/* ---- Full-height layout ------------------------------------------------- */
.scene-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.6rem;
  box-sizing: border-box;
  overflow: hidden;
}

.tile {
  background: rgba(16, 18, 24, 0.92);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(64, 192, 255, 0.15);
  border-radius: 8px;
}

/* ---- Toolbar ------------------------------------------------------------ */
.scene-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  flex-shrink: 0;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.status-text {
  font-size: 0.78rem;
  color: rgba(64, 192, 255, 0.6);
  font-family: 'Audiowide', sans-serif;
}

/* ---- Three-panel layout ------------------------------------------------- */
.scene-panels {
  display: grid;
  grid-template-columns: 240px 1fr 1fr;
  gap: 0.6rem;
  flex: 1;
  min-height: 0;
}

/* ---- Shared panel header ------------------------------------------------ */
.panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid rgba(64, 192, 255, 0.15);
  font-family: 'Audiowide', sans-serif;
  font-size: 0.75rem;
  color: #40c0ff;
  flex-shrink: 0;
}

/* ---- Layer stack panel -------------------------------------------------- */
.layer-stack-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.empty-stack {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.35);
  font-size: 0.78rem;
  text-align: center;
  padding: 1rem;
}

.layers-list {
  overflow-y: auto;
  padding: 0.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  /* Allow wiring inspector to always be visible */
  max-height: 50%;
  flex-shrink: 0;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.5rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(64, 192, 255, 0.1);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.layer-item:hover {
  background: rgba(64, 192, 255, 0.08);
  border-color: rgba(64, 192, 255, 0.25);
}

.layer-item.layer-selected {
  background: rgba(64, 192, 255, 0.12);
  border-color: rgba(64, 192, 255, 0.45);
}

.layer-drag-handle { flex-shrink: 0; cursor: grab; }

.layer-info {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex: 1;
  min-width: 0;
}

.layer-name {
  flex: 1;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.85);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-actions { flex-shrink: 0; }

/* ---- Wiring inspector -------------------------------------------------- */
.wiring-inspector {
  flex: 1;
  overflow-y: auto;
  border-top: 1px solid rgba(64, 192, 255, 0.12);
  padding: 0.5rem 0.5rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-height: 0;
}

.wiring-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-family: 'Audiowide', sans-serif;
  font-size: 0.7rem;
  color: rgba(64, 192, 255, 0.8);
  margin-bottom: 0.2rem;
  flex-shrink: 0;
}

.wiring-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.wiring-label {
  font-family: monospace;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  width: 70px;
  flex-shrink: 0;
}

.wiring-select {
  flex: 1;
}

.output-toggle {
  flex: 1;
}

.wiring-slider {
  flex: 1;
}

/* ---- Code panel --------------------------------------------------------- */
.code-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.editor-body {
  flex: 1;
  min-height: 0;
  position: relative;
}

.fill-editor {
  position: absolute;
  inset: 0;
}

.empty-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.35);
  font-size: 0.8rem;
}

.compile-error-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(200, 0, 0, 0.88);
  color: #fff;
  font-family: monospace;
  font-size: 0.72rem;
  padding: 8px 12px;
  max-height: 35%;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
  z-index: 10;
}

/* ---- Preview panel ------------------------------------------------------ */
.preview-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-container {
  flex: 1;
  position: relative;
  background: #000;
  border-radius: 0 0 6px 6px;
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

/* ---- Responsive --------------------------------------------------------- */
@media (max-width: 1279px) {
  .scene-panels {
    grid-template-columns: 200px 1fr 1fr;
  }
}

@media (max-width: 959px) {
  .scene-panels {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr 1fr;
    overflow-y: auto;
  }

  .scene-view {
    height: auto;
    min-height: 100%;
    overflow-y: auto;
  }

  .layer-stack-panel {
    max-height: 300px;
  }

  .layers-list {
    max-height: 120px;
  }
}

@media (max-width: 599px) {
  .scene-panels {
    grid-template-rows: auto 300px 300px;
  }
}
</style>
