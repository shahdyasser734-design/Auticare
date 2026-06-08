import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';

// Use the Vite proxy during development and a relative API path in production.
export const API_BASE_URL = '/api';

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
  const responseData = error.response?.data;

  if (typeof responseData === 'string') {
    return responseData;
  }

  if (responseData && typeof responseData === 'object') {
    const dataObj = responseData as Record<string, unknown>;
    if (typeof dataObj.message === 'string') {
      return dataObj.message;
    }
    if (typeof dataObj.error === 'string') {
      return dataObj.error;
    }
    if (typeof dataObj.errors === 'string') {
      return dataObj.errors;
    }
    if (typeof dataObj.errors === 'object' && dataObj.errors !== null) {
      // Handle ASP.NET Core validation errors where 'errors' is an object of arrays
      const errorsObj = dataObj.errors as Record<string, string[]>;
      const firstKey = Object.keys(errorsObj)[0];
      if (firstKey && Array.isArray(errorsObj[firstKey]) && errorsObj[firstKey].length > 0) {
        return errorsObj[firstKey][0];
      }
    }
    if (typeof dataObj.title === 'string') {
      return dataObj.title;
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
