
import React, { useState } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { CustomerPortalSidebar } from "@/components/CustomerPortalSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CustomerPortalDashboard } from './CustomerPortalDashboard';
import {CustomerPortalCaseManagement} from './CustomerPortalCaseManagement';
import {CustomerPortalReport} from './CustomerPortalReport';
import {CustomerPortalSettings} from './CustomerPortalSettings';
import { CustomerPortalIncidentDetail } from './CustomerPortalIncidentDetail';
import { DarkModeToggle } from './DarkModeToggle';

interface User {
  id: string;
  email: string;
  full_name: string;
  customer_id: string;
  role: string;
}

interface CustomerPortalLayoutProps {
  user: User;
  onLogout: () => void;
}

export function CustomerPortalLayout({ user, onLogout }: CustomerPortalLayoutProps) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  const renderContent = () => {
    if (selectedIncidentId) {
      return (
        <CustomerPortalIncidentDetail 
          incidentId={selectedIncidentId} 
          onBack={() => setSelectedIncidentId(null)}
        />
      );
    }

    switch (activeSection) {
      case 'dashboard':
        return <CustomerPortalDashboard user={user} />;
      case 'case-management':
        return <CustomerPortalCaseManagement user={user} onIncidentSelect={setSelectedIncidentId} />;
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
        <CustomerPortalSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection}
          onLogout={onLogout}
        />
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
