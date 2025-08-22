
import React, { useState } from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from './AppSidebar';
import { DashboardOverview } from './sections/DashboardOverview';
import { IncidentManagement } from './sections/IncidentManagement';
import { AnalystManagement } from './sections/AnalystManagement';
import { ScheduleManagement } from './sections/ScheduleManagement';
import { CustomerManagement } from './sections/CustomerManagement';
import { RequestChanges } from './sections/RequestChanges';
import { SLAConfiguration } from './sections/SLAConfiguration';
import { WorkloadManagement } from './sections/WorkloadManagement';
import { ReportPage } from './sections/ReportPage';
import { DarkModeToggle } from './DarkModeToggle';
import UserNav from './UserNav';
import { useLocation } from 'react-router-dom';
import TemplateManagementPage from '@/pages/TemplateManagement';
import { L3Dashboard } from './sections/L3Dashboard';
import { useAuth } from '@/contexts/AuthContext';

export function MainDashboard() {
  const location = useLocation();
  const { role: userRole } = useAuth();
  const pathToSection = location.pathname.slice(1) || (userRole === 'L3' ? 'l3-dashboard' : 'overview');
  const [activeSection, setActiveSection] = useState(pathToSection);

  const renderContent = () => {
    if (userRole === 'L3') {
      return <L3Dashboard />;
    }

    switch (activeSection) {
      case 'overview':
        return <DashboardOverview />;
      case 'incidents':
        return <IncidentManagement />;
      case 'analysts':
        return <AnalystManagement />;
      case 'schedule':
        return <ScheduleManagement />;
      case 'customers':
        return <CustomerManagement />;
      case 'requests':
        return <RequestChanges />;
      case 'sla':
        return <SLAConfiguration />;
      case 'workload':
        return <WorkloadManagement />;
      case 'reports':
        return <ReportPage />;
      case 'templates':
        return <TemplateManagementPage />;
      case 'l3-dashboard':
        return <L3Dashboard />;
      default:
        return <DashboardOverview />;
    }
  };

  const getSectionTitle = () => {
    const sectionTitles = {
      'overview': 'Dashboard Overview',
      'incidents': 'Incident Management',
      'analysts': 'Analyst Management',
      'schedule': 'Schedule Management',
      'customers': 'Customer Management',
      'requests': 'Request Changes',
      'sla': 'SLA Configuration',
      'workload': 'Workload Management',
      'reports': 'Reports & Analytics',
      'l3-dashboard': 'L3 Dashboard'
    };
    return sectionTitles[activeSection as keyof typeof sectionTitles] || 'Dashboard';
  };

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="flex-1 flex flex-col w-full">
        <header className="bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold text-foreground">{getSectionTitle()}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <UserNav />
            <DarkModeToggle />
          </div>
        </header>
        <main className="flex-1 p-6 bg-background w-full">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
