
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';

export function CustomerPortalDashboard() {
  // Mock data - replace with actual data from your hooks
  const dashboardData = {
    totalIncidents: 12,
    openIncidents: 3,
    closedIncidents: 8,
    rejectedIncidents: 1,
    recentIncidents: [
      {
        id: '1',
        incidentNumber: 'INC-001',
        priority: 'High',
        status: 'Open',
        createdAt: '2025-01-10',
        description: 'Security breach detected'
      },
      {
        id: '2',
        incidentNumber: 'INC-002',
        priority: 'Medium',
        status: 'Closed',
        createdAt: '2025-01-09',
        description: 'Unusual network activity'
      }
    ]
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your security incidents and recent activity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalIncidents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{dashboardData.openIncidents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Incidents</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dashboardData.closedIncidents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{dashboardData.rejectedIncidents}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
          <CardDescription>Latest security incidents from your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.recentIncidents.map((incident) => (
              <div key={incident.id} className="flex items-center justify-between border-b pb-4 last:border-b-0">
                <div className="space-y-1">
                  <p className="font-medium">{incident.incidentNumber}</p>
                  <p className="text-sm text-muted-foreground">{incident.description}</p>
                  <p className="text-xs text-muted-foreground">Created: {incident.createdAt}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getPriorityColor(incident.priority)}>
                    {incident.priority}
                  </Badge>
                  <Badge variant={incident.status === 'Open' ? 'destructive' : 'default'}>
                    {incident.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
