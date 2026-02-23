export interface UserRegistration {
  username: string;
  password: string;
  email?: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface UserProfile {
  username: string;
  email?: string;
  bio?: string;
}

export interface UserState {
  isAuthenticated: boolean;
  profile: UserProfile | null;
}