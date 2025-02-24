<template>
  <div class="profile-page">
    <div class="profile-container tile">
      <h2 class="tile-title">Profile Settings</h2>
      
      <v-form @submit.prevent="saveProfile" class="profile-form">
        <v-text-field
          v-model="profile.username"
          label="Username"
          :rules="[v => !!v || 'Username is required']"
          required
        ></v-text-field>

        <v-text-field
          v-model="profile.email"
          label="Email"
          type="email"
          :rules="[
            v => !!v || 'Email is required',
            v => /.+@.+\..+/.test(v) || 'Email must be valid'
          ]"
          required
        ></v-text-field>

        <v-textarea
          v-model="profile.bio"
          label="Bio"
          rows="4"
          counter
          maxlength="500"
        ></v-textarea>

        <div class="actions">
          <v-btn
            type="submit"
            color="primary"
            class="save-btn"
            :loading="saving"
          >
            Save Changes
          </v-btn>
        </div>
      </v-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { userService } from '@/services/userService';
import type { UserProfile } from '@/models/user';

const profile = ref<UserProfile>({
  username: '',
  email: '',
  bio: ''
});
const saving = ref(false);

const saveProfile = async () => {
  try {
    saving.value = true;
    await userService.updateProfile(profile.value);
    // Show success message
  } catch (error) {
    // Show error message
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.profile-page {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.profile-form {
  padding: 1rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 2rem;
}

.save-btn {
  min-width: 150px;
}
</style>