import axios from "axios";

const API_BASE_URL = "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: number;
  username: string;
  email: string;
  shop_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  subscriptionExpiresAt?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  shop_name?: string;
  phone?: string;
}

export const authAPI = {
  register: (userData: RegisterData) => api.post("/auth/register", userData),
  login: (credentials: LoginCredentials) =>
    api.post("/auth/login", credentials),
  checkAuth: () => api.get("/auth/check"),
};

export default api;
