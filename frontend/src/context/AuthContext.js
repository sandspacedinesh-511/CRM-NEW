import { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Don't check auth if we're on the login page
    const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/login/';
    if (isLoginPage) {
      setLoading(false);
      return;
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      checkAuth(token);
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuth = async (token) => {
    try {
      const response = await axiosInstance.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      
      // Check if password change is required
      if (user.passwordChangeRequired) {
        // You can handle this in the component that calls login
      }
      
      return user;
    } catch (error) {
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
    localStorage.removeItem('token');
    setUser(null);
  };

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