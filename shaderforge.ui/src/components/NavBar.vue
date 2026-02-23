<template>
  <v-app-bar app dark class="nav-bar" :elevation="0">
    <!-- Logo -->
    <v-app-bar-title class="logo-container">
      <router-link to="/" class="logo-link">
        <v-img
          src="/assets/sf-logo.svg"
          class="nav-logo"
          width="48"
          height="48"
          contain
        ></v-img>
        <span class="logo-text d-none d-sm-inline">ShaderForge</span>
      </router-link>
    </v-app-bar-title>

    <!-- Navigation Links (desktop only) -->
    <div class="nav-links d-none d-lg-flex">
      <v-btn variant="text" to="/" class="sgi-link">Home</v-btn>
      <v-btn variant="text" to="/forge/new" class="sgi-link">Forge</v-btn>
      <v-btn variant="text" to="/demo" class="sgi-link">Demo</v-btn>
      <v-btn variant="text" to="/scene" class="sgi-link">Scene</v-btn>
      <v-btn variant="text" to="/newly-forged" class="sgi-link d-none d-xl-flex">Newly Forged</v-btn>
      <v-btn variant="text" to="/top-shaders" class="sgi-link d-none d-xl-flex">Top Shaders</v-btn>
    </div>

    <v-spacer></v-spacer>

    <!-- Search (hidden on xs) -->
    <v-text-field
      v-model="searchQuery"
      hide-details
      placeholder="Search..."
      prepend-inner-icon="mdi-magnify"
      class="search-field d-none d-sm-flex"
      variant="plain"
      density="compact"
    ></v-text-field>

    <!-- Auth Buttons (desktop) -->
    <div class="auth-buttons d-none d-md-flex">
      <v-btn variant="text" to="/login" class="sgi-link">Login</v-btn>
      <v-btn variant="text" to="/register" class="sgi-link">Register</v-btn>
    </div>

    <!-- Hamburger menu (mobile/tablet) -->
    <v-btn icon @click="drawer = !drawer" class="d-lg-none" aria-label="Open menu">
      <v-icon>mdi-menu</v-icon>
    </v-btn>
  </v-app-bar>

  <!-- Mobile Navigation Drawer (Vuetify 3) -->
  <v-navigation-drawer v-model="drawer" location="end" temporary class="mobile-drawer">
    <v-list nav>
      <v-list-item prepend-icon="mdi-home" title="Home" to="/" @click="drawer = false" class="drawer-item" />
      <v-list-item prepend-icon="mdi-code-braces" title="Forge" to="/forge/new" @click="drawer = false" class="drawer-item" />
      <v-list-item prepend-icon="mdi-play-circle" title="Demo" to="/demo" @click="drawer = false" class="drawer-item" />
      <v-list-item prepend-icon="mdi-layers" title="Scene" to="/scene" @click="drawer = false" class="drawer-item" />
      <v-list-item prepend-icon="mdi-new-box" title="Newly Forged" to="/newly-forged" @click="drawer = false" class="drawer-item" />
      <v-list-item prepend-icon="mdi-trophy" title="Top Shaders" to="/top-shaders" @click="drawer = false" class="drawer-item" />
      <v-list-item prepend-icon="mdi-book-open" title="Tutorials" to="/tutorials" @click="drawer = false" class="drawer-item" />
      <v-list-item prepend-icon="mdi-newspaper" title="Articles" to="/articles" @click="drawer = false" class="drawer-item" />
      <v-divider class="my-2" />
      <!-- Search on mobile -->
      <div class="px-4 py-2">
        <v-text-field
          v-model="searchQuery"
          hide-details
          placeholder="Search..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          class="mobile-search"
        ></v-text-field>
      </div>
      <v-divider class="my-2" />
      <v-list-item prepend-icon="mdi-login" title="Login" to="/login" @click="drawer = false" class="drawer-item" />
      <v-list-item prepend-icon="mdi-account-plus" title="Register" to="/register" @click="drawer = false" class="drawer-item" />
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { ref } from "vue";
const searchQuery = ref("");
const drawer = ref(false);
</script>

<style scoped>
.nav-bar {
  background: linear-gradient(180deg, #1f1f1f, #2b2b2b) !important;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.7) !important;
  border-bottom: 1px solid rgba(64, 192, 255, 0.15) !important;
}

.logo-container {
  flex-shrink: 0;
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.nav-logo {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.logo-text {
  font-family: 'Audiowide', sans-serif;
  color: #40c0ff;
  font-size: 1.1rem;
  white-space: nowrap;
}

.sgi-link {
  color: #40c0ff !important;
  transition: color 0.2s ease;
  border-radius: 20px !important;
  font-size: 0.85rem;
}
.sgi-link:hover {
  color: #9b59b6 !important;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.search-field {
  max-width: 280px;
  min-width: 100px;
  flex: 1 1 auto;
  margin: 0 12px;
}

.search-field :deep(.v-field__input) {
  min-height: 36px !important;
  padding: 0 8px !important;
}

.search-field :deep(.v-field__outline) {
  border-radius: 20px;
  border: 1px solid rgba(64, 192, 255, 0.2) !important;
  background: rgba(20, 20, 25, 0.7);
}

.auth-buttons {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
  margin-left: 0.5rem;
}

/* Mobile drawer */
.mobile-drawer {
  background: #1a1a1f !important;
  border-left: 1px solid rgba(64, 192, 255, 0.15) !important;
}

.drawer-item {
  color: #40c0ff !important;
}

.drawer-item:hover {
  background: rgba(64, 192, 255, 0.08) !important;
  color: #9b59b6 !important;
}

.mobile-search :deep(.v-field__outline) {
  border-color: rgba(64, 192, 255, 0.2) !important;
}
</style>
