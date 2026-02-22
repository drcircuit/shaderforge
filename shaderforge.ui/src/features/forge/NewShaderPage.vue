<template>
  <div class="shader-editor">
    <!-- Main editor area -->
    <div class="editor-main">
      <!-- Code editor section -->
      <div class="code-section tile">
        <div class="editors-container" :class="{ 'advanced-mode': advancedMode }">
          <div 
            class="vertex-editor"
            :style="{ height: advancedMode ? '50%' : '0' }"
          >
            <MonacoEditor
              v-model="vertexShaderCode"
              language="wgsl"
              :options="editorOptions"
            />
          </div>
          <div 
            class="fragment-editor"
            :style="{ height: advancedMode ? '50%' : '100%' }"
          >
            <MonacoEditor
              v-model="fragmentShaderCode"
              language="wgsl"
              :options="editorOptions"
            />
          </div>
        </div>
        <div class="shortcut-hints">
          <span>Ctrl+R: Recompile Shader</span>
          <span>Ctrl+E: Toggle Play/Stop</span>
        </div>
      </div>

      <!-- Preview section -->
      <div class="preview-section tile">
        <!-- Header section -->
        <div class="editor-header">
          <v-text-field
            v-model="shaderTitle"
            label="Shader Title"
            class="title-input"
          />
          <v-textarea
            v-model="shaderDescription"
            label="Description"
            rows="2"
            class="description-input"
          />
          <v-switch
            v-model="isPrivate"
            label="Private Shader"
            class="privacy-switch"
          />
          <div class="shader-type-selector">
            <v-btn-toggle v-model="vertexShaderType" mandatory>
              <v-btn value="quad">Viewport Quad</v-btn>
              <v-btn value="cube">Textured Cube</v-btn>
              <v-btn value="sphere">Ico Sphere</v-btn>
            </v-btn-toggle>
            <v-switch
              v-model="advancedMode"
              label="Advanced Mode"
              class="advanced-switch"
            />
          </div>
        </div>
        <div ref="previewContainer" class="preview-container">
          <canvas ref="previewCanvas" class="preview-canvas"></canvas>
          <div v-if="compileError" class="compile-error-overlay">
            <pre>{{ compileError }}</pre>
          </div>
        </div>
        
        <!-- Asset tray -->
        <div class="asset-tray">
          <div class="asset-list">
            <div 
              v-for="asset in assets" 
              :key="asset.id" 
              class="asset-item"
            >
              <v-img
                v-if="asset.type === 'texture'"
                :src="asset.thumbnail"
                class="asset-thumbnail"
              />
              <v-icon v-else>
                {{ getAssetIcon(asset.type) }}
              </v-icon>
              <span class="asset-name">{{ asset.name }}</span>
            </div>
            <!-- Empty slots -->
            <div v-for="i in 5 - assets.length" :key="`empty-${i}`" class="asset-item empty-slot">
              <v-icon>mdi-plus</v-icon>
            </div>
          </div>
          <v-btn
            icon
            class="add-asset-btn"
            @click="showAssetDialog"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Add save options -->
    <div class="save-options">
      <v-btn
        color="primary"
        @click="saveShader"
        class="save-btn"
      >
        {{ isAuthenticated ? 'Save to Platform' : 'Save Locally' }}
      </v-btn>
      
      <v-tooltip
        v-if="!isAuthenticated"
        activator="parent"
        location="top"
      >
        Login to save shaders to your profile
      </v-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import MonacoEditor from '@/components/MonacoEditor.vue';
import { useRouter } from 'vue-router';
import { ShaderEffect, DEFAULT_FRAGMENT_WGSL, DEFAULT_VERTEX_WGSL } from '@shaderforge/engine';
import { webgpuInitError } from '@/utils/webgpu';

// State
const shaderTitle = ref('');
const shaderDescription = ref('');
const isPrivate = ref(false);
const vertexShaderType = ref('quad');
const advancedMode = ref(false);
const vertexShaderCode = ref(DEFAULT_VERTEX_WGSL);
const fragmentShaderCode = ref(DEFAULT_FRAGMENT_WGSL);
const previewCanvas = ref<HTMLCanvasElement | null>(null);
const assets = ref<any[]>([]);
const isPlaying = ref(true);
const compileError = ref<string | null>(null);

