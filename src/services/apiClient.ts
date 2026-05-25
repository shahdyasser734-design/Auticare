import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';

const envApi = (import.meta.env.VITE_API_URL as string) || '/api';
export const API_BASE_URL = import.meta.env.DEV ? 'https://auticare-production-828c.up.railway.app/api' : envApi;

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds to be safe
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
const getApiErrorMessage = (error: AxiosError): string => {
  const responseData = error.response?.data as Record<string, unknown> | undefined;

  if (responseData) {
    if (typeof responseData.message === 'string') {
      return responseData.message;
    }
    if (typeof responseData.error === 'string') {
      return responseData.error;
    }
    if (typeof responseData.errors === 'string') {
      return responseData.errors;
    }
    if (typeof responseData.errors === 'object' && responseData.errors !== null) {
      // Handle ASP.NET Core validation errors where 'errors' is an object of arrays
      const errorsObj = responseData.errors as Record<string, string[]>;
      const firstKey = Object.keys(errorsObj)[0];
      if (firstKey && Array.isArray(errorsObj[firstKey]) && errorsObj[firstKey].length > 0) {
        return errorsObj[firstKey][0];
      }
    }
    if (typeof responseData.title === 'string') {
      return responseData.title;
    }
  }

  return error.response?.statusText || error.message || 'An unknown error occurred';
};

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('API Error Details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      responseData: error.response?.data,
      requestData: error.config?.data,
    });

    if (error.response) {
      const status = error.response.status;
      const apiMessage = getApiErrorMessage(error);
      if (apiMessage) {
        error.message = apiMessage;
      }

      if (status === 401) {
        // Token expired or invalid — clear auth but do NOT perform a forced redirect here.
        // Let calling code handle navigation so registering users aren't redirected to login.
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else if (status === 403) {
        console.error('Forbidden action:', apiMessage);
      } else if (status === 404) {
        console.error('Resource not found:', apiMessage);
      } else if (status >= 500) {
        console.error('Server Error:', apiMessage);
      }
    } else if (error.request) {
      console.error('Network Error - No response from server:', {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        message: error.message,
      });
      error.message = `Network Error: Please check your connection. (${error.config?.url || 'Unknown endpoint'})`;
    }
    return Promise.reject(error);
  }
);

export default apiClient;
