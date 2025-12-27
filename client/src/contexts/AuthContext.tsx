import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types';
import { authAPI } from '../utils/api';
import { getFromStorage, setToStorage, removeFromStorage } from '../utils/helpers';
import socketService from '../utils/socket';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = getFromStorage('user');

      console.log('🔍 Initializing auth...', {
        hasStoredToken: !!storedToken,
        hasStoredUser: !!storedUser
      });

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        
        try {
          // Verify token is still valid
          const response = await authAPI.verifyToken();
          if (response.valid) {
            console.log('✅ Token verified successfully');
            // Connect to socket
            socketService.connect(storedToken);
          } else {
            console.log('❌ Token verification failed');
            // Token is invalid, clear storage
            logout();
          }
        } catch (error) {
          console.error('❌ Token verification failed:', error);
          logout();
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('🔍 Starting login process...');
      const response = await authAPI.login({ email, password });
      
      console.log('✅ Login API response received:', {
        hasToken: !!response.token,
        hasUser: !!response.user,
        userEmail: response.user?.email
      });
      
      if (response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        
        // Store token directly without JSON.stringify
        localStorage.setItem('token', response.token);
        setToStorage('user', response.user);
        
        console.log('✅ Token and user stored in localStorage');
        console.log('🔑 Token preview:', response.token.substring(0, 50) + '...');
        
        // Connect to socket
        socketService.connect(response.token);
        
        toast.success('Login successful!');
      } else {
        console.error('❌ Login response missing token or user');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error.response?.data || error.message);
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      const response = await authAPI.register(userData);
      
      if (response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        
        // Store in localStorage
        setToStorage('token', response.token);
        setToStorage('user', response.user);
        
        // Connect to socket
        socketService.connect(response.token);
        
        toast.success('Registration successful!');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    
    // Clear localStorage
    localStorage.removeItem('token');
    removeFromStorage('user');
    
    // Disconnect socket
    socketService.disconnect();
    
    console.log('🔓 User logged out');
    toast.success('Logged out successfully');
  };

  const updateProfile = async (data: any) => {
    try {
      const response = await authAPI.updateProfile(data);
      
      if (response.user) {
        setUser(response.user);
        setToStorage('user', response.user);
        toast.success('Profile updated successfully!');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};