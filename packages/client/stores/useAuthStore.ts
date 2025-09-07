import api, { setAccessToken } from "@/lib/api";
import { create } from "zustand";

export type User = {
  id: string;
  email: string;
  role?: string;
};

type AuthState = {
  accessToken: string | null;
  user: User | null;
  setAuth: (token: string | null, user?: User | null) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
  refreshAccessToken: () => Promise<string | null>;
  setOnRefreshFailed: (cb: (() => void) | null) => void;
};

let _refreshPromise: Promise<string | null> | null = null;
let _onRefreshFailed: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setAuth: (token, user) => {
    setAccessToken(token);
    set({ accessToken: token, user: user ?? null });
  },
  clearAuth: () => {
    setAccessToken(null);
    set({ accessToken: null, user: null });
  },
  isAuthenticated: () => {
    const state = (useAuthStore.getState &&
      useAuthStore.getState()) as AuthState;
    return !!state.accessToken;
  },

  refreshAccessToken: async () => {
    if (_refreshPromise) return _refreshPromise;

    _refreshPromise = (async () => {
      try {
        const res = await api.post("/auth/refresh");
        const newToken: string | null = res.data?.accessToken ?? null;
        const user: User | null = res.data?.user ?? null;

        if (newToken) {
          setAccessToken(newToken);
          set({ accessToken: newToken, user });
          return newToken;
        } else {
          setAccessToken(null);
          set({ accessToken: null, user: null });
          return null;
        }
      } catch (err) {
        setAccessToken(null);
        set({ accessToken: null, user: null });
        return null;
      } finally {
        _refreshPromise = null;
      }
    })();

    return _refreshPromise;
  },

  setOnRefreshFailed: (cb) => {
    _onRefreshFailed = cb;
  },
}));

export const refreshAuthToken = () =>
  useAuthStore.getState().refreshAccessToken();

export const setOnRefreshFailed = (cb: (() => void) | null) =>
  useAuthStore.getState().setOnRefreshFailed(cb);
