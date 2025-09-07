import axios, { AxiosError, AxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:4000/api",
  withCredentials: true,
});

let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const res = await api.post("/auth/refresh");
    const newToken = res.data.accessToken;
    setAccessToken(newToken);
    return newToken;
  } catch (err) {
    setAccessToken(null);
    return null;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
};

api.interceptors.request.use(
  (config) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error.response.data);
  }
);

api.interceptors.response.use(
  undefined,
  async (error: AxiosError & { config?: any }) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const url = originalRequest.url ?? "";

      if (url.includes("/auth/login")) {
        setAccessToken(null);
        return Promise.reject(error.response.data);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken();
      }

      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return api(originalRequest);
      } else {
        window.location.href = "/login";
        return Promise.reject(error.response.data);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
