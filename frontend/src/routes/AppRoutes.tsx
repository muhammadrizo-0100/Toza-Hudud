import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { PublicPortalPage } from '../pages/public/PublicPortalPage';
import { LocationPickerPage } from '../pages/public/LocationPickerPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { SystemPage } from '../pages/admin/SystemPage';
import { RequestsPage } from '../pages/admin/RequestsPage';
import { MapPage } from '../pages/admin/MapPage';
import { StatsPage } from '../pages/admin/StatsPage';
import { DistrictsPage } from '../pages/admin/DistrictsPage';
import { StaffPage } from '../pages/admin/StaffPage';
import { MyAccountPage } from '../pages/admin/MyAccountPage';

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <DashboardLayout>{children}</DashboardLayout>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<PublicPortalPage />} />
      <Route path="/location-picker" element={<LocationPickerPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Admin Protected Pages */}
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <SystemPage />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/requests"
        element={
          <ProtectedAdminRoute>
            <RequestsPage />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/map"
        element={
          <ProtectedAdminRoute>
            <MapPage />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/stats"
        element={
          <ProtectedAdminRoute>
            <StatsPage />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/districts"
        element={
          <ProtectedAdminRoute>
            <DistrictsPage />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/staff"
        element={
          <ProtectedAdminRoute>
            <StaffPage />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/my-account"
        element={
          <ProtectedAdminRoute>
            <MyAccountPage />
          </ProtectedAdminRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

