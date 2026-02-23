<template>
  <div class="front-page">
    <!-- Welcome + Articles row -->
    <div class="top-row">
      <div class="welcome-section tile">
        <h2 class="tile-title">Welcome to ShaderForge</h2>
        <p class="welcome-message">
          Create, share, and explore GPU shaders built on WebGPU + WGSL.
          Beat-synced animations, real-time previews, and a growing community.
        </p>
        <div class="cta-buttons">
          <v-btn class="cta-btn forge-btn" @click="startForging" elevation="0">
            <v-icon start>mdi-code-braces</v-icon>
            Start Forging
          </v-btn>
          <v-btn class="cta-btn sign-btn" @click="signUp" elevation="0">
            <v-icon start>mdi-account-plus</v-icon>
            Register
          </v-btn>
        </div>
      </div>
      <div class="articles-section tile">
        <h3 class="tile-title">Latest Articles</h3>
        <v-list density="compact" bg-color="transparent" class="article-list">
          <v-list-item
            v-for="article in articles"
            :key="article.id"
            :href="article.url"
            target="_blank"
            class="article-item"
          >
            <template #prepend>
              <v-icon size="small" color="primary">
                {{ article.isExternal ? 'mdi-open-in-new' : 'mdi-file-document' }}
              </v-icon>
            </template>
            <v-list-item-title>{{ article.title }}</v-list-item-title>
            <template #append>
              <v-chip v-if="article.isExternal" color="warning" size="x-small">EXT</v-chip>
            </template>
          </v-list-item>
        </v-list>
      </div>
    </div>

    <!-- Shader carousel -->
    <div class="carousel-section tile">
      <h2 class="tile-title">Newly Forged &amp; Popular Shaders</h2>
      <v-carousel
        cycle
        hide-delimiter-background
        show-arrows="hover"
        height="100%"
        class="shader-carousel"
      >
        <v-carousel-item v-for="shader in newestShaders" :key="shader.id">
          <div class="carousel-item-inner">
            <v-img :src="shader.thumbnailUrl" cover height="100%" />
          </div>
        </v-carousel-item>
      </v-carousel>
    </div>

    <!-- Featured + Quick launch row -->
    <div class="bottom-row">
      <div class="featured-section tile">
        <h2 class="tile-title">Featured Shader</h2>
        <div class="featured-img-wrap">
          <v-img
            :src="featuredShader?.thumbnailUrl ?? '/assets/shader1.jpg'"
            cover
            class="featured-img"
          />
        </div>
      </div>
      <div class="quick-launch tile">
        <h3 class="tile-title">Quick Launch</h3>
        <div class="launch-grid">
          <v-btn class="launch-btn" to="/forge/new" variant="outlined" color="primary" prepend-icon="mdi-code-braces">
            Forge a Shader
          </v-btn>
          <v-btn class="launch-btn" to="/demo" variant="outlined" color="secondary" prepend-icon="mdi-play-circle">
            Demo / Tracker
          </v-btn>
          <v-btn class="launch-btn" to="/scene" variant="outlined" color="primary" prepend-icon="mdi-layers">
            Scene Editor
          </v-btn>
          <v-btn class="launch-btn" to="/register" variant="outlined" color="secondary" prepend-icon="mdi-account-plus">
            Create Account
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getNewestShaders, getFeaturedShader } from '@/services/apiService';
import type { Shader } from '@/models/shaders';

const router = useRouter();

const featuredShader = ref<Shader | null>(null);
const newestShaders = ref<Shader[]>([]);

onMounted(async () => {
  try {
    const [featured, newest] = await Promise.all([
      getFeaturedShader().catch(() => null),
      getNewestShaders().catch(() => [] as Shader[]),
    ]);
    if (featured) featuredShader.value = featured;
    if (newest.length) newestShaders.value = newest;
  } catch {
    // API not available — fall back to empty state
  }
});

const articles = ref([
  { id: 1, title: 'Getting started with WGSL', url: 'https://example.com/article1', isExternal: true },
  { id: 2, title: 'Beat-synced shaders tutorial', url: 'https://example.com/article2', isExternal: false },
  { id: 3, title: 'LayerStack: multi-pass effects', url: 'https://example.com/article3', isExternal: false },
]);

