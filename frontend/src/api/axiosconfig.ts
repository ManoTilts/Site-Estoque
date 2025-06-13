import axios from 'axios';
import { refreshAccessToken } from './auth';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000', // Backend URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const success = await refreshAccessToken();
        if (success) {
          // Retry the original request with the new token
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;