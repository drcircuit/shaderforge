<template>
  <div class="scene-view">
    <!-- Toolbar -->
    <div class="scene-toolbar tile">
      <div class="toolbar-section">
        <v-btn size="small" variant="outlined" color="primary" @click="addScene">
          New Scene
        </v-btn>
        <v-btn size="small" variant="outlined" color="secondary" @click="addShader"
          :disabled="selectedSceneIdx < 0">
          Add Shader
        </v-btn>
        <v-btn size="small" variant="outlined" color="secondary" @click="addPostFx"
          :disabled="selectedSceneIdx < 0">
          Add Post-FX
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
        <span class="status-text">Scenes: {{ scenes.length }}</span>
      </div>
    </div>

    <div class="scene-panels">
      <!-- Left: Scene list + per-scene shader stack + wiring inspector -->
      <div class="layer-stack-panel tile">
        <!-- Scenes section -->
        <div class="panel-header">
          <v-icon size="18" color="primary">mdi-movie-open</v-icon>
          <span>Scenes</span>
        </div>

        <div v-if="scenes.length === 0" class="empty-stack">
          <v-icon size="48" color="rgba(64,192,255,0.3)">mdi-movie-open-outline</v-icon>
          <p>No scenes yet. Click <strong>New Scene</strong> to add one.</p>
        </div>

        <div v-else class="layers-list">
          <div
            v-for="(scene, idx) in scenes"
            :key="scene.id"
            class="layer-item"
            :class="{ 'layer-selected': selectedSceneIdx === idx }"
            @click="selectScene(idx)"
          >
            <div class="layer-info">
              <v-icon size="15" color="#40c0ff">mdi-movie-open</v-icon>
              <span class="layer-name">{{ scene.name }}</span>
              <v-chip size="x-small" color="#40c0ff" variant="tonal">
                {{ scene.shaders.length }} shader{{ scene.shaders.length !== 1 ? 's' : '' }}
              </v-chip>
            </div>
            <div class="layer-actions">
              <v-btn icon size="x-small" variant="text" color="rgba(255,100,100,0.85)"
                title="Remove scene" aria-label="Remove scene"
                @click.stop="removeScene(idx)">
                <v-icon size="14">mdi-close</v-icon>
              </v-btn>
            </div>
          </div>
        </div>

        <!-- Shaders in selected scene -->
        <template v-if="selectedScene">
          <div class="panel-header sub-header">
            <v-icon size="15" color="secondary">mdi-layers</v-icon>
            <span>Shaders in <em>{{ selectedScene.name }}</em></span>
          </div>

          <div v-if="selectedScene.shaders.length === 0" class="empty-stack small-empty">
            <p>No shaders. Use <strong>Add Shader</strong> or <strong>Add Post-FX</strong>.</p>
          </div>

          <div v-else class="layers-list">
            <div
              v-for="(shader, idx) in selectedScene.shaders"
              :key="shader.id"
              class="layer-item"
              :class="{ 'layer-selected': selectedShaderIdx === idx }"
              @click="selectShader(idx)"
            >
              <div class="layer-drag-handle">
                <v-icon size="16" color="rgba(255,255,255,0.3)">mdi-drag-vertical</v-icon>
              </div>
              <div class="layer-info">
                <v-icon size="15" :color="shaderColor(shader.type)">{{ shaderIcon(shader.type) }}</v-icon>
                <span class="layer-name">{{ shader.name }}</span>
                <v-chip size="x-small" :color="shaderColor(shader.type)" variant="tonal">
                  {{ shaderLabel(shader.type) }}
                </v-chip>
              </div>
              <div class="layer-actions">
                <v-btn icon size="x-small" variant="text" color="rgba(200,200,200,0.7)"
                  title="Move up" aria-label="Move shader up"
                  @click.stop="moveShaderUp(idx)" :disabled="idx === 0">
                  <v-icon size="14">mdi-chevron-up</v-icon>
                </v-btn>
                <v-btn icon size="x-small" variant="text" color="rgba(200,200,200,0.7)"
                  title="Move down" aria-label="Move shader down"
                  @click.stop="moveShaderDown(idx)" :disabled="idx === selectedScene.shaders.length - 1">
                  <v-icon size="14">mdi-chevron-down</v-icon>
                </v-btn>
                <v-btn icon size="x-small" variant="text" color="rgba(255,100,100,0.85)"
                  title="Remove shader" aria-label="Remove shader"
                  @click.stop="removeShader(idx)">
                  <v-icon size="14">mdi-close</v-icon>
                </v-btn>
              </div>
            </div>
          </div>

          <!-- ---- Wiring inspector (updates based on selected shader type) ---- -->
          <div v-if="selectedShader" class="wiring-inspector">
            <!-- PIXEL SHADER: output mode + channel inputs -->
            <template v-if="selectedShader.type === 'pixelshader'">
              <div class="wiring-header">
                <v-icon size="15" color="primary">mdi-connection</v-icon>
                <span>Shader: {{ selectedShader.name }}</span>
              </div>
              <div class="wiring-row">
                <span class="wiring-label">Output</span>
                <v-btn-toggle
                  v-model="selectedShader.outputMode"
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
                  v-model="selectedShader.channels[ch - 1]"
                  :items="namedBufferShaders"
                  density="compact"
                  hide-details
                  variant="outlined"
                  placeholder="None"
                  clearable
                  class="wiring-select"
                />
              </div>
            </template>

            <!-- POST-FX: single input buffer -->
            <template v-else-if="selectedShader.type === 'postfx'">
              <div class="wiring-header">
                <v-icon size="15" color="secondary">mdi-connection</v-icon>
                <span>PostFX: {{ selectedShader.name }}</span>
              </div>
              <div class="wiring-row">
                <span class="wiring-label">iCh0 (in)</span>
                <v-select
                  v-model="selectedShader.channels[0]"
                  :items="namedBufferShaders"
                  density="compact"
                  hide-details
                  variant="outlined"
                  placeholder="Previous layer"
                  clearable
                  class="wiring-select"
                />
              </div>
            </template>
          </div>
        </template>
      </div>

      <!-- Center: Monaco code editor -->
      <div class="code-panel tile">
        <div class="panel-header">
          <v-icon size="18" :color="selectedShader ? shaderColor(selectedShader.type) : 'primary'">
            mdi-code-braces
          </v-icon>
          <span>{{ selectedShader ? selectedShader.name : 'Select a shader' }} — Fragment Shader</span>
        </div>

        <!-- Parameters accordion (uniforms + channels) -->
        <v-expansion-panels v-if="selectedShader" variant="accordion" class="params-panels">
          <v-expansion-panel>
            <v-expansion-panel-title class="params-panel-title">
              <v-icon size="13" class="mr-1">mdi-variable</v-icon>
              Built-in Uniforms
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="uniform-grid">
                <div v-for="u in BUILTIN_UNIFORMS" :key="u.name" class="uniform-row">
                  <span class="uniform-type">{{ u.type }}</span>
                  <span class="uniform-name">uniforms.{{ u.name }}</span>
                  <span class="uniform-desc">{{ u.desc }}</span>
                </div>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
          <v-expansion-panel>
            <v-expansion-panel-title class="params-panel-title">
              <v-icon size="13" class="mr-1">mdi-texture</v-icon>
              Channels &amp; Samplers
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="channel-info-grid">
                <template v-if="selectedShader.type === 'pixelshader'">
                  <div v-for="ch in 4" :key="ch" class="channel-info-row">
                    <span class="channel-binding">iChannel{{ ch - 1 }}</span>
                    <span class="channel-sampler">iChannel{{ ch - 1 }}Sampler</span>
                    <span class="channel-source">{{ selectedShader.channels[ch - 1] || '(none)' }}</span>
                  </div>
                </template>
                <template v-else>
                  <div class="channel-info-row">
                    <span class="channel-binding">iChannel0</span>
                    <span class="channel-sampler">iChannel0Sampler</span>
                    <span class="channel-source">{{ selectedShader.channels[0] || '(previous layer)' }}</span>
                  </div>
                </template>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <div class="editor-body" v-if="selectedShader">
          <MonacoEditor
            :key="selectedShader.id"
            v-model="selectedShader.fragmentShader"
            language="wgsl"
            :options="editorOptions"
            class="fill-editor"
          />
        </div>
        <div v-else class="empty-editor">
          <v-icon size="48" color="rgba(64,192,255,0.3)">mdi-code-braces</v-icon>
          <p>Select a shader to edit its code</p>
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
type ShaderType = 'pixelshader' | 'postfx';

