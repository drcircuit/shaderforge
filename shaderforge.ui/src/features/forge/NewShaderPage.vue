<template>
  <div class="shader-editor">
    <!-- Toolbar row -->
    <div class="editor-toolbar tile">
      <div class="toolbar-left">
        <v-text-field
          v-model="shaderTitle"
          label="Shader Title"
          density="compact"
          hide-details
          variant="outlined"
          class="title-input"
        />
        <v-btn-toggle v-model="vertexShaderType" mandatory density="compact" class="type-toggle">
          <v-btn value="quad" size="small">Quad</v-btn>
          <v-btn value="cube" size="small">Cube</v-btn>
          <v-btn value="sphere" size="small">Sphere</v-btn>
        </v-btn-toggle>
        <v-switch
          v-model="advancedMode"
          label="Advanced"
          density="compact"
          hide-details
          color="primary"
          class="adv-switch"
        />
      </div>
      <div class="toolbar-right">
        <span class="shortcut-hint d-none d-sm-inline">Ctrl+R: Recompile &nbsp; Ctrl+E: Play/Pause</span>
        <v-btn
          :color="isPlaying ? 'primary' : 'default'"
          variant="outlined"
          size="small"
          @click="togglePlayStop"
        >{{ isPlaying ? 'Pause' : 'Play' }}</v-btn>
        <v-btn
          color="primary"
          variant="outlined"
          size="small"
          @click="recompileShader"
        >Compile</v-btn>
        <v-btn
          :color="isAuthenticated ? 'primary' : 'default'"
          size="small"
          @click="saveShader"
        >{{ isAuthenticated ? 'Save' : 'Save Locally' }}</v-btn>
        <v-snackbar v-model="saveSuccess" timeout="2500" color="success" location="bottom right">
          Shader saved!
        </v-snackbar>
        <v-snackbar :model-value="!!saveError" @update:model-value="saveError = null" timeout="4000" color="error" location="bottom right">
          {{ saveError }}
        </v-snackbar>
      </div>
    </div>

    <!-- Main panels -->
    <div class="editor-panels">
      <!-- Code editor(s) -->
      <div class="code-panel tile">
        <div class="code-panel-tabs" v-if="advancedMode">
          <v-tabs v-model="activeTab" density="compact" color="primary" class="editor-tabs">
            <v-tab value="fragment">Fragment Shader</v-tab>
            <v-tab value="vertex">Vertex Shader</v-tab>
          </v-tabs>
        </div>
        <div v-else class="panel-label">Fragment Shader</div>
        <div class="editor-body">
          <MonacoEditor
            v-show="!advancedMode || activeTab === 'fragment'"
            v-model="fragmentShaderCode"
            language="wgsl"
            :options="editorOptions"
            class="fill-editor"
          />
          <MonacoEditor
            v-show="advancedMode && activeTab === 'vertex'"
            v-model="vertexShaderCode"
            language="wgsl"
            :options="editorOptions"
            class="fill-editor"
          />
        </div>
      </div>

      <!-- Preview + metadata -->
      <div class="preview-panel tile">
        <div class="panel-label">Preview</div>
        <div ref="previewContainer" class="preview-container">
          <canvas ref="previewCanvas" class="preview-canvas"></canvas>
          <div v-if="compileError" class="compile-error-overlay">
            <pre>{{ compileError }}</pre>
          </div>
        </div>

        <!-- Metadata (collapsible on small screens) -->
        <v-expansion-panels class="meta-panels" variant="accordion">
          <v-expansion-panel>
            <v-expansion-panel-title class="meta-panel-title">Shader Metadata</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-textarea
                v-model="shaderDescription"
                label="Description"
                rows="2"
                density="compact"
                variant="outlined"
                hide-details
                class="mb-2"
              />
              <v-switch
                v-model="isPrivate"
                label="Private Shader"
                density="compact"
                hide-details
                color="primary"
              />
            </v-expansion-panel-text>
          </v-expansion-panel>
          <v-expansion-panel>
            <v-expansion-panel-title class="meta-panel-title">Asset Channels (iChannel0–3)</v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="asset-tray">
                <div
                  v-for="n in 4"
                  :key="n"
                  class="asset-slot"
                  :title="`iChannel${n - 1}: click to upload image`"
                  @click="openChannelPicker(n - 1)"
                >
                  <input
                    :ref="setChannelInputRef(n - 1)"
                    type="file"
                    accept="image/*"
                    style="display:none"
                    @change="(e) => onChannelFileChange(n - 1, e)"
                  />
                  <img
                    v-if="channelImages[n - 1]"
                    :src="channelImages[n - 1]!"
                    :alt="`Uploaded texture for iChannel${n - 1}`"
                    class="slot-thumbnail"
                  />
                  <template v-else>
                    <v-icon size="20">mdi-plus</v-icon>
                  </template>
                  <span class="slot-label">iCh{{ n - 1 }}</span>
                </div>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import MonacoEditor from '@/components/MonacoEditor.vue';
