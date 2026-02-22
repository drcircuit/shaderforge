<template>
  <!-- A gradient for better contrast -->
  <v-app-bar app dark class="nav-bar">
    <v-container class="d-flex align-center justify-space-between">
      <!-- Logo -->
      <v-toolbar-title class="d-flex align-center logo-container">
        <!-- Make sure your logo is at src/assets/sf-logo.svg -->
        <v-img
          src="/assets/sf-logo.svg"
          class="nav-logo"
          width="180"
          height="180"
          contain
        ></v-img>
      </v-toolbar-title>

      <!-- Navigation Links for Desktop -->
      <div class="nav-links d-none d-md-flex">
        <v-btn text to="/" class="sgi-link">Home</v-btn>
        <v-btn text to="/forge/new" class="sgi-link" prepend-icon="mdi-code-braces">Forge</v-btn>
        <v-btn text to="/demo" class="sgi-link" prepend-icon="mdi-play-circle">Demo</v-btn>
        <v-btn text to="/newly-forged" class="sgi-link">Newly Forged</v-btn>
        <v-btn text to="/top-shaders" class="sgi-link">Top Shaders</v-btn>
        <v-btn text to="/tutorials" class="sgi-link">Tutorials</v-btn>
        <v-btn text to="/articles" class="sgi-link">Articles</v-btn>
      </div>

      <v-spacer class="d-none d-md-flex"></v-spacer>

      <!-- Search Field -->
      <v-text-field
        v-model="searchQuery"
        hide-details
        dense
        solo-inverted
        rounded
        placeholder="Search..."
        prepend-inner-icon="mdi-magnify"
        class="search-field sgi-link"
        variant="plain"
      ></v-text-field>

      <!-- Auth Buttons for Desktop -->
      <div class="auth-buttons d-none d-md-flex">
        <v-btn 
          text 
          to="/login" 
          class="sgi-link login-btn"
          prepend-icon="mdi-login"
        >
          Login
        </v-btn>
        <v-btn 
          text 
          to="/register" 
          class="sgi-link register-btn"
          prepend-icon="mdi-account-plus"
        >
          Register
        </v-btn>
      </div>

      <!-- Menu Button for Mobile -->
      <v-btn icon @click="drawer = !drawer" class="d-md-none">
        <v-icon>mdi-menu</v-icon>
      </v-btn>
    </v-container>

    <!-- Navigation Drawer for Mobile -->
    <v-navigation-drawer
      v-model="drawer"
      app
      temporary
      right
    >
      <v-list>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>
              <v-btn text to="/" class="sgi-link">Home</v-btn>
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>
              <v-btn text to="/newly-forged" class="sgi-link">Newly Forged</v-btn>
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>
              <v-btn text to="/top-shaders" class="sgi-link">Top Shaders</v-btn>
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>
              <v-btn text to="/tutorials" class="sgi-link">Tutorials</v-btn>
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>
              <v-btn text to="/articles" class="sgi-link">Articles</v-btn>
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>
              <v-btn text to="/login" class="sgi-link login-btn" prepend-icon="mdi-login">Login</v-btn>
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>
              <v-btn text to="/register" class="sgi-link register-btn" prepend-icon="mdi-account-plus">Register</v-btn>
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
  </v-app-bar>
</template>

<script setup>
import { ref } from "vue";
const searchQuery = ref("");
const drawer = ref(false);
</script>

<style scoped>
.nav-bar {
  background: linear-gradient(0.0deg, #2b2b2b, #1f1f1f) !important;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.7);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Logo styling */
.logo-container {
  min-width: 25%;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 12px;
  position: relative;
  overflow: visible;
}

.nav-logo {
  width: 180px;
  height: 180px;
  flex-shrink: 0;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 12px;
}

.logo-text {
  font-family: 'Audiowide', sans-serif;
  color: #40c0ff;
  font-size: 1.2rem;
  white-space: nowrap;
}

/* SGI-inspired link colors: cyan => purple on hover */
.sgi-link {
  color: #40c0ff !important; /* bright cyan */
  transition: color 0.2s ease;
  border-radius: 20px !important;
}
.sgi-link:hover {
  color: #9b59b6 !important; /* purple on hover */
}

/* Adjust search field width */
.search-field {
    max-width: 1200px; /* Increased width */
  min-width: 1000px; /* Increased width */
  margin-right: 16px;
  display: flex;
  align-items: center;
}

.search-field :deep(.v-input__control) {
  min-height: 36px;
  border-radius: 20px;
}

.search-field :deep(.v-field__input) {
  min-height: 36px !important;
  padding: 0 16px !important;
  display: flex;
  align-items: center;
}

.search-field :deep(.v-field__input input) {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

.search-field :deep(.v-field__outline) {
  border-radius: 20px;
  border: 1px solid rgba(64, 192, 255, 0.2) !important;
  background: rgba(20, 20, 25, 0.7);
}

.search-field :deep(.v-field__prepend-inner) {
  padding-top: 0 !important;
  margin-top: 0 !important;
}

/* Remove underline */
.search-field :deep(.v-field__outline__start),
.search-field :deep(.v-field__outline__end),
.search-field :deep(.v-field__outline__notch) {
  border: none !important;
}

.search-field :deep(.v-field__outline:hover) {
  border-color: rgba(64, 192, 255, 0.4);
}

.auth-buttons {
  display: flex;
  gap: 0.5rem;
  margin-left: 1rem;
}

.auth-buttons .v-btn {
  font-size: 0.9rem;
  letter-spacing: 0.05em;
}

.login-btn:hover {
  color: #40c0ff !important;
  background: rgba(64, 192, 255, 0.1);
}

.register-btn:hover {
  color: #9b59b6 !important;
  background: rgba(155, 89, 182, 0.1);
}

.nav-links {
  display: flex;
  gap: 1rem;
}
</style>
