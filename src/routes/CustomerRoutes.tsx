import React from 'react';
import { Routes, Route, Navigate, useParams, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { CustomerPortalLayout } from '@/components/CustomerPortalLayout';
import { CustomerPortalDashboard } from '@/components/CustomerPortalDashboard';
import { CustomerPortalCaseManagement } from '@/components/CustomerPortalCaseManagement';
import { CustomerPortalReport } from '@/components/CustomerPortalReport';
import { CustomerPortalSettings } from '@/components/CustomerPortalSettings';
import { CustomerPortalIncidentDetail } from '@/components/CustomerPortalIncidentDetail';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { Loader2 } from 'lucide-react';

const CustomerRoutesContent: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useCustomerAuth();
  const location = useLocation();

  // Handle incident selection
  const handleIncidentSelect = React.useCallback((incidentId: string) => {
    navigate(`/portal/cases/${incidentId}`);
  }, [navigate]);

  // Handle back navigation
  const handleBackToCases = React.useCallback(() => {
    navigate('/portal/cases');
  }, [navigate]);

  // If no user is found (should be handled by parent)
  if (!user) {
    return null;
  }

  return (
    <Routes>
      <Route
        element={
          <CustomerPortalLayout>
            <Outlet />
          </CustomerPortalLayout>
        }
      >
        <Route index element={<CustomerPortalDashboard user={user} />} />
        
        <Route
          path="cases"
          element={
            <CustomerPortalCaseManagement
              user={user}
              onIncidentSelect={handleIncidentSelect}
            />
          }
        />
        
        <Route
          path="cases/:incidentId"
          element={
            <CustomerPortalIncidentDetailWrapper 
              onBack={handleBackToCases} 
            />
          }
        />
        
        <Route
          path="reports"
          element={<CustomerPortalReport customerId={user.customer_id} />}
        />
        
        <Route
          path="settings"
          element={<CustomerPortalSettings user={user} />}
        />
        
        {/* Catch-all route for unknown paths */}
        <Route path="*" element={<Navigate to="/portal" replace />} />
      </Route>
    </Routes>
  );
};

// Wrapper component to properly extract the incidentId from URL params
const CustomerPortalIncidentDetailWrapper: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { incidentId } = useParams<{ incidentId: string }>();
  
  if (!incidentId) {
    onBack();
    return null;
  }
  
  return (
    <CustomerPortalIncidentDetail
      incidentId={incidentId}
      onBack={onBack}
    />
  );
};

export const CustomerRoutes: React.FC = () => {
  const { user, loading } = useCustomerAuth();
  const location = useLocation();

  // Show loading state while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/portal" state={{ from: location }} replace />;
  }

  // If authenticated, render the protected routes
  return <CustomerRoutesContent />;
};