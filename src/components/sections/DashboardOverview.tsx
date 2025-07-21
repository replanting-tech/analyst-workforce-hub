
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Users, Clock, CheckCircle, TrendingUp, Activity } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export function DashboardOverview() {
  // Mock data - will be replaced with real data from Supabase
  const stats = {
    activeIncidents: 15,
    totalAnalysts: 8,
    avgResponseTime: '12 min',
    slaCompliance: '94.2%'
  };

  const recentIncidents = [
    { id: 'INC-001', priority: 'High', customer: 'ABC Corp', analyst: 'John Doe', status: 'Active' },
    { id: 'INC-002', priority: 'Medium', customer: 'XYZ Ltd', analyst: 'Jane Smith', status: 'Active' },
    { id: 'INC-003', priority: 'Low', customer: 'DEF Inc', analyst: 'Mike Johnson', status: 'Resolved' }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Active Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{stats.activeIncidents}</div>
            <p className="text-xs text-red-600">3 critical priority</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Analysts</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.totalAnalysts}</div>
            <p className="text-xs text-blue-600">6 available, 2 busy</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats.avgResponseTime}</div>
            <p className="text-xs text-orange-600">-2 min from last week</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">SLA Compliance</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.slaCompliance}</div>
            <p className="text-xs text-green-600">+1.2% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5 text-blue-600" />
              Recent Incidents
            </CardTitle>
            <CardDescription>Latest incident activities and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentIncidents.map((incident) => (
                <div key={incident.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant={
                      incident.priority === 'High' ? 'destructive' : 
                      incident.priority === 'Medium' ? 'default' : 'secondary'
                    }>
                      {incident.priority}
                    </Badge>
                    <div>
                      <p className="font-medium text-sm">{incident.id}</p>
                      <p className="text-xs text-gray-600">{incident.customer}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{incident.analyst}</p>
                    <Badge variant={incident.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                      {incident.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
              Performance Trends
            </CardTitle>
            <CardDescription>Weekly performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Incident Resolution Rate</span>
                <span className="font-medium text-green-600">↑ 8.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Customer Satisfaction</span>
                <span className="font-medium text-green-600">↑ 4.1%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Response Time</span>
                <span className="font-medium text-green-600">↓ 15.3%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">SLA Breaches</span>
                <span className="font-medium text-red-600">↑ 2.1%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
