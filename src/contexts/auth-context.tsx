'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { apiClient } from '@/lib/api-client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isProvider: boolean;
  isClient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      apiClient.setToken(token);
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // This is a mock implementation
      // In a real app, you would call the API
      const mockUser: User = {
        id: '1',
        email,
        role: email.includes('admin') ? 'admin' : email.includes('provider') ? 'provider' : 'client',
        firstName: 'Demo',
        lastName: 'User',
      };
      
      const mockToken = 'mock-jwt-token';
      
      setUser(mockUser);
      apiClient.setToken(mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('auth_token', mockToken);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    apiClient.clearToken();
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
  };

  const isAdmin = user?.role === 'admin';
  const isProvider = user?.role === 'provider';
  const isClient = user?.role === 'client';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAdmin,
        isProvider,
        isClient,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
