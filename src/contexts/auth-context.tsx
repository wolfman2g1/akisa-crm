'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/types';
import { apiClient } from '@/lib/api-client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
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

  const normalizeRole = (role: string | null | undefined): UserRole | null => {
    if (!role) return null;
    const normalized = role.toLowerCase();
    if (normalized === 'admin' || normalized === 'provider' || normalized === 'client') {
      return normalized as UserRole;
    }
    return null;
  };

  const parseJwtPayload = (token: string): Record<string, unknown> | null => {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  };

  // Verify and refresh auth on mount
  const verifyAuth = useCallback(async () => {
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (storedUser && accessToken) {
      try {
        // Set the tokens for API calls
        if (refreshToken) {
          apiClient.setTokens(accessToken, refreshToken);
        } else {
          apiClient.setToken(accessToken);
        }
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
    } else if (storedUser || accessToken || refreshToken) {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      apiClient.clearTokens();
      setUser(null);
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

  const login = async (username: string, password: string) => {
    try {
      const response = await apiClient.login(username, password);
      
      const accessToken =
        response.user?.access_token ||
        response.accessToken ||
        (response as any).token ||
        (response as any).access_token ||
        (response as any).data?.accessToken ||
        (response as any).data?.token;
      const refreshToken =
        response.user?.refresh_token ||
        response.refreshToken ||
        (response as any).refresh_token ||
        (response as any).data?.refreshToken ||
        (response as any).data?.refresh_token;

      if (!accessToken) {
        throw new Error('Login response missing access token');
      }

      if (refreshToken) {
        apiClient.setTokens(accessToken, refreshToken);
      } else {
        apiClient.setToken(accessToken);
      }

      const payload = parseJwtPayload(accessToken);
      const roleFromToken = normalizeRole(payload?.role as string | undefined);
      const userData: User = {
        id: (payload?.sub as string | undefined) || response.user?.id || '',
        email: response.user?.email || '',
        role: roleFromToken || (normalizeRole(response.user?.role) ?? 'client'),
        firstName:
          response.user?.firstName ||
          (response.user as any)?.first_name ||
          (payload?.username as string | undefined),
        lastName: response.user?.lastName || (response.user as any)?.last_name,
      };

      setUser(userData);
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
