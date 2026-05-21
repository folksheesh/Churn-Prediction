import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (email: string, pass: string) => void;
  logout: () => void;
  register: (email: string, pass: string, name: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  
  // This is a simple mock using localStorage for now.
  // In the future, this can easily be replaced by an actual API call.
  useEffect(() => {
    const storedUser = localStorage.getItem('churn_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = (email: string, pass: string) => {
    // Mock login logic
    const mockUser = { email, name: email.split('@')[0], role: 'admin' };
    localStorage.setItem('churn_user', JSON.stringify(mockUser));
    setUser(mockUser);
    setIsAuthenticated(true);
  };

  const register = (email: string, pass: string, name: string) => {
    // Mock register logic
    const mockUser = { email, name, role: 'admin' };
    localStorage.setItem('churn_user', JSON.stringify(mockUser));
    setUser(mockUser);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('churn_user');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, register }}>
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
