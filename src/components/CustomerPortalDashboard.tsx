
import React from 'react';
import { CustomerDashboard } from './CustomerDashboard';

interface User {
  id: string;
  email: string;
  full_name: string;
  customer_id: string;
}

interface CustomerPortalDashboardProps {
  user: User;
}

export function CustomerPortalDashboard({ user }: CustomerPortalDashboardProps) {
  return <CustomerDashboard user={user} />;
}