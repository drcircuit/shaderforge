<template>
  <v-app class="app-container">
    <!-- Background system -->
    <div class="background-system">
      <!-- Fallback gradient is always present -->
      <div class="background-fallback"></div>
      <!-- Dynamic backgrounds from API -->
      <div 
        v-for="(image, index) in backgroundImages" 
        :key="index"
        class="background-image"
        :class="{ active: currentBgIndex === index }"
        :style="{ backgroundImage: `url(${API_BASE_URL}${image.url})` }"
      ></div>
      <!-- Overlay for better content readability -->
      <div class="background-overlay"></div>
    </div>
    
    <NavBar />
    <v-main class="main-container">
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import NavBar from "@/components/NavBar.vue";
import { getSiteBackgrounds } from '@/services/apiService';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:5220';

interface BackgroundImage {
  url: string;
}

const backgroundImages = ref<BackgroundImage[]>([]);
const currentBgIndex = ref(0);
let intervalId: ReturnType<typeof setInterval> | null = null;

const cycleBackground = () => {
  // log for debugging
  console.log('Cycling background');
  
  currentBgIndex.value = (currentBgIndex.value + 1) % backgroundImages.value.length;
};

onMounted(async () => {
  try {
    const backgrounds = await getSiteBackgrounds();
    if (backgrounds && backgrounds.length > 0) {
      backgroundImages.value = backgrounds.map(url => ({ url }));
      // Start cycling if we have more than one background
      if (backgrounds.length > 1) {
        intervalId = setInterval(cycleBackground, 10000);
      }
    }
  } catch (error) {
    console.error('Failed to fetch background images:', error);
  }
});

onBeforeUnmount(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
</script>

<style>
/* --------------------------------
   1. Load your custom fonts globally
   -------------------------------- */
@import url('https://fonts.googleapis.com/css2?family=Audiowide&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Oxanium:wght@200..800&display=swap');

/* --------------------------------
   2. Remove scrollbar and fill viewport
   -------------------------------- */
html, body, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100vh;
  overflow: hidden; /* remove page scrollbar */
  color: #e0e0e0;
  font-family: 'Oxanium', sans-serif; /* default body font */
}

/* Make Vuetify wrappers fill the screen */
.v-application, .v-application--wrap {
  width: 100%;
  height: 100%;
}

/* v-app container fills what's left */
.app-container {
  height: 100vh;
}

/* main-container fills the remainder after navbar */
.main-container {
  height: calc(100vh - 64px);
  overflow-y: auto;
  overflow-x: hidden;
  background: transparent;
}

/* --------------------------------
   3. Make headings, buttons, links use Audiowide
   -------------------------------- */
h1, h2, h3, h4, h5, h6,
.v-btn, .v-btn__content,
a, .tile-title,
.v-carousel__prev, .v-carousel__next {
  font-family: 'Audiowide', sans-serif !important;
}

/* Make sure Vuetify's v-main doesn't introduce scrollbars */
.v-main {
  background-image: url('/public/assets/images/hexbg.png') !important;
  background-repeat: repeat !important;
  background-size: 20% !important;
}

/* Override all Vuetify overflow behaviors */
.v-application,
.v-application--wrap {
  overflow-y: hidden !important;
}

.background-system {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0; /* Lower z-index */
  background: #020202; /* Ensure dark background */
}

.background-fallback {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #444444 0%, #020202 100%);
  z-index: -3;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0;
  transition: opacity 2s ease-in-out;
}

.background-image.active {
  opacity: 0.6; /* Reduced opacity */
}

/* Remove the blue gradient overlay */
.background-overlay {
  display: none;
}

.main-container {
  background: transparent !important;
  position: relative;
  z-index: 1;
}

/* Remove any existing main-container overlay */
.main-container::before {
  display: none;
}

/* Keep hexagon pattern but make it more subtle */
.v-main {
  opacity: 0.85;
  position: relative;
  z-index: 1;
}
</style>
