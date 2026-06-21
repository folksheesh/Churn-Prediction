import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

import AdminLayout from '@/layouts/AdminLayout';
import AuthLayout from '@/layouts/AuthLayout';

import Dashboard from '@/pages/admin/Dashboard';
import Customers from '@/pages/admin/Customers';
import Admin from '@/pages/admin/Admin';
import Campaigns from '@/pages/admin/Campaigns';

import Analysis from '@/pages/admin/Analysis';
import Login from '@/pages/auth/Login';
import SignUp from '@/pages/auth/SignUp';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import AdminManagement from '@/pages/admin/AdminManagement';
import Landing from '@/pages/Landing';
import UserDashboard from '@/pages/user/Dashboard';

import CsManagement from '@/pages/admin/CsManagement';
import Profile from '@/pages/admin/Profile';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Public Landing Page */}
          <Route path="/" element={<Landing />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin', 'CS Manager', 'CS Agent']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="customers" element={<Customers />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="manage-admins" element={<AdminManagement />} />
              <Route path="cs-management" element={<CsManagement />} />
              <Route path="analysis" element={<Analysis />} />
              <Route path="profile" element={<Profile />} />
              <Route index element={<Admin />} />
            </Route>
          </Route>
          
          {/* Protected User Routes */}
          <Route element={<ProtectedRoute allowedRoles={['user']} />}>
            <Route path="/dashboard" element={<UserDashboard />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
