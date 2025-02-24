<template>
  <div class="desktop-layout">
    <!-- Top Left & Center: Welcome Message -->
    <div class="welcome-section tile">
      <h2 class="tile-title">Welcome</h2>
      <p class="welcome-message">Welcome to ShaderForge! Explore the latest and greatest shaders created by our community.</p>
    </div>

    <!-- Top Right: Articles List -->
    <div class="articles-section tile">
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

    <!-- Middle Row: Shader Carousel -->
    <div class="carousel-section tile">
      <h2 class="tile-title">Newly Forged & Popular Shaders</h2>
      <v-carousel
        cycle
        delimeter-icon="small-dot"
        hide-delimiter-background
        
      >
        <v-carousel-item
          v-for="shader in newestShaders"
          :key="shader.id"
        >
          <v-sheet height="100%">
            <div class="d-flex fill-height justify-center align-center">
              <v-img
                :src="shader.thumbnailUrl"
                contain
                height="100%"
              ></v-img>
            </div>
          </v-sheet>
        </v-carousel-item>
      </v-carousel>
    </div>

    <!-- Bottom Left: Featured Shader -->
    <div class="featured-section tile">
      <h2 class="tile-title">Featured Shader</h2>
      <v-img 
        :src="featuredShader?.thumbnailUrl ?? '/assets/shader1.jpg'" 
        class="featured-img"
        aspect-ratio="1.6"
        contain
      ></v-img>
    </div>

    <!-- Bottom Right: Action Buttons -->
    <div class="action-section">
      <div class="action-buttons">
        <v-btn 
          class="action-btn start-forging-btn" 
          @click.prevent="startForging"
          elevation="0"
        >
          Start Forging!
        </v-btn>
        <v-btn 
          class="action-btn register-btn" 
          @click.prevent="signUp"
          elevation="0"
        >
          Register
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const featuredShader = ref({
  thumbnailUrl: '/assets/shader1.jpg'
});

const newestShaders = ref([
  { id: 1, thumbnailUrl: '/assets/shader2.jpg' },
  { id: 2, thumbnailUrl: '/assets/shader3.jpg' },
  // Add more shaders as needed
]);

const articles = ref([
  { id: 1, title: 'Article 1', url: 'https://example.com/article1', isExternal: true },
  { id: 2, title: 'Article 2', url: 'https://example.com/article2', isExternal: false },
  // Add more articles as needed
]);

const signUp = async () => {
  console.log('Signup clicked'); // Debug log
  try {
    await router.push('/register');
  } catch (error) {
    console.error('Navigation error:', error);
  }
};

const startForging = async () => {
  console.log('Start forging clicked'); // Debug log
  try {
    await router.push('/forge/new');
  } catch (error) {
    console.error('Navigation error:', error);
  }
};
</script>

<style scoped>
/* Core layout - adjust row heights */
.desktop-layout {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 20% 30% 50%; /* Adjusted row heights */
  grid-template-areas:
    "welcome welcome articles"
    "carousel carousel carousel"
    "featured featured actions";
  gap: 1.2rem;
  padding: 1.2rem;
  padding-bottom: calc(1.2rem + 64px); /* Match top navbar height */
  background: transparent;
  max-width: 1800px;
  margin: 0 auto;
  height: 100%;
}

/* Grid areas */
.welcome-section {
  grid-area: welcome;
}

.articles-section {
  grid-area: articles;
}

/* Adjust carousel section */
.carousel-section {
  grid-area: carousel;
  max-height: 100%;
  overflow: hidden;
}

.v-carousel {
  height: calc(100% - 3rem) !important; /* Account for title */
}

.featured-section {
  grid-area: featured;
}

/* Action section adjustments */
.action-section {
  grid-area: actions;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.action-buttons {
  display: flex;
  gap: 1.2rem;
  width: 100%;
  max-width: 600px;
}

/* Make buttons more prominent */
.action-btn {
  flex: 1;
  height: 4rem;
  font-size: 1.2rem;
  min-width: 200px;
}

/* Update carousel size to fit one column */
.carousel {
  height: 100%;
  max-height: calc(100% - 3rem); /* Account for title */
  width: 100%;
}

.image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 1rem;
  max-width: 800px; /* Limit width for better proportions */
  margin: 0 auto;
}

.responsive-img {
  max-width: 80%;
  max-height: 80%;
  margin: 0 auto;
}

/* Featured image */
.featured-img {
  max-height: calc(100% - 3rem); /* Account for title */
  object-fit: contain;
}

