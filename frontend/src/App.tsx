import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

import AdminLayout from '@/layouts/AdminLayout';
import AuthLayout from '@/layouts/AuthLayout';

import Dashboard from '@/pages/admin/Dashboard';
import Customers from '@/pages/admin/Customers';
import Admin from '@/pages/admin/Admin';
import CampaignManager from '@/pages/admin/CampaignManager';
import CampaignEditor from '@/pages/admin/CampaignEditor';
import EmailHistory from '@/pages/admin/EmailHistory';

import Analysis from '@/pages/admin/Analysis';
import Login from '@/pages/auth/Login';
import ActivateAccount from '@/pages/auth/ActivateAccount';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import AdminManagement from '@/pages/admin/AdminManagement';
import UserManagement from '@/pages/admin/UserManagement';
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
            <Route path="/activate-account" element={<ActivateAccount />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Public Landing Page */}
          <Route path="/" element={<Landing />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['super_admin', 'company_admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="customers" element={<Customers />} />
              <Route path="campaigns" element={<CampaignManager />} />
              <Route path="campaigns/new" element={<CampaignEditor />} />
              <Route path="campaigns/:id" element={<CampaignEditor />} />
              <Route path="email-history" element={<EmailHistory />} />
              <Route path="manage-admins" element={<AdminManagement />} />
              <Route path="user-management" element={<UserManagement />} />
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
