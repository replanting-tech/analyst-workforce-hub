
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import CustomerDashboard from './CustomerDashboard';

export default function CustomerPortalDashboard() {
  const { user, isLoading } = useCustomerAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Access denied</div>;
  }

  return <CustomerDashboard />;
}