/* Action buttons */
.action-btn {
  height: 4rem;
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

/* Refined panel styling */
.tile {
  background: rgba(16, 18, 24, 0.95); /* Darker, more opaque background */
  backdrop-filter: blur(20px);
  border: 1px solid rgba(64, 192, 255, 0.15);
  border-radius: 12px;
  padding: 1.2rem;
  box-shadow: 
    0 4px 24px -1px rgba(0, 0, 0, 0.6),
    inset 0 0 20px rgba(64, 192, 255, 0.05);
  position: relative;
  z-index: 2; /* Ensure panels are above background */
}

.tile:hover {
  border-color: rgba(64, 192, 255, 0.3);
  box-shadow: 
    0 8px 32px -1px rgba(0, 0, 0, 0.7),
    inset 0 0 20px rgba(64, 192, 255, 0.15);
}

/* Typography */
.tile-title {
  font-size: 0.95rem;
  letter-spacing: 0.05em;
  color: #40c0ff;
  margin: -1.2rem -1.2rem 1rem -1.2rem;
  padding: 0.8rem 1.2rem;
  border-bottom: 1px solid rgba(64, 192, 255, 0.2);
  background: rgba(12, 14, 18, 0.98); /* Nearly solid dark background */
  border-radius: 12px 12px 0 0;
  position: relative;
  z-index: 3;
}

.welcome-message {
  color: rgba(255, 255, 255, 0.9); /* Increased contrast */
  font-size: 1rem;
  line-height: 1.6;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Articles list */
.v-list {
  background: transparent !important;
  padding: 0 !important;
}

.v-list-item {
  border-radius: 6px;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
}

.v-list-item:hover {
  background: rgba(64, 192, 255, 0.1) !important;
}

.v-list-item-title a {
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  text-decoration: none;
  transition: all 0.3s ease;
}

.v-list-item-title a:hover {
  color: rgba(64, 192, 255, 0.9);
}

/* Call to action buttons */
.bottom-cta {
  gap: 1.2rem;
}

.start-forging-btn,
.register-btn {
  background: rgba(20, 20, 25, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(64, 192, 255, 0.2);
  border-radius: 28px;
  padding: 0.8rem 2rem;
  font-size: 0.9rem;
  letter-spacing: 0.1em;
  transition: all 0.3s ease;
}

.start-forging-btn {
  color: rgba(64, 192, 255, 0.9);
  box-shadow: 0 0 20px rgba(64, 192, 255, 0.1);
}

.start-forging-btn:hover {
  background: rgba(64, 192, 255, 0.1);
  border-color: rgba(64, 192, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 
    0 8px 32px rgba(64, 192, 255, 0.2),
    0 0 0 1px rgba(64, 192, 255, 0.2);
}

.register-btn {
  color: rgba(155, 89, 182, 0.9);
  box-shadow: 0 0 20px rgba(155, 89, 182, 0.1);
}

.register-btn:hover {
  background: rgba(155, 89, 182, 0.1);
  border-color: rgba(155, 89, 182, 0.4);
  transform: translateY(-2px);
  box-shadow: 
    0 8px 32px rgba(155, 89, 182, 0.2),
    0 0 0 1px rgba(155, 89, 182, 0.2);
}

/* Action buttons */
.action-buttons {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
  align-items: center;
}

.action-btn {
  flex: 1;
  height: 3.5rem;
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: all 0.3s ease;
}

.start-forging-btn {
  background: linear-gradient(60deg, #40c0ff, #0088cc) !important;
  box-shadow: 
    0 0 20px rgba(64, 192, 255, 0.4),
    0 0 40px rgba(64, 192, 255, 0.2),
    inset 0 0 10px rgba(255, 255, 255, 0.3) !important;
  border: none !important;
  color: white !important;
  mix-blend-mode: normal !important; /* Changed from screen to normal */
  position: relative;
  z-index: 1; /* Ensure button is clickable */
  pointer-events: auto; /* Ensure clicks register */
}

.start-forging-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(60deg, #40c0ff, #0088cc);
  opacity: 0.5;
  filter: blur(15px);
  z-index: -1;
  transition: all 0.3s ease;
  pointer-events: none; /* Prevent pseudo-element from blocking clicks */
}

.start-forging-btn:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 0 30px rgba(64, 192, 255, 0.6),
    0 0 60px rgba(64, 192, 255, 0.4),
    inset 0 0 20px rgba(255, 255, 255, 0.4) !important;
}

.start-forging-btn:hover::after {
  opacity: 0.8;
  filter: blur(20px);
}

.register-btn {
  background: linear-gradient(60deg, #9b59b6, #6c3483) !important;
  box-shadow: 
    0 0 20px rgba(155, 89, 182, 0.4),
    0 0 40px rgba(155, 89, 182, 0.2),
    inset 0 0 10px rgba(255, 255, 255, 0.3) !important;
  border: none !important;
  color: white !important;
  mix-blend-mode: screen;
  position: relative;
}

.register-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(60deg, #9b59b6, #6c3483);
  opacity: 0.5;
  filter: blur(15px);
  z-index: -1;
  transition: all 0.3s ease;
}

.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 0 30px rgba(155, 89, 182, 0.6),
    0 0 60px rgba(155, 89, 182, 0.4),
    inset 0 0 20px rgba(255, 255, 255, 0.4) !important;
}

.register-btn:hover::after {
  opacity: 0.8;
  filter: blur(20px);
}
</style>
