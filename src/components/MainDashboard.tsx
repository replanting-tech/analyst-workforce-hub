
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

export function MainDashboard() {
  const [activeSection, setActiveSection] = useState('overview');

  const renderContent = () => {
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
      'reports': 'Reports & Analytics'
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
            <DarkModeToggle />
            <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
              System Active
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 bg-background w-full">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
