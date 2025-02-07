<template>
  <v-app-bar app color="primary" dark>
    <v-container class="d-flex align-center">
      <v-btn text to="/">Home</v-btn>
      <v-btn text to="/newly-forged">Newly Forged</v-btn>
      <v-btn text to="/top-shaders">Top Shaders</v-btn>
      <v-btn text to="/tutorials">Tutorials</v-btn>
      <v-btn text to="/articles">Articles</v-btn>
      <v-spacer></v-spacer>
      <v-text-field
        v-model="searchQuery"
        hide-details
        dense
        solo-inverted
        placeholder="Search..."
        prepend-inner-icon="mdi-magnify"
      ></v-text-field>
      <v-btn text to="/login">Register / Login</v-btn>
    </v-container>
  </v-app-bar>
</template>

<script setup>
import { ref } from "vue";

const searchQuery = ref("");
</script>

<style scoped>
.v-btn {
  text-transform: none;
}
</style>
