/**
 * useAuth — reactive JWT authentication state.
 *
 * The token is persisted to localStorage so it survives page refreshes.
 * Call `setAuth` after a successful login and `clearAuth` on logout.
 */
import { computed, reactive } from 'vue';

const AUTH_TOKEN_KEY = 'sf_auth_token';
const AUTH_USER_KEY = 'sf_auth_user';

// Module-level reactive state so the same instance is shared across all callers.
const state = reactive({
  token: localStorage.getItem(AUTH_TOKEN_KEY) ?? null as string | null,
  username: localStorage.getItem(AUTH_USER_KEY) ?? null as string | null,
});

export function useAuth() {
  const isAuthenticated = computed(() => !!state.token);
  const token = computed(() => state.token);
  const username = computed(() => state.username);

  function setAuth(newToken: string, newUsername: string): void {
    state.token = newToken;
    state.username = newUsername;
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    localStorage.setItem(AUTH_USER_KEY, newUsername);
  }

  function clearAuth(): void {
    state.token = null;
    state.username = null;
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }

  return { isAuthenticated, token, username, setAuth, clearAuth };
}