// ShaderEffect instance
let effect: ShaderEffect | null = null;

// Editor configuration
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

// Initialize ShaderEffect
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
      console.error('Failed to initialize ShaderEffect:', error);
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

// Handle keyboard shortcuts
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.ctrlKey && event.key === 'r') {
    event.preventDefault();
    recompileShader();
  } else if (event.ctrlKey && event.key === 'e') {
    event.preventDefault();
    togglePlayStop();
  }
};

// Recompile shader (fragment first, vertex second — matches ShaderEffect.compile signature)
const recompileShader = async () => {
  if (effect) {
    try {
      const result = await effect.compile(fragmentShaderCode.value, vertexShaderCode.value);
      compileError.value = result.ok ? null : (result.error ?? 'Unknown compile error');
    } catch (error) {
      compileError.value = String(error);
    }
  }
};

// Toggle play/stop
const togglePlayStop = () => {
  if (!effect) return;
  if (isPlaying.value) {
    effect.pause();
  } else {
    effect.play();
  }
  isPlaying.value = !isPlaying.value;
};

// Asset handling
const getAssetIcon = (type: string) => {
  switch (type) {
    case 'cubemap': return 'mdi-cube-outline';
    case 'audio': return 'mdi-waveform';
    default: return 'mdi-file';
  }
};

const showAssetDialog = () => {
  // Implement asset upload dialog
};

const router = useRouter();
const isAuthenticated = false; // Replace with your auth state

// Save functionality
const saveShader = async () => {
  if (isAuthenticated) {
    // Save to API
    try {
      // API save logic
    } catch (error) {
      console.error('Failed to save shader:', error);
    }
  } else {
    const shader = {
      id: crypto.randomUUID(),
      title: shaderTitle.value,
      description: shaderDescription.value,
      vertexShader: vertexShaderCode.value,
      fragmentShader: fragmentShaderCode.value,
      created: new Date().toISOString()
    };

    const localShaders = JSON.parse(localStorage.getItem('localShaders') || '[]');
    localShaders.push(shader);
    localStorage.setItem('localShaders', JSON.stringify(localShaders));
  }
};
</script>

<style scoped>
.shader-editor {
  height: 100%;
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.editor-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
  height: calc(100% - 120px);
}

.editors-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: calc(100% - 48px);
  transition: all 0.3s ease;
}

.vertex-editor,
.fragment-editor {
  border-radius: 4px;
  overflow: hidden;
  transition: height 0.3s ease;
  background: #1e1e1e; /* Add a background color to ensure visibility */
}

.preview-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16/10;
  background: #000;
  border-radius: 4px;
  overflow: hidden;
}

.preview-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.compile-error-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(200, 0, 0, 0.85);
  color: #fff;
  font-family: monospace;
  font-size: 0.75rem;
  padding: 8px 12px;
  max-height: 40%;
  overflow-y: auto;
  /* Required so \n line-breaks in the error message string render in HTML */
  white-space: pre-wrap;
  word-break: break-word;
  z-index: 10;
}

.shortcut-hints {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Responsive design */
@media (max-width: 1200px) {
  .editor-main {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
  }

  .code-section,
  .preview-section {
    width: 100%;
    height: auto;
  }

  .editors-container {
    height: auto;
  }

  .vertex-editor,
  .fragment-editor {
    height: auto;
  }
}

.save-options {
  position: absolute;
  bottom: 1.2rem;
  right: 1.2rem;
  z-index: 10;
}

.save-btn {
  min-width: 150px;
}

.asset-tray {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.asset-list {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.asset-item {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.asset-item:hover {
  background: rgba(255, 255, 255, 0.2);
}

.empty-slot {
  background: rgba(255, 255, 255, 0.05);
  border: 1px dashed rgba(255, 255, 255, 0.1);
}

.asset-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.add-asset-btn {
  align-self: center;
  margin-top: 1rem;
}
</style>