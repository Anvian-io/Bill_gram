/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import axios from "axios";
import { authAPI, type RegisterData, type User } from "../services/api";

type RegisterResponseData = {
  message: string;
  user: User;
};

const getAuthErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.response?.data?.error || fallback;
  }

  return fallback;
};

interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    userData: RegisterData
  ) => Promise<{ success: boolean; error?: string; data?: RegisterResponseData }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await authAPI.checkAuth();
      localStorage.setItem("user", JSON.stringify(response.data.data.user));
      setUser(response.data.data.user);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data.data;
      // console.log(response,"foewihf")
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      setUser(user);
      return { success: true };
    } catch (error: unknown) {
      return {
        success: false,
        error: getAuthErrorMessage(error, "Login failed"),
      };
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await authAPI.register(userData);
      return { success: true, data: response.data.data as RegisterResponseData };
    } catch (error: unknown) {
      return {
        success: false,
        error: getAuthErrorMessage(error, "Registration failed"),
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
