<template>
  <!-- The grid container fills the viewport -->
  <div class="desktop-layout">
    <!-- Top Left: Carousel -->
    <div class="top-left tile">
      <h2 class="tile-title">Newly Forged & Popular Shaders</h2>
      <v-carousel cycle height="calc(100% - 3rem)">
        <v-carousel-item v-for="shader in newestShaders" :key="shader.id">
          <v-img :src="shader.imageUrl" class="responsive-img"></v-img>
        </v-carousel-item>
      </v-carousel>
    </div>

    <!-- Top Right: Articles List -->
    <div class="top-right tile">
      <h3 class="tile-title">Latest Articles</h3>
      <v-list dense>
        <v-list-item v-for="article in articles" :key="article.id">
          <v-list-item-title>
            <a :href="article.url" target="_blank">{{ article.title }}</a>
            <v-chip v-if="article.isExternal" color="yellow" class="ml-2">EXTERNAL</v-chip>
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </div>

    <!-- Middle Row: Featured Shader -->
    <div class="featured tile">
      <h2 class="tile-title">Featured Shader</h2>
      <v-img :src="featuredShader?.imageUrl ?? '/assets/shader1.jpg'" class="responsive-img"></v-img>
    </div>

    <!-- Bottom Left: Start Forging Button -->
    <div class="button-left tile">
      <v-btn block color="primary" @click="startForging">Start Forging!</v-btn>
    </div>

    <!-- Bottom Right: Register Button -->
    <div class="button-right tile">
      <v-btn block color="success" @click="signUp">Register</v-btn>
    </div>
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
import { getMockFeaturedShader, getMockNewestShaders, getMockArticles } from '@/services/mockApiService';
import { Shader } from '@/models/shaders';
import { Article } from '@/models/articles';

export default defineComponent({
  name: 'FrontPage',
  setup() {
    const isDesignMode = true; // Replace with your actual environment logic

    // State variables for shaders and articles
    const featuredShader = ref<Shader | null>(null);
    const newestShaders = ref<Shader[]>([]);
    const highestRatedShaders = ref<Shader[]>([]);
    const mostViewedShaders = ref<Shader[]>([]);
    const articles = ref<Article[]>([]);

    onMounted(async () => {
      try {
        if (isDesignMode) {
          featuredShader.value = getMockFeaturedShader();
          newestShaders.value = getMockNewestShaders();
          articles.value = getMockArticles();
        } else {
          featuredShader.value = await getFeaturedShader();
          newestShaders.value = await getNewestShaders();
          highestRatedShaders.value = await getHighestRatedShaders();
          mostViewedShaders.value = await getMostViewedShaders();
        }
      } catch (error) {
        console.error('Failed to fetch shader data:', error);
      }
    });

    // Button click handlers
    const signUp = () => {
      console.log('Redirect to sign-up page');
    };
    const startForging = () => {
      console.log('Start forging shader');
    };

    return {
      featuredShader,
      newestShaders,
      highestRatedShaders,
      mostViewedShaders,
      articles,
      signUp,
      startForging,
    };
  },
});
</script>

<style scoped>
/* Grid container that fills the entire viewport */
.desktop-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 40% 40% 20%;
  grid-template-areas:
    "top-left top-right"
    "featured featured"
    "button-left button-right";
  width: 100vw;
  height: 100vh;
  background-color: #121212;
  color: #e0e0e0;
  gap: 1rem;
  padding: 1rem;
  box-sizing: border-box;
}

/* Each “tile” gets a dark background, rounded corners, and a soft, fading shadow */
.tile {
  background-color: #1f1f1f;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

/* Grid area definitions */
.top-left {
  grid-area: top-left;
}

.top-right {
  grid-area: top-right;
}

.featured {
  grid-area: featured;
  text-align: center;
}

.button-left {
  grid-area: button-left;
  display: flex;
  align-items: center;
  justify-content: center;
}

.button-right {
  grid-area: button-right;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Ensure images fill the available space without distortion */
.responsive-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Title styling for each tile */
.tile-title {
  font-family: 'Roboto', sans-serif;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
</style>
