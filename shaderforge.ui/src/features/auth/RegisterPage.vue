<template>
  <div class="register-container">
    <div class="register-form tile">
      <h2 class="tile-title">Register</h2>
      <v-form @submit.prevent="handleSubmit">
        <v-text-field
          v-model="form.username"
          label="Username"
          :rules="[v => !!v || 'Username is required']"
          required
        ></v-text-field>

        <v-text-field
          v-model="form.email"
          label="Email (optional)"
          type="email"
          :rules="[v => !v || /.+@.+\..+/.test(v) || 'Email must be valid']"
          hint="Used only for password recovery — never shared"
          persistent-hint
        ></v-text-field>

        <v-text-field
          v-model="form.password"
          label="Password"
          type="password"
          :rules="[v => !!v || 'Password is required']"
          required
        ></v-text-field>

        <div class="actions">
          <v-btn
            type="submit"
            color="primary"
            :loading="loading"
            class="register-submit-btn"
          >
            Register
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
  email: '',
  password: ''
});

const handleSubmit = async () => {
  try {
    loading.value = true;
    await userService.register(form.value);
    router.push('/login');
  } catch (error) {
    console.error('Registration failed:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 2rem;
}

.register-form {
  width: 100%;
  max-width: 480px;
  padding: 2rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 2rem;
}

.register-submit-btn {
  min-width: 120px;
}
</style>