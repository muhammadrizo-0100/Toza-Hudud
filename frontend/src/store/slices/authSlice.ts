import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AdminUser } from '../../types';

interface AuthState {
  token: string | null;
  user: AdminUser | null;
  isAuthenticated: boolean;
}

const storedToken = typeof window !== 'undefined' ? localStorage.getItem('toza_hudud_token') : null;
const storedUser = typeof window !== 'undefined' ? localStorage.getItem('toza_hudud_user') : null;

let parsedUser: AdminUser | null = null;
if (storedUser) {
  try {
    parsedUser = JSON.parse(storedUser);
  } catch {
    parsedUser = null;
  }
}

const initialState: AuthState = {
  token: storedToken,
  user: parsedUser,
  isAuthenticated: Boolean(storedToken)
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: AdminUser }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;

      localStorage.setItem('toza_hudud_token', action.payload.token);
      localStorage.setItem('toza_hudud_user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;

      localStorage.removeItem('toza_hudud_token');
      localStorage.removeItem('toza_hudud_user');
    }
  }
});

export const { setCredentials, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
