
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Clock, CheckCircle } from 'lucide-react';
import { useIncidents } from '@/hooks/useIncidents';

interface User {
  id: string;
  email: string;
  full_name: string;
  customer_id: string;
}

interface CustomerDashboardProps {
  user: User;
}

export function CustomerDashboard({ user }: CustomerDashboardProps) {
  const { data: incidents, isLoading } = useIncidents();

  // Filter incidents for this customer
  const customerIncidents = incidents?.filter(incident => 
    incident.customer_name && incident.customer_id === user.customer_id
  ) || [];

  const activeIncidents = customerIncidents.filter(i => i.status === 'active').length;
  const resolvedIncidents = customerIncidents.filter(i => i.status === 'closed').length;
  const highPriorityIncidents = customerIncidents.filter(i => i.priority === 'High' || i.priority === 'Very High').length;
  const pendingNotifications = customerIncidents.filter(i => i.customer_notification === 'waiting for approval').length;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeIncidents}</div>
            <p className="text-xs text-muted-foreground">Currently being handled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Cases</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedIncidents}</div>
            <p className="text-xs text-muted-foreground">Successfully closed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highPriorityIncidents}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingNotifications}</div>
            <p className="text-xs text-muted-foreground">Awaiting your response</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customerIncidents.slice(0, 5).map((incident) => (
              <div key={incident.incident_id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">Incident #{incident.incident_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(incident.creation_time).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={incident.status === 'active' ? 'destructive' : 'default'}>
                    {incident.status}
                  </Badge>
                  <Badge variant="outline">{incident.priority}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
