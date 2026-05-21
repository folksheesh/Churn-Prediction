import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

import AdminLayout from '@/layouts/AdminLayout';
import AuthLayout from '@/layouts/AuthLayout';

import Dashboard from '@/pages/admin/Dashboard';
import Customers from '@/pages/admin/Customers';
import Admin from '@/pages/admin/Admin';
import Analytics from '@/pages/admin/Analytics';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Landing from '@/pages/Landing';
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

          {/* Public Landing Page */}
          <Route path="/" element={<Landing />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
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
