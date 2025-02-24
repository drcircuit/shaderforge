import axios from 'axios';
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
      await axios.post(`${API_BASE_URL}/users/login`, credentials);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/users/logout`);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  },

  async updateProfile(profile: UserProfile): Promise<void> {
    try {
      await axios.put(`${API_BASE_URL}/users/profile`, profile);
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }
};