import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
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

    const response = await axios.post('http://localhost:8000/api/v1/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 5000 // 5 seconds timeout to prevent hanging
    });

    const data = response.data;
    localStorage.setItem('churn_token', data.access_token);
    localStorage.setItem('churn_user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('churn_token');
    localStorage.removeItem('churn_user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, token }}>
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
