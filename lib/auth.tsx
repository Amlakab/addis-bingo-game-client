'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthContextType } from '@/types';
import api from '@/app/utils/api';

// Update context interface type locally or ensure AuthContextType includes setSession
interface ExtendedAuthContextType extends AuthContextType {
  setSession: (userData: User, token: string) => void;
  clearSession: () => void; // Add this
}

const AuthContext = createContext<ExtendedAuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Clear session data
  const clearSession = () => {
    console.log('🧹 [Auth] Clearing session data...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Failed to parse user data:', error);
        clearSession();
      }
    }
    setIsLoading(false);
  }, []);

  // Set authenticated user and token state without re-authenticating
  const setSession = (userData: User, token: string) => {
    // ✅ Clear any old data first
    clearSession();
    
    // Then set new session
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      
      if (response.status === 200) {
        const responseData = response.data;
        const userData = responseData.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
      } else {
        clearSession();
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      clearSession();
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phone: string, password: string): Promise<User> => {
    try {
      const response = await api.post('/auth/login', {
        phone,
        password
      });

      const responseData = response.data;
      const { token, user: userData } = responseData.data;
      
      if (!token || !userData) {
        throw new Error('Invalid response from server');
      }
      
      // ✅ clearSession is called inside setSession
      setSession(userData, token);
      
      return userData;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid credentials');
      }
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const loginWithOtp = async (phone: string, otp: string): Promise<User> => {
    try {
      const response = await api.post('/auth/login-otp', {
        phone,
        otp
      });

      const responseData = response.data;
      const { token, user: userData } = responseData.data;
      
      if (!token || !userData) {
        throw new Error('Invalid response from server');
      }
      
      setSession(userData, token);
      
      return userData;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid OTP'); 
      }
      throw new Error(error.response?.data?.message || 'OTP login failed');
    }
  };

  const register = async (
    phone: string, 
    password: string, 
    tg_id: string, 
    agent_id?: string
  ): Promise<User> => {
    try {
      const payload: any = {
        phone,
        password,
        tg_id
      };

      if (agent_id && agent_id.trim() !== '') {
        payload.agent_id = agent_id;
      }

      const response = await api.post('/auth/register', payload);

      const responseData = response.data;
      const { token, user: userData } = responseData.data;
      
      if (!token || !userData) {
        throw new Error('Invalid response from server');
      }
      
      setSession(userData, token);
      
      return userData;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    clearSession();
  };

  const value = {
    user,
    login,
    loginWithOtp,
    register,
    logout,
    isLoading,
    fetchUserProfile,
    setSession,
    clearSession // Add this
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};