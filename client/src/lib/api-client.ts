import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  AxiosError,
} from "axios";
import { toast } from "sonner";

// Define response structure
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Error response structure
interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response) {
          const { status, data } = error.response;

          switch (status) {
            case 401:
              // Token expired or invalid
              localStorage.removeItem("token");
              toast.error("Session expired. Please login again.");
              window.location.href = "/login";
              break;
            case 403:
              toast.error("You do not have permission to perform this action.");
              break;
            case 404:
              toast.error("Resource not found.");
              break;
            case 409:
              toast.error(data?.message || "Conflict occurred.");
              break;
            case 422:
              toast.error("Validation failed. Please check your input.");
              break;
            case 500:
              toast.error("Server error. Please try again later.");
              break;
            default:
              toast.error(data?.message || "An error occurred.");
          }
        } else if (error.request) {
          toast.error("Network error. Please check your connection.");
        }

        return Promise.reject(error);
      },
    );
  }

  // GET request
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.get(
        url,
        config,
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  // POST request
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.post(
        url,
        data,
        config,
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  // PUT request
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.put(
        url,
        data,
        config,
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  // PATCH request
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.patch(
        url,
        data,
        config,
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  // DELETE request
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.delete(
        url,
        config,
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  // Custom request
  async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> =
        await this.client.request(config);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  // Set auth token
  setAuthToken(token: string) {
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  // Remove auth token
  removeAuthToken() {
    delete this.client.defaults.headers.common["Authorization"];
  }
}

export const apiClient = new ApiClient();
