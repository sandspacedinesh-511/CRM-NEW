import { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider mounted');
    // Don't check auth if we're on the login page
    const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/login/';
    if (isLoginPage) {
      console.log('On login page, skipping auth check');
      setLoading(false);
      return;
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Found token, checking auth');
      checkAuth(token);
    } else {
      console.log('No token found');
      setLoading(false);
    }
  }, []);

  const checkAuth = async (token) => {
    try {
      console.log('Checking auth with token');
      const response = await axiosInstance.get('/auth/me');
      console.log('Auth check response:', response.data);
      setUser(response.data);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Attempting login');
      const response = await axiosInstance.post('/auth/login', { email, password });
      console.log('Login response:', response.data);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      
      // Check if password change is required
      if (user.passwordChangeRequired) {
        console.log('Password change required');
        // You can handle this in the component that calls login
      }
      
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      // Preserve the original error response structure
      const errorResponse = error.response?.data;
      if (errorResponse) {
        const customError = new Error(errorResponse.message || 'Login failed');
        customError.response = { data: errorResponse };
        throw customError;
      } else {
        throw new Error('Login failed');
      }
    }
  };

  const logout = () => {
    console.log('Logging out');
    localStorage.removeItem('token');
    setUser(null);
  };

  console.log('AuthProvider current state:', { user, loading });

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 