interface SceneShader {
  id: string;
  name: string;
  type: ShaderType;
  fragmentShader: string;
  /** iChannel0–3 → named buffer shader (pixelshader layers) */
  channels: (string | null)[];
  /** Pixel shader only: render to a named off-screen buffer or directly to screen */
  outputMode: 'buffer' | 'screen';
}

interface SceneContainer {
  id: string;
  name: string;
  shaders: SceneShader[];
}

// ---- State ----------------------------------------------------------------
const previewCanvas = ref<HTMLCanvasElement | null>(null);
const isPlaying = ref(false);
const initError = ref<string | null>(null);
const compileError = ref<string | null>(null);
const selectedSceneIdx = ref<number>(-1);
const selectedShaderIdx = ref<number>(-1);
let effect: ShaderEffect | null = null;
let itemCounter = 0;

const scenes = ref<SceneContainer[]>([
  {
    id: crypto.randomUUID(),
    name: 'scene1',
    shaders: [
      {
        id: crypto.randomUUID(),
        name: 'base',
        type: 'pixelshader',
        fragmentShader: DEFAULT_SCENE_FRAGMENT_WGSL,
        channels: [null, null, null, null],
        outputMode: 'buffer',
      },
    ],
  },
]);

// ---- Derived --------------------------------------------------------------
const selectedScene = computed<SceneContainer | null>(() =>
  selectedSceneIdx.value >= 0 ? scenes.value[selectedSceneIdx.value] : null
);

