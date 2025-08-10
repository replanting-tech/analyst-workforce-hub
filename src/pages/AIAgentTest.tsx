
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AgentStepsTimeline } from '@/components/AgentStepsTimeline';

const AIAgentTest = () => {
  // Using a test incident ID for demonstration
  const testIncidentId = "12798819-f965-46b6-9f0e-6a587e1100a6";

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              AI Agent Test Page
              <Badge variant="outline">Test Mode</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This page is for testing the AI Agent Timeline component. It uses a test incident ID: {testIncidentId}
            </p>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• The component will fetch agent runs for the test incident</li>
                <li>• Check the browser console for debug information</li>
                <li>• Agent steps will be displayed in real-time</li>
                <li>• If no data appears, check the database for agent_runs with this incident_id</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agent Steps Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <AgentStepsTimeline incidentId={testIncidentId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIAgentTest;
