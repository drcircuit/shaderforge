<template>
  <div class="login-container">
    <div class="login-form tile">
      <h2 class="tile-title">Login</h2>
      <v-form @submit.prevent="handleSubmit">
        <v-text-field
          v-model="form.username"
          label="Username"
          required
        ></v-text-field>

        <v-text-field
          v-model="form.password"
          label="Password"
          type="password"
          required
        ></v-text-field>

        <div class="actions">
          <v-btn
            type="submit"
            color="primary"
            :loading="loading"
            class="login-submit-btn"
          >
            Login
          </v-btn>
        </div>
      </v-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { userService } from '@/services/userService';

const router = useRouter();
const loading = ref(false);
const form = ref({
  username: '',
  password: ''
});

const handleSubmit = async () => {
  try {
    loading.value = true;
    await userService.login(form.value);
    router.push('/');
  } catch (error) {
    console.error('Login failed:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 2rem;
}

.login-form {
  width: 100%;
  max-width: 480px;
  padding: 2rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 2rem;
}

.login-submit-btn {
  min-width: 120px;
}
</style>