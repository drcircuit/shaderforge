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
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import MonacoEditor from '@/components/MonacoEditor.vue';
import { useRouter } from 'vue-router';
import { DefaultFragmentShader, DefaultVertexShader, ShaderforgeComponent } from 'shaderforge-lib';

// State
const shaderTitle = ref('');
const shaderDescription = ref('');
const isPrivate = ref(false);
const vertexShaderType = ref('quad');
const advancedMode = ref(false);
const vertexShaderCode = ref(DefaultVertexShader);
const fragmentShaderCode = ref(DefaultFragmentShader);
const previewCanvas = ref<HTMLCanvasElement | null>(null);
const previewContainer = ref<HTMLDivElement | null>(null);
const assets = ref<any[]>([]);

// Shaderforge component instance
let shaderforge: ShaderforgeComponent | null = null;

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

// Initialize ShaderForge
onMounted(async () => {
  if (previewContainer.value) {
    shaderforge = new ShaderforgeComponent(previewContainer.value);
    await shaderforge.initialize();

    // Set initial shader code
    try {
      await shaderforge.setShaders(DefaultVertexShader, DefaultFragmentShader);
    } catch (error) {
      console.error('Failed to load initial shaders:', error);
    }
  }
});

// Watch for shader code changes
watch([vertexShaderCode, fragmentShaderCode], async () => {
  if (shaderforge) {
    try {
      await shaderforge.reloadEffect();
    } catch (error) {
      console.error('Failed to update shaders:', error);
    }
  }
});

// Watch for vertex shader type changes
watch(vertexShaderType, () => {
  if (!advancedMode.value) {
    switch (vertexShaderType.value) {
      case 'quad':
        vertexShaderCode.value = DefaultVertexShader;
        break;
      // Add other vertex shader templates when available
    }
  }
});

onBeforeUnmount(() => {
  // Clean up shaderforge instance if necessary
  shaderforge = null;
});

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
    // Save to local storage
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

    // Show success message
    // TODO: Add success notification
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