import apiClient from './axiosconfig';

// Interfaces for request/response types
interface LoginCredentials {
  username: string; // This will contain the email value
  password: string;
}

interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
}

interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

// Authentication functions
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  // Convert the credentials format if needed for your API
  const loginData = {
    email: credentials.username, // Send as email instead of username
    password: credentials.password
  };
  const response = await apiClient.post('/api/auth/login', loginData);
  
  // Store the tokens and user data in localStorage
  if (response.data.access_token) {
    localStorage.setItem('token', response.data.access_token);
    localStorage.setItem('refreshToken', response.data.refresh_token);
    // Update axios default headers
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
  }
  
  // Store user data in localStorage
  if (response.data.user) {
    localStorage.setItem('userId', response.data.user.id);
    localStorage.setItem('userEmail', response.data.user.email);
    localStorage.setItem('username', response.data.user.username);
  }
  
  return response.data;
};

export const register = async (credentials: RegisterCredentials): Promise<User> => {
  const response = await apiClient.post('/api/auth/signup', credentials);
  return response.data;
};

export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('username');
  delete apiClient.defaults.headers.common['Authorization'];
};

export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return false;
    }

    const response = await apiClient.post('/api/auth/refresh', {
      refresh_token: refreshToken
    });

    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('refreshToken', response.data.refresh_token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error refreshing token:', error);
    logout();
    return false;
  }
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

export const getCurrentUserId = (): string | null => {
  return localStorage.getItem('userId');
};

export const getCurrentUser = (): User | null => {
  const userId = localStorage.getItem('userId');
  const userEmail = localStorage.getItem('userEmail');
  const username = localStorage.getItem('username');
  
  if (userId && userEmail && username) {
    return {
      id: userId,
      email: userEmail,
      username: username,
      is_active: true, // Assume active if logged in
      created_at: '', // Not stored in localStorage
    };
  }
  
  return null;
};

export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  const userId = getCurrentUserId();
  return !!(token && userId);
};

// Initialize auth header if token exists
const token = getAuthToken();
if (token) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

