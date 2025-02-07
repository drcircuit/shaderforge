<template>
  <v-container>
    <!-- Row 1: Carousels + Articles -->
    <v-row>
      <v-col cols="12" md="6">
        <h2>Newly Forged & Popular Shaders</h2>
        <v-carousel>
          <v-carousel-item v-for="shader in newestShaders" :key="shader.id">
            <v-img :src="shader.imageUrl"></v-img>
          </v-carousel-item>
        </v-carousel>
      </v-col>
      <v-col cols="12" md="6">
        <h3>Latest Articles</h3>
        <v-list>
          <v-list-item v-for="article in articles" :key="article.id">
            <v-list-item-title>
              <a :href="article.url" target="_blank">{{ article.title }}</a>
              <v-chip v-if="article.isExternal" color="yellow">EXTERNAL</v-chip>
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>

    <!-- Row 2: Featured Shader -->
    <v-row>
      <v-col cols="12" class="text-center">
        <h2>Featured Shader</h2>
        <v-img :src="featuredShader?.imageUrl ?? '/assets/shader1.jpg'"></v-img>
      </v-col>
    </v-row>

    <!-- Row 3: Call-to-Action Buttons -->
    <v-row>
      <v-col cols="12" md="6">
        <v-btn block color="primary">Start Forging!</v-btn>
      </v-col>
      <v-col cols="12" md="6">
        <v-btn block color="success">Register</v-btn>
      </v-col>
    </v-row>
  </v-container>
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
    const isDesignMode = true;//import.meta.env.VITE_DESIGN_MODE === 'true';

    // State variables
    const featuredShader = ref<Shader | null>(null);
    const newestShaders = ref<Shader[]>([]);
    const highestRatedShaders = ref<Shader[]>([]);
    const mostViewedShaders = ref<Shader[]>([]);
    const articles = ref<Article[]>([]);

    // Fetch data on component mount
    onMounted(async () => {
      try {
        if (isDesignMode) {
          featuredShader.value = getMockFeaturedShader();
          newestShaders.value = getMockNewestShaders();
          articles.value = getMockArticles();
          console.log("Article URLs:", articles.value.map(a => [typeof a.url, a.url]));

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

    // Sign-up button handler
    const signUp = () => {
      console.log('Redirect to sign-up page');
    };
    const startForging = () => 0;
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
