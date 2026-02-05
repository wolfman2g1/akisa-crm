'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/types';
import { apiClient } from '@/lib/api-client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  isAdmin: boolean;
  isProvider: boolean;
  isClient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verify and refresh auth on mount
  const verifyAuth = useCallback(async () => {
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (storedUser && accessToken && refreshToken) {
      try {
        // Set the tokens for API calls
        apiClient.setTokens(accessToken, refreshToken);
        // Parse and set the user
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        // Token is invalid, clear storage
        console.error('Auth verification failed:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        apiClient.clearTokens();
      }
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  // Refresh auth function that can be called manually
  const refreshAuth = useCallback(async () => {
    await verifyAuth();
  }, [verifyAuth]);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      
      // Map API response to User interface (handle both snake_case and camelCase)
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        role: response.user.role,
        firstName: response.user.firstName || (response.user as any).first_name,
        lastName: response.user.lastName || (response.user as any).last_name,
      };
      
      setUser(userData);
      apiClient.setTokens(response.accessToken, response.refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    await apiClient.logout();
    setUser(null);
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
        refreshAuth,
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