import {
  ShaderEffect,
  DEFAULT_FRAGMENT_WGSL,
  DEFAULT_VERTEX_WGSL,
  DEFAULT_CUBE_VERTEX_WGSL,
  DEFAULT_SPHERE_VERTEX_WGSL,
} from '@shaderforge/engine';
import { webgpuInitError } from '@/utils/webgpu';
import { useAuth } from '@/composables/useAuth';
import { createShader } from '@/services/apiService';

// State
const shaderTitle = ref('');
const shaderDescription = ref('');
const isPrivate = ref(false);
const vertexShaderType = ref('quad');
const advancedMode = ref(false);
const activeTab = ref('fragment');
const vertexShaderCode = ref(DEFAULT_VERTEX_WGSL);
const fragmentShaderCode = ref(DEFAULT_FRAGMENT_WGSL);
const previewCanvas = ref<HTMLCanvasElement | null>(null);
const isPlaying = ref(true);
const compileError = ref<string | null>(null);

// iChannel texture upload state
const channelImages = ref<(string | null)[]>([null, null, null, null]);
const channelInputRefs = ref<(HTMLInputElement | null)[]>([null, null, null, null]);

const setChannelInputRef = (idx: number) => (el: unknown) => {
  channelInputRefs.value[idx] = el as HTMLInputElement | null;
};

// Sphere geometry constants — must match DEFAULT_SPHERE_VERTEX_WGSL
const SPHERE_SLICES = 32;
const SPHERE_STACKS = 16;

// Number of vertices for each type
const VERTEX_COUNTS: Record<string, number> = {
  quad: 6,
  cube: 36,
  sphere: SPHERE_SLICES * SPHERE_STACKS * 6,
};

// Map vertex shader type to its WGSL code
const VERTEX_SHADERS: Record<string, string> = {
  quad: DEFAULT_VERTEX_WGSL,
  cube: DEFAULT_CUBE_VERTEX_WGSL,
  sphere: DEFAULT_SPHERE_VERTEX_WGSL,
};

// When the type toggle changes, update the vertex shader code (and advance mode)
watch(vertexShaderType, (type) => {
  vertexShaderCode.value = VERTEX_SHADERS[type] ?? DEFAULT_VERTEX_WGSL;
});

let effect: ShaderEffect | null = null;

const editorOptions = {
  theme: 'shaderforge-dark',
  minimap: { enabled: false },
  fontSize: 14,
  automaticLayout: true,
  scrollBeyondLastLine: false,
  renderLineHighlight: 'all' as 'all',
  wordWrap: 'on' as 'on',
  padding: { top: 16, bottom: 16 },
};

onMounted(async () => {
  if (previewCanvas.value) {
    try {
      effect = await ShaderEffect.create(previewCanvas.value);
      const result = await effect.compile(DEFAULT_FRAGMENT_WGSL);
      if (!result.ok) {
        compileError.value = result.error ?? 'Unknown compile error';
      } else {
        compileError.value = null;
        effect.play();
      }
    } catch (error) {
      compileError.value = webgpuInitError(error);
    }
  }
  window.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  effect?.destroy();
  effect = null;
  window.removeEventListener('keydown', handleKeyDown);
});

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.ctrlKey && event.key === 'r') {
    event.preventDefault();
    recompileShader();
  } else if (event.ctrlKey && event.key === 'e') {
    event.preventDefault();
    togglePlayStop();
  }
};

const recompileShader = async () => {
  if (effect) {
    try {
      const vcount = VERTEX_COUNTS[vertexShaderType.value] ?? 6;
      const result = await effect.compile(fragmentShaderCode.value, vertexShaderCode.value, vcount);
      compileError.value = result.ok ? null : (result.error ?? 'Unknown compile error');
    } catch (error) {
      compileError.value = String(error);
    }
  }
};

const togglePlayStop = () => {
  if (!effect) return;
  if (isPlaying.value) {
    effect.pause();
  } else {
    effect.play();
  }
  isPlaying.value = !isPlaying.value;
};

// iChannel file upload
const openChannelPicker = (slotIndex: number) => {
  channelInputRefs.value[slotIndex]?.click();
};

const onChannelFileChange = (slotIndex: number, event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  // Revoke previous blob URL if any
  if (channelImages.value[slotIndex]) {
    URL.revokeObjectURL(channelImages.value[slotIndex]!);
  }
  channelImages.value[slotIndex] = url;
  // Reset input so the same file can be re-selected
  input.value = '';
};

const { isAuthenticated } = useAuth();
const saveError = ref<string | null>(null);
const saveSuccess = ref(false);

