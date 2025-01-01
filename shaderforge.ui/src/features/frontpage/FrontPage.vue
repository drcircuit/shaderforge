<template>
  <div class="front-page">
    <!-- Featured Shader Section -->
    <section v-if="featuredShader" class="featured-shader">
      <h2>Featured Shader</h2>
      <div class="shader-preview">
        <img :src="featuredShader.imageUrl" alt="Featured Shader" />
        <h3>{{ featuredShader.name }}</h3>
        <p>{{ featuredShader.description }}</p>
        <p><strong>Author:</strong> {{ featuredShader.author }}</p>
        <p><strong>Likes:</strong> {{ featuredShader.likes }}</p>
        <p><strong>Views:</strong> {{ featuredShader.views }}</p>
      </div>
    </section>

    <!-- Shader Thumbnails Section -->
    <section class="shader-thumbnails">
      <h3>Newest Shaders</h3>
      <div class="thumbnails">
        <div v-for="shader in newestShaders" :key="shader.id" class="thumbnail">
          <img :src="shader.imageUrl" :alt="shader.name" />
          <h4>{{ shader.name }}</h4>
          <p>{{ shader.description }}</p>
          <p><strong>Likes:</strong> {{ shader.likes }}</p>
          <p><strong>Views:</strong> {{ shader.views }}</p>
        </div>
      </div>

      <h3>Highest Rated</h3>
      <div class="thumbnails">
        <div
          v-for="shader in highestRatedShaders"
          :key="shader.id"
          class="thumbnail"
        >
          <img :src="shader.imageUrl" :alt="shader.name" />
          <h4>{{ shader.name }}</h4>
          <p>{{ shader.description }}</p>
          <p><strong>Likes:</strong> {{ shader.likes }}</p>
          <p><strong>Views:</strong> {{ shader.views }}</p>
        </div>
      </div>

      <h3>Most Viewed</h3>
      <div class="thumbnails">
        <div
          v-for="shader in mostViewedShaders"
          :key="shader.id"
          class="thumbnail"
        >
          <img :src="shader.imageUrl" :alt="shader.name" />
          <h4>{{ shader.name }}</h4>
          <p>{{ shader.description }}</p>
          <p><strong>Likes:</strong> {{ shader.likes }}</p>
          <p><strong>Views:</strong> {{ shader.views }}</p>
        </div>
      </div>
    </section>

    <!-- Call-to-Action Section -->
    <section class="cta">
      <h2>Welcome to ShaderForge</h2>
      <p>Create, share, and explore WebGPU shaders. Learn how it works!</p>
      <button @click="signUp">Sign Up and Start Sharing</button>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import {
  getFeaturedShader,
  getNewestShaders,
  getHighestRatedShaders,
  getMostViewedShaders,
} from '@/services/apiService';
import { Shader } from '@/models/shaders';

export default defineComponent({
  name: 'FrontPage',
  setup() {
    // State variables
    const featuredShader = ref<Shader | null>(null);
    const newestShaders = ref<Shader[]>([]);
    const highestRatedShaders = ref<Shader[]>([]);
    const mostViewedShaders = ref<Shader[]>([]);

    // Fetch data on component mount
    onMounted(async () => {
      try {
        featuredShader.value = await getFeaturedShader();
        newestShaders.value = await getNewestShaders();
        highestRatedShaders.value = await getHighestRatedShaders();
        mostViewedShaders.value = await getMostViewedShaders();
      } catch (error) {
        console.error('Failed to fetch shader data:', error);
      }
    });

    // Sign-up button handler
    const signUp = () => {
      console.log('Redirect to sign-up page');
    };

    return {
      featuredShader,
      newestShaders,
      highestRatedShaders,
      mostViewedShaders,
      signUp,
    };
  },
});
</script>

<style scoped>
.front-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

.featured-shader {
  text-align: center;
}

.shader-thumbnails {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.thumbnails {
  display: flex;
  gap: 10px;
  overflow-x: auto;
}

.thumbnail {
  flex: 0 0 auto;
  text-align: center;
  width: 150px;
}

img {
  max-width: 100%;
  border-radius: 8px;
}

.cta {
  text-align: center;
}

button {
  background-color: #007acc;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #005fa3;
}
</style>
