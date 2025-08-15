import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';
import { CustomerRoutes } from '@/routes/CustomerRoutes';
import ProtectedRoute from '@/components/ProtectedRoute';
import Index from '@/pages/Index';
import Report from '@/pages/Report';
import IncidentDetail from '@/pages/IncidentDetail';

import { useAuth } from '@/contexts/AuthContext';

const AppRoutes = () => {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth />} />
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
      <Route path="/incident/:incidentId" element={<ProtectedRoute><IncidentDetail /></ProtectedRoute>} />
      
      {/* Assuming CustomerRoutes contains other protected routes */}
      <Route path="/*" element={<ProtectedRoute><CustomerRoutes /></ProtectedRoute>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
