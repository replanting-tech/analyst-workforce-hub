
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Bot } from 'lucide-react';
import { DarkModeToggle } from '@/components/DarkModeToggle';
import AgentStepsTimeline from '@/components/AgentStepsTimeline';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AIAgentTestPage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('incidents');
  const [incidentId, setIncidentId] = useState('598a1c77-f05a-44e8-9dba-02b89b9e956b'); // Default for testing

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
                <span>Back to Dashboard</span>
              </Button>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Bot className="w-6 h-6" />
                AI Agent Test Page
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <DarkModeToggle />
            </div>
          </header>
          
          <main className="flex-1 p-6 bg-background w-full space-y-6">
            {/* Test Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Test Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end space-x-4">
                  <div className="flex-1">
                    <Label htmlFor="incident-id">Incident ID (UUID from incidents table)</Label>
                    <Input
                      id="incident-id"
                      value={incidentId}
                      onChange={(e) => setIncidentId(e.target.value)}
                      placeholder="Enter incident UUID..."
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={() => {
                      // Force re-render by clearing and setting the value
                      const temp = incidentId;
                      setIncidentId('');
                      setTimeout(() => setIncidentId(temp), 10);
                    }}
                  >
                    Refresh Timeline
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Instructions:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Enter the UUID from the incidents.id field (not incident_id)</li>
                    <li>The component will fetch the latest agent_runs for this incident</li>
                    <li>Then display all agent_steps for that run in real-time</li>
                    <li>Open browser console to see debug logs</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* AI Agent Timeline */}
            {incidentId && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Agent Analysis for Incident: {incidentId}</h2>
                <AgentStepsTimeline incidentId={incidentId} />
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AIAgentTestPage;
