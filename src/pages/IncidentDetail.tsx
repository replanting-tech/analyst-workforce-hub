
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import IncidentDetail from '@/components/IncidentDetail';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { DarkModeToggle } from '@/components/DarkModeToggle';

const IncidentDetailPage = () => {
  const { incidentId } = useParams<{ incidentId: string }>();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('incidents');

  if (!incidentId) {
    return <div>Incident ID not found</div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <div className="flex-1 flex flex-col w-full">
          <header className="bg-background border-b border-border px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <SidebarTrigger />
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Incidents</span>
              </Button>
              <h1 className="text-2xl font-bold text-foreground">Incident Details</h1>
            </div>
            <div className="flex items-center space-x-4">
              <DarkModeToggle />
              <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
                System Active
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 bg-background w-full">
            <IncidentDetail incidentId={incidentId} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default IncidentDetailPage;