const saveShader = async () => {
  saveError.value = null;
  saveSuccess.value = false;
  if (isAuthenticated.value) {
    try {
      await createShader({
        name: shaderTitle.value || 'Untitled Shader',
        fragmentShaderCode: fragmentShaderCode.value,
        vertexShaderCode: vertexShaderCode.value,
        description: shaderDescription.value,
        isPublic: !isPrivate.value,
      });
      saveSuccess.value = true;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } | string } };
      const apiMsg = axiosError.response?.data;
      if (typeof apiMsg === 'string') {
        saveError.value = apiMsg;
      } else if (apiMsg && typeof apiMsg === 'object' && apiMsg.message) {
        saveError.value = apiMsg.message;
      } else {
        saveError.value = error instanceof Error ? error.message : 'Failed to save shader.';
      }
    }
  } else {
    const shader = {
      id: crypto.randomUUID(),
      title: shaderTitle.value,
      description: shaderDescription.value,
      vertexShader: vertexShaderCode.value,
      fragmentShader: fragmentShaderCode.value,
      created: new Date().toISOString(),
    };
    const localShaders = JSON.parse(localStorage.getItem('localShaders') || '[]');
    localShaders.push(shader);
    localStorage.setItem('localShaders', JSON.stringify(localShaders));
    saveSuccess.value = true;
  }
};
</script>

<style scoped>
/* Full-height no-scroll layout — fills the v-main area */
.shader-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
  box-sizing: border-box;
  overflow: hidden;
}

/* ---- Tile ---------------------------------------------------------------- */
.tile {
  background: rgba(16, 18, 24, 0.92);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(64, 192, 255, 0.15);
  border-radius: 8px;
}

/* ---- Toolbar ------------------------------------------------------------ */
.editor-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1 1 auto;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.title-input {
  max-width: 220px;
  min-width: 120px;
}

.type-toggle {
  flex-shrink: 0;
}

.adv-switch {
  flex-shrink: 0;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

/* Remove Vuetify 3 internal vertical padding from the switch so it aligns
   with the compact buttons on the same toolbar row */
.adv-switch :deep(.v-input__control),
.adv-switch :deep(.v-selection-control) {
  min-height: unset !important;
  /* Tighten the gap between the toggle track and "Advanced" label */
  column-gap: 4px;
}

/* 28px matches the height of size="small" v-btn in Vuetify 3 compact mode */
.adv-switch :deep(.v-selection-control__wrapper) {
  height: 28px;
}

.adv-switch :deep(.v-label) {
  font-size: 0.82rem;
  opacity: 0.85;
}

.shortcut-hint {
  font-size: 0.72rem;
  color: rgba(64, 192, 255, 0.5);
  white-space: nowrap;
}

/* ---- Main panels -------------------------------------------------------- */
.editor-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  flex: 1;
  min-height: 0;
}

/* ---- Code panel --------------------------------------------------------- */
.code-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.code-panel-tabs,
.panel-label {
  flex-shrink: 0;
  padding: 0 0.5rem;
  border-bottom: 1px solid rgba(64, 192, 255, 0.15);
}

.panel-label {
  font-family: 'Audiowide', sans-serif;
  font-size: 0.75rem;
  color: #40c0ff;
  padding: 0.4rem 0.75rem;
}

.editor-tabs {
  min-height: 36px !important;
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

/* ---- Preview panel ------------------------------------------------------ */
.preview-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.preview-container {
  position: relative;
  flex: 1;
  min-height: 0;
  background: #000;
  border-radius: 0 0 2px 2px;
}

.preview-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
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
  max-height: 40%;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
  z-index: 10;
}

/* ---- Metadata expansion panels ----------------------------------------- */
.meta-panels {
  flex-shrink: 0;
  border-top: 1px solid rgba(64, 192, 255, 0.1);
}

.meta-panel-title {
  font-size: 0.78rem !important;
  color: rgba(64, 192, 255, 0.75) !important;
  min-height: 36px !important;
  padding: 0 12px !important;
}

/* ---- Asset tray --------------------------------------------------------- */
.asset-tray {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.asset-slot {
  width: 64px;
  height: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px dashed rgba(64, 192, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  gap: 4px;
  position: relative;
  overflow: hidden;
}

.asset-slot:hover {
  background: rgba(64, 192, 255, 0.1);
  border-color: rgba(64, 192, 255, 0.4);
}

.slot-label {
  font-size: 0.65rem;
  color: rgba(64, 192, 255, 0.6);
  font-family: monospace;
}

.slot-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
  position: absolute;
  inset: 0;
  opacity: 0.85;
}

/* ---- Responsive --------------------------------------------------------- */

/* Tablet: stack editor + preview vertically */
@media (max-width: 959px) {
  .editor-panels {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }

  .shader-editor {
    overflow-y: auto;
    height: auto;
    min-height: 100%;
  }

  .editor-panels {
    min-height: 600px;
  }
}

/* Mobile: tighten toolbar */
@media (max-width: 599px) {
  .toolbar-left,
  .toolbar-right {
    width: 100%;
  }

  .title-input {
    max-width: 100%;
    flex: 1 1 100%;
  }
}
</style>