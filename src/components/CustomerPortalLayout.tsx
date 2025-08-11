
import React, { useState } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CustomerPortalDashboard } from './CustomerPortalDashboard';
import CustomerPortalCaseManagement from './CustomerPortalCaseManagement';
import CustomerPortalReport from './CustomerPortalReport';
import CustomerPortalSettings from './CustomerPortalSettings';
import { DarkModeToggle } from './DarkModeToggle';

interface User {
  id: string;
  email: string;
  full_name: string;
  customer_id: string;
}

interface CustomerPortalLayoutProps {
  user: User;
}

export function CustomerPortalLayout({ user }: CustomerPortalLayoutProps) {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <CustomerPortalDashboard user={user} />;
      case 'case-management':
        return <CustomerPortalCaseManagement />;
      case 'reports':
        return <CustomerPortalReport customerId={user.customer_id} />;
      case 'settings':
        return <CustomerPortalSettings user={user} />;
      default:
        return <CustomerPortalDashboard user={user} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <div className="flex-1 flex flex-col w-full">
          <header className="bg-background border-b border-border px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold text-foreground">Customer Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user.full_name}
              </span>
              <DarkModeToggle />
            </div>
          </header>
          <main className="flex-1 p-6 bg-background w-full">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