const selectedShader = computed<SceneShader | null>(() => {
  const sc = selectedScene.value;
  return sc && selectedShaderIdx.value >= 0 ? sc.shaders[selectedShaderIdx.value] : null;
});

/** Names of all pixelshader entries in the selected scene — usable as channel inputs */
const namedBufferShaders = computed<string[]>(() =>
  selectedScene.value?.shaders
    .filter(s => s.type === 'pixelshader')
    .map(s => s.name) ?? []
);

// ---- Shader type helpers --------------------------------------------------
function shaderIcon(type: ShaderType): string {
  return type === 'pixelshader' ? 'mdi-image' : 'mdi-image-filter-drama';
}

function shaderColor(type: ShaderType): string {
  return type === 'pixelshader' ? '#40c0ff' : '#9b59b6';
}

function shaderLabel(type: ShaderType): string {
  return type === 'pixelshader' ? 'Shader' : 'PostFX';
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

// ---- Built-in uniforms reference -----------------------------------------
const BUILTIN_UNIFORMS = [
  { type: 'f32',   name: 'time',           desc: 'seconds since effect start' },
  { type: 'u32',   name: 'frame',          desc: 'frame counter' },
  { type: 'vec2f', name: 'resolution',     desc: 'viewport size in pixels' },
  { type: 'vec2f', name: 'mouse',          desc: 'pointer position in pixels' },
  { type: 'f32',   name: 'bpm',            desc: 'beats per minute' },
  { type: 'f32',   name: 'beat',           desc: 'absolute beat (fractional)' },
  { type: 'f32',   name: 'barProgress',    desc: '0→1 within current bar' },
  { type: 'f32',   name: 'quarterPhase',   desc: '0→1 within a quarter note' },
  { type: 'f32',   name: 'eighthPhase',    desc: '0→1 within an eighth note' },
  { type: 'f32',   name: 'sixteenthPhase', desc: '0→1 within a sixteenth note' },
] as const;

// ---- Scene management -----------------------------------------------------
function addScene() {
  itemCounter += 1;
  scenes.value.push({
    id: crypto.randomUUID(),
    name: `scene${itemCounter}`,
    shaders: [],
  });
  selectedSceneIdx.value = scenes.value.length - 1;
  selectedShaderIdx.value = -1;
}

function removeScene(idx: number) {
  scenes.value.splice(idx, 1);
  if (selectedSceneIdx.value >= scenes.value.length) {
    selectedSceneIdx.value = scenes.value.length - 1;
  }
  selectedShaderIdx.value = -1;
}

function selectScene(idx: number) {
  selectedSceneIdx.value = idx;
  selectedShaderIdx.value = -1;
}

// ---- Shader management (within selected scene) ----------------------------
function makeShader(type: ShaderType, suffix: string): SceneShader {
  itemCounter += 1;
  return {
    id: crypto.randomUUID(),
    name: `${suffix}${itemCounter}`,
    type,
    fragmentShader: DEFAULT_SCENE_FRAGMENT_WGSL,
    channels: [null, null, null, null],
    outputMode: 'buffer',
  };
}

function addShader() {
  const sc = selectedScene.value;
  if (!sc) return;
  sc.shaders.push(makeShader('pixelshader', 'shader'));
  selectedShaderIdx.value = sc.shaders.length - 1;
}

function addPostFx() {
  const sc = selectedScene.value;
  if (!sc) return;
  sc.shaders.push(makeShader('postfx', 'postfx'));
  selectedShaderIdx.value = sc.shaders.length - 1;
}

function removeShader(idx: number) {
  const sc = selectedScene.value;
  if (!sc) return;
  sc.shaders.splice(idx, 1);
  if (selectedShaderIdx.value >= sc.shaders.length) {
    selectedShaderIdx.value = sc.shaders.length - 1;
  }
}

function moveShaderUp(idx: number) {
  const shaders = selectedScene.value?.shaders;
  if (!shaders || idx <= 0) return;
  [shaders[idx - 1], shaders[idx]] = [shaders[idx], shaders[idx - 1]];
  if (selectedShaderIdx.value === idx) selectedShaderIdx.value = idx - 1;
  else if (selectedShaderIdx.value === idx - 1) selectedShaderIdx.value = idx;
}

function moveShaderDown(idx: number) {
  const shaders = selectedScene.value?.shaders;
  if (!shaders || idx >= shaders.length - 1) return;
  [shaders[idx], shaders[idx + 1]] = [shaders[idx + 1], shaders[idx]];
  if (selectedShaderIdx.value === idx) selectedShaderIdx.value = idx + 1;
  else if (selectedShaderIdx.value === idx + 1) selectedShaderIdx.value = idx;
}

function selectShader(idx: number) {
  selectedShaderIdx.value = idx;
}

// ---- Stack compilation ----------------------------------------------------
async function recompileStack() {
  const sc = selectedScene.value;
  if (!previewCanvas.value || !sc) return;
  compileError.value = null;

  try {
    const stack = new LayerStack();

    for (const shader of sc.shaders) {
      if (shader.type === 'postfx') {
        stack.postFx(shader.fragmentShader);
      } else {
        const channels = shader.channels
          .map((src, ch) => src ? { channel: ch as 0 | 1 | 2 | 3, source: src } : null)
          .filter((c): c is NonNullable<typeof c> => c !== null);
        stack.scene({ name: shader.name, fragmentShader: shader.fragmentShader, channels });
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
      const firstScene = scenes.value[0];
      const firstShader = firstScene?.shaders[0];
      const stack = new LayerStack().scene({
        name: firstShader?.name ?? 'base',
        fragmentShader: firstShader?.fragmentShader ?? DEFAULT_SCENE_FRAGMENT_WGSL,
      });
      effect = await ShaderEffect.create(previewCanvas.value, { layerStack: stack });
      effect.play();
      isPlaying.value = true;
    } catch (err) {
      initError.value = webgpuInitError(err);
    }
  }
  selectedSceneIdx.value = 0;
  selectedShaderIdx.value = 0;
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

.sub-header {
  font-size: 0.68rem;
  border-top: 1px solid rgba(64, 192, 255, 0.12);
  color: rgba(100, 160, 220, 0.85);
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

.small-empty {
  flex: none;
  padding: 0.5rem 1rem;
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

/* ---- Parameters accordion ----------------------------------------------- */
.params-panels {
  flex-shrink: 0;
  border-bottom: 1px solid rgba(64, 192, 255, 0.12);
}

:deep(.params-panels .v-expansion-panel) {
  background: transparent !important;
}

:deep(.params-panels .v-expansion-panel-title) {
  min-height: 28px !important;
  padding: 0 0.75rem !important;
  font-size: 0.7rem;
  color: rgba(64, 192, 255, 0.75);
  font-family: 'Audiowide', sans-serif;
}

:deep(.params-panels .v-expansion-panel-title .v-expansion-panel-title__overlay) {
  background: transparent;
}

:deep(.params-panels .v-expansion-panel-text__wrapper) {
  padding: 0.4rem 0.75rem 0.5rem !important;
}

.params-panel-title {
  display: flex;
  align-items: center;
}

.uniform-grid {
  display: grid;
  grid-template-columns: 52px 1fr 1fr;
  gap: 2px 0.5rem;
}

.uniform-row {
  display: contents;
}

.uniform-type {
  font-family: monospace;
  font-size: 0.68rem;
  color: #56d3c2;
}

.uniform-name {
  font-family: monospace;
  font-size: 0.68rem;
  color: #6ec2ff;
}

.uniform-desc {
  font-size: 0.66rem;
  color: rgba(255, 255, 255, 0.4);
}

.channel-info-grid {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.channel-info-row {
  display: grid;
  grid-template-columns: 80px 110px 1fr;
  gap: 0.4rem;
  align-items: center;
  font-size: 0.68rem;
}

.channel-binding {
  font-family: monospace;
  color: #6ec2ff;
}

.channel-sampler {
  font-family: monospace;
  color: rgba(255, 255, 255, 0.4);
}

.channel-source {
  font-family: monospace;
  color: #96d166;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
