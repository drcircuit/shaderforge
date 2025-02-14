<template>
  <v-app class="app-container">
    <NavBar />
    <v-main class="main-container">
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import NavBar from "@/components/NavBar.vue";
</script>

<style>
/* Global reset and dark mode backgrounds */
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
  background-color: #121212;
  color: #e0e0e0;
}

/* Override Vuetify wrappers to prevent extra scrollbars */
.v-application--wrap {
  overflow: hidden;
  height: 100%;
}

.app-container {
  height: 100%;
}

/* Adjust the main area height if the navbar is fixed (e.g. 64px tall) */
.main-container {
  height: calc(100% - 64px);
  overflow: hidden;
}
/* Global dark mode text color */
html, body, #app {
  background-color: #121212; /* Your dark background */
  color: #e0e0e0; /* Light text color for readability */
}

/* If using Vuetify's dark theme, ensure components inherit this color */
.v-application {
  background-color: #121212;
  color: #e0e0e0;
}
</style>