const signUp = () => router.push('/register');
const startForging = () => router.push('/forge/new');
</script>

<style scoped>
/* ---- Page layout -------------------------------------------------------- */
.front-page {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 1rem;
  padding: 1rem;
  min-height: 100%;
  box-sizing: border-box;
}

/* Top row: welcome (left) + articles (right) */
.top-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
}

/* Carousel fills available middle space */
.carousel-section {
  overflow: hidden;
  min-height: 260px;
}

.shader-carousel {
  height: calc(100% - 3rem) !important;
}

.carousel-item-inner {
  height: 100%;
}

/* Bottom row: featured (left) + quick-launch (right) */
.bottom-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
  min-height: 200px;
}

/* ---- Tile base style ---------------------------------------------------- */
.tile {
  background: rgba(16, 18, 24, 0.92);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(64, 192, 255, 0.15);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(64, 192, 255, 0.04);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.tile:hover {
  border-color: rgba(64, 192, 255, 0.28);
  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(64, 192, 255, 0.10);
}

.tile-title {
  font-size: 0.9rem;
  letter-spacing: 0.05em;
  color: #40c0ff;
  margin: -1rem -1rem 0.9rem -1rem;
  padding: 0.65rem 1rem;
  border-bottom: 1px solid rgba(64, 192, 255, 0.2);
  background: rgba(12, 14, 18, 0.98);
  border-radius: 12px 12px 0 0;
}

/* ---- Welcome panel ----------------------------------------------------- */
.welcome-message {
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.6;
  margin-bottom: 1.2rem;
}

.cta-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.cta-btn {
  flex: 1 1 140px;
  min-height: 44px;
  font-size: 0.9rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-radius: 22px !important;
  border: none !important;
}

.forge-btn {
  background: linear-gradient(60deg, #40c0ff, #0088cc) !important;
  color: #fff !important;
  box-shadow: 0 0 16px rgba(64, 192, 255, 0.35) !important;
}
.forge-btn:hover { box-shadow: 0 0 28px rgba(64, 192, 255, 0.55) !important; }

.sign-btn {
  background: linear-gradient(60deg, #9b59b6, #6c3483) !important;
  color: #fff !important;
  box-shadow: 0 0 16px rgba(155, 89, 182, 0.35) !important;
}
.sign-btn:hover { box-shadow: 0 0 28px rgba(155, 89, 182, 0.55) !important; }

/* ---- Articles panel ---------------------------------------------------- */
.article-list {
  padding: 0 !important;
}

.article-item {
  border-radius: 6px;
  margin-bottom: 2px;
  color: rgba(255, 255, 255, 0.85) !important;
  transition: background 0.2s;
}

.article-item:hover {
  background: rgba(64, 192, 255, 0.08) !important;
  color: #40c0ff !important;
}

/* ---- Featured panel ---------------------------------------------------- */
.featured-img-wrap {
  height: calc(100% - 2.8rem);
  min-height: 120px;
  border-radius: 8px;
  overflow: hidden;
}

.featured-img {
  height: 100%;
  border-radius: 8px;
}

/* ---- Quick-launch panel ------------------------------------------------ */
.launch-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.launch-btn {
  width: 100%;
  font-size: 0.8rem;
}

/* ---- Responsive breakpoints -------------------------------------------- */

/* ≥ 1280px: default (two-column rows) */

/* 960–1279px: collapse bottom row */
@media (max-width: 1279px) {
  .launch-grid {
    grid-template-columns: 1fr;
  }
}

/* 768–959px: stack top/bottom rows to single column */
@media (max-width: 959px) {
  .top-row,
  .bottom-row {
    grid-template-columns: 1fr;
  }
}

/* < 600px: minimal padding, smaller titles */
@media (max-width: 599px) {
  .front-page {
    padding: 0.6rem;
    gap: 0.6rem;
  }

  .tile-title {
    font-size: 0.8rem;
  }

  .carousel-section {
    min-height: 180px;
  }

  .launch-btn {
    font-size: 0.75rem;
    min-height: 40px;
  }
}
</style>
