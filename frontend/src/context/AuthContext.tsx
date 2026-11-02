import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { User, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (data: any) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('akran_token'));
  const [role, setRole] = useState<string | null>(localStorage.getItem('akran_role'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await apiClient.get<User>('/auth/me');
      setUser(res.data);
      setRole(res.data.role);
      localStorage.setItem('akran_role', res.data.role);
    } catch (err) {
      setUser(null);
      setToken(null);
      setRole(null);
      localStorage.removeItem('akran_token');
      localStorage.removeItem('akran_role');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    const data = res.data;
    localStorage.setItem('akran_token', data.access_token);
    localStorage.setItem('akran_role', data.role);
    setToken(data.access_token);
    setRole(data.role);
    await fetchCurrentUser();
    return data;
  };

  const register = async (formData: any): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', formData);
    const data = res.data;
    localStorage.setItem('akran_token', data.access_token);
    localStorage.setItem('akran_role', data.role);
    setToken(data.access_token);
    setRole(data.role);
    await fetchCurrentUser();
    return data;
  };

  const logout = () => {
    localStorage.removeItem('akran_token');
    localStorage.removeItem('akran_role');
    setToken(null);
    setRole(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      await fetchCurrentUser();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
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
