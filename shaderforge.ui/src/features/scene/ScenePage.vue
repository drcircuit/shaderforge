<template>
  <div class="scene-view">
    <!-- Toolbar -->
    <div class="scene-toolbar tile">
      <div class="toolbar-section">
        <v-btn size="small" variant="outlined" color="primary" prepend-icon="mdi-plus" @click="addScene">
          Add Scene
        </v-btn>
        <v-btn size="small" variant="outlined" color="secondary" prepend-icon="mdi-image-filter-frames" @click="addPostFx">
          Add Post-FX
        </v-btn>
        <v-divider vertical class="mx-2" />
        <v-btn
          size="small"
          :color="isPlaying ? 'primary' : 'default'"
          variant="outlined"
          @click="togglePlay"
          :prepend-icon="isPlaying ? 'mdi-pause' : 'mdi-play'"
        >{{ isPlaying ? 'Pause' : 'Play' }}</v-btn>
        <v-btn size="small" variant="outlined" prepend-icon="mdi-stop" @click="stopAll">Stop</v-btn>
        <v-btn size="small" color="primary" prepend-icon="mdi-lightning-bolt" @click="recompileStack">
          Compile Stack
        </v-btn>
      </div>
      <div class="toolbar-section ml-auto">
        <span class="status-text">Layers: {{ layers.length }}</span>
      </div>
    </div>

    <div class="scene-panels">
      <!-- Left: Layer stack editor -->
      <div class="layer-stack-panel tile">
        <div class="panel-header">
          <v-icon size="18" color="primary">mdi-layers</v-icon>
          <span>Layer Stack</span>
        </div>

        <div v-if="layers.length === 0" class="empty-stack">
          <v-icon size="48" color="rgba(64,192,255,0.3)">mdi-layers-outline</v-icon>
          <p>No layers yet. Add a Scene or Post-FX layer.</p>
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
              <v-icon size="16" :color="layer.type === 'scene' ? '#40c0ff' : '#9b59b6'">
                {{ layer.type === 'scene' ? 'mdi-image' : 'mdi-image-filter-drama' }}
              </v-icon>
              <span class="layer-name">{{ layer.name }}</span>
              <v-chip size="x-small" :color="layer.type === 'scene' ? 'primary' : 'secondary'" variant="tonal">
                {{ layer.type === 'scene' ? 'Scene' : 'PostFX' }}
              </v-chip>
            </div>
            <div class="layer-actions">
              <v-btn icon size="x-small" variant="text" @click.stop="removeLayer(idx)">
                <v-icon size="14">mdi-close</v-icon>
              </v-btn>
            </div>
          </div>
        </div>

        <!-- Channel wiring (only for scene layers) -->
        <div v-if="selectedLayer && selectedLayer.type === 'scene'" class="channel-wiring">
          <div class="panel-header mt-2">
            <v-icon size="18" color="primary">mdi-connection</v-icon>
            <span>Channel Inputs ({{ selectedLayer.name }})</span>
          </div>
          <div class="channel-rows">
            <div v-for="ch in 4" :key="ch" class="channel-row">
              <span class="channel-label">iChannel{{ ch - 1 }}</span>
              <v-select
                v-model="selectedLayer.channels[ch - 1]"
                :items="sceneLayerNames"
                density="compact"
                hide-details
                variant="outlined"
                placeholder="None"
                clearable
                class="channel-select"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Center: Monaco code editor -->
      <div class="code-panel tile">
        <div class="panel-header">
          <v-icon size="18" color="primary">mdi-code-braces</v-icon>
          <span>{{ selectedLayer ? selectedLayer.name : 'Select a layer' }} — Fragment Shader</span>
        </div>
        <div class="editor-body" v-if="selectedLayer">
          <MonacoEditor
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

        <!-- Error overlay -->
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
import { ShaderEffect, LayerStack, DEFAULT_FRAGMENT_WGSL } from '@shaderforge/engine';
import { webgpuInitError } from '@/utils/webgpu';

// ---- Types ----------------------------------------------------------------
interface SceneLayer {
  id: string;
  name: string;
  type: 'scene' | 'postfx';
  fragmentShader: string;
  channels: (string | null)[];
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
    fragmentShader: DEFAULT_FRAGMENT_WGSL,
    channels: [null, null, null, null],
  },
]);

// ---- Derived --------------------------------------------------------------
const selectedLayer = computed<SceneLayer | null>(() =>
  selectedLayerIdx.value >= 0 ? layers.value[selectedLayerIdx.value] : null
);

const sceneLayerNames = computed<string[]>(() =>
  layers.value.filter(l => l.type === 'scene').map(l => l.name)
);

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
function addScene() {
  layerCounter += 1;
  layers.value.push({
    id: crypto.randomUUID(),
    name: `scene${layerCounter}`,
    type: 'scene',
    fragmentShader: DEFAULT_FRAGMENT_WGSL,
    channels: [null, null, null, null],
  });
  selectedLayerIdx.value = layers.value.length - 1;
}

function addPostFx() {
  layerCounter += 1;
  layers.value.push({
    id: crypto.randomUUID(),
    name: `postfx${layerCounter}`,
    type: 'postfx',
    fragmentShader: DEFAULT_FRAGMENT_WGSL,
    channels: [null, null, null, null],
  });
  selectedLayerIdx.value = layers.value.length - 1;
}

function removeLayer(idx: number) {
  layers.value.splice(idx, 1);
  if (selectedLayerIdx.value >= layers.value.length) {
    selectedLayerIdx.value = layers.value.length - 1;
  }
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

    // Add scenes in order
    for (const layer of layers.value) {
      if (layer.type === 'scene') {
        const channels = layer.channels
          .map((src, ch) => src ? { channel: ch as 0 | 1 | 2 | 3, source: src } : null)
          .filter((c): c is NonNullable<typeof c> => c !== null);
        stack.scene({ name: layer.name, fragmentShader: layer.fragmentShader, channels });
      } else {
        stack.postFx(layer.fragmentShader);
      }
    }

    // Rebuild the effect with the new stack
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
      // Start with a single default scene
      const stack = new LayerStack().scene({ name: 'base', fragmentShader: DEFAULT_FRAGMENT_WGSL });
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
  grid-template-columns: 220px 1fr 1fr;
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
  font-size: 0.8rem;
  text-align: center;
  padding: 1rem;
}

.layers-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
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

/* ---- Channel wiring ---------------------------------------------------- */
.channel-wiring {
  border-top: 1px solid rgba(64, 192, 255, 0.1);
  padding: 0.4rem;
  flex-shrink: 0;
}

.channel-rows {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.3rem 0;
}

.channel-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.channel-label {
  font-family: monospace;
  font-size: 0.72rem;
  color: rgba(64, 192, 255, 0.7);
  width: 72px;
  flex-shrink: 0;
}

.channel-select {
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
    grid-template-columns: 180px 1fr 1fr;
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
    max-height: 240px;
  }
}

@media (max-width: 599px) {
  .scene-panels {
    grid-template-rows: auto 300px 300px;
  }
}
</style>
