import React, { createContext, useContext, useState } from 'react';
import api from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (email: string, pass: string) => Promise<any>;
  logout: () => void;
  updateUser: (updatedUser: any) => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('churn_token'));
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('churn_token'));
  const [user, setUser] = useState<any>(() => {
    const storedUser = localStorage.getItem('churn_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = async (email: string, pass: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', pass);

    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 8000,
    });

    const data = response.data;
    localStorage.setItem('churn_token', data.access_token);
    localStorage.setItem('churn_user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    setIsAuthenticated(true);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('churn_token');
    localStorage.removeItem('churn_user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUser: any) => {
    localStorage.setItem('churn_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, updateUser, token }}>
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
