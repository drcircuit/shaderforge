import axios from 'axios';
import { useAuth } from '@/composables/useAuth';
import { UserRegistration, UserLogin, UserProfile } from '@/models/user';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;

export const userService = {
  async register(userData: UserRegistration): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/users/register`, userData);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  async login(credentials: UserLogin): Promise<void> {
    try {
      const response = await axios.post<{ Token: string }>(`${API_BASE_URL}/users/login`, credentials);
      const { setAuth } = useAuth();
      setAuth(response.data.Token, credentials.username);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    const { token, clearAuth } = useAuth();
    try {
      if (token.value) {
        await axios.post(
          `${API_BASE_URL}/users/logout`,
          null,
          { headers: { Authorization: `Bearer ${token.value}` } }
        );
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      clearAuth();
    }
  },

  async updateProfile(profile: UserProfile): Promise<void> {
    const { token } = useAuth();
    try {
      await axios.put(`${API_BASE_URL}/users/profile`, profile, {
        headers: { Authorization: `Bearer ${token.value}` },
      });
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  },
};