import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import CustomerPortalDashboard from '@/pages/CustomerPortalDashboard';
import CustomerProfilePage from '@/pages/CustomerProfilePage';
import CustomerIncidentsPage from '@/pages/CustomerIncidentsPage';
import CustomerIncidentDetailPage from '@/pages/CustomerIncidentDetailPage';

const CustomerRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><CustomerProfilePage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><CustomerProfilePage /></ProtectedRoute>} />
      <Route path="/incidents" element={<ProtectedRoute><CustomerIncidentsPage /></ProtectedRoute>} />
      <Route path="/incidents/:incidentId" element={<ProtectedRoute><CustomerIncidentDetailPage /></ProtectedRoute>} />

        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <CustomerPortalDashboard />
            </ProtectedRoute>
          } 
        />

    </Routes>
  );
};

export default CustomerRoutes;
