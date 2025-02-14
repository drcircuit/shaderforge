<template>
  <v-app-bar app class="nav-bar" dark>
    <v-container class="d-flex align-center">
      <!-- Logo and Title -->
      <v-toolbar-title class="d-flex align-center">
        <v-img
          src="/assets/sf-logo.svg"
          class="nav-logo"
          contain
        ></v-img>
      </v-toolbar-title>

      <!-- Navigation Links with white text -->
      <v-btn text to="/" class="white--text">Home</v-btn>
      <v-btn text to="/newly-forged" class="white--text">Newly Forged</v-btn>
      <v-btn text to="/top-shaders" class="white--text">Top Shaders</v-btn>
      <v-btn text to="/tutorials" class="white--text">Tutorials</v-btn>
      <v-btn text to="/articles" class="white--text">Articles</v-btn>

      <v-spacer></v-spacer>

      <!-- Search Field -->
      <v-text-field
        v-model="searchQuery"
        hide-details
        dense
        solo-inverted
        placeholder="Search..."
        prepend-inner-icon="mdi-magnify"
        class="search-field white--text"
      ></v-text-field>

      <!-- Register/Login Link -->
      <v-btn text to="/login" class="white--text">Register / Login</v-btn>
    </v-container>
  </v-app-bar>
</template>

<script setup>
import { ref } from "vue";
const searchQuery = ref("");
</script>

<style scoped>
.nav-bar {
  background-color: #1f1f1f !important; /* Dark background */
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5); /* Soft shadow */
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Logo styling */
.nav-logo {
  max-width: 40px;
  margin-right: 10px;
}

/* Title styling */
.nav-title {
  font-family: 'Roboto', sans-serif;
  font-weight: 600;
  font-size: 1.2rem;
  color: #e0e0e0; /* Ensure title text is light */
}

/* Adjust search field width */
.search-field {
  max-width: 250px;
  margin-right: 16px;
}
</style>
