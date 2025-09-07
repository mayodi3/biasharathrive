import api from "@/lib/api";
import { useAuthStore, type User } from "../stores/useAuthStore";
import { UserForm } from "@/app/(auth)/register/page";

export const login = async (email: string, password: string) => {
  const res = await api.post("/auth/login", { email, password });
  const accessToken = res.data.accessToken as string | undefined;
  const user = res.data.user as User | undefined;

  useAuthStore.getState().setAuth(accessToken ?? null, user ?? null);
  return { user, accessToken };
};

export const register = async (user: UserForm) => {
  const formData = new FormData();

  Object.entries(user).forEach(([key, value]) => {
    if (value !== null) {
      formData.append(key, value as any);
    }
  });

  const res = await api.post("/auth/register", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const { success, message, userId } = res.data;

  return { success, message, userId };
};

export const logout = async () => {
  try {
    await api.post("/auth/logout");
  } catch (err) {
    console.warn("logout request failed", err);
  } finally {
    useAuthStore.getState().clearAuth();
  }
};

export const logoutAll = async () => {
  await api.post("/auth/logout-all");
  useAuthStore.getState().clearAuth();
};
