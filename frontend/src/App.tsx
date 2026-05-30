import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

import AdminLayout from '@/layouts/AdminLayout';
import AuthLayout from '@/layouts/AuthLayout';

import Dashboard from '@/pages/admin/Dashboard';
import Customers from '@/pages/admin/Customers';
import Admin from '@/pages/admin/Admin';

import Analysis from '@/pages/admin/Analysis';
import Login from '@/pages/auth/Login';
import AdminManagement from '@/pages/admin/AdminManagement';
import Landing from '@/pages/Landing';
import UserDashboard from '@/pages/user/Dashboard';

import CsManagement from '@/pages/admin/CsManagement';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />

          </Route>

          {/* Public Landing Page */}
          <Route path="/" element={<Landing />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/manage-admins" element={<AdminManagement />} />
              <Route path="/cs-management" element={<CsManagement />} />
              <Route path="/analysis" element={<Analysis />} />
            </Route>
          </Route>
          
          {/* Public User Route */}
          <Route path="/user-dashboard" element={<UserDashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
