import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

import AdminLayout from '@/layouts/AdminLayout';
import AuthLayout from '@/layouts/AuthLayout';

import Dashboard from '@/pages/Dashboard';
import Customers from '@/pages/Customers';
import Admin from '@/pages/Admin';
import Analytics from '@/pages/Analytics';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import UserPlaceholder from '@/pages/user/Placeholder';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/analytics" element={<Analytics />} />
            </Route>
          </Route>
          
          {/* Public or Protected User routes could go here later */}
          <Route path="/user-demo" element={<UserPlaceholder />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
