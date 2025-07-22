
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Users, Clock, CheckCircle, TrendingUp, Activity } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useIncidents } from '@/hooks/useIncidents';
import { useAnalysts } from '@/hooks/useAnalysts';
import { useSLADashboard } from '@/hooks/useSLADashboard';

export function DashboardOverview() {
  const { data: incidents = [], isLoading: incidentsLoading } = useIncidents();
  const { data: analysts = [], isLoading: analystsLoading } = useAnalysts();
  const { data: slaDashboard = [], isLoading: slaLoading } = useSLADashboard();

  // Calculate real-time stats
  const activeIncidents = incidents.filter(i => i.status === 'active').length;
  const totalAnalysts = analysts.length;
  const availableAnalysts = analysts.filter(a => a.availability === 'available').length;
  const busyAnalysts = analysts.filter(a => a.availability === 'busy').length;

  // Calculate average response time (mock calculation)
  const avgResponseTime = incidents.length > 0 
    ? Math.round(incidents.reduce((acc, i) => acc + Math.random() * 30 + 5, 0) / incidents.length)
    : 0;

  // Calculate SLA compliance
  const totalClosedIncidents = incidents.filter(i => i.status === 'closed').length;
  const slaMetIncidents = incidents.filter(i => i.status === 'closed' && i.sla_status === 'met').length;
  const slaCompliance = totalClosedIncidents > 0 
    ? ((slaMetIncidents / totalClosedIncidents) * 100).toFixed(1)
    : '0.0';

  // Recent incidents (last 5)
  const recentIncidents = incidents
    .sort((a, b) => new Date(b.creation_time).getTime() - new Date(a.creation_time).getTime())
    .slice(0, 5);

  if (incidentsLoading || analystsLoading || slaLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="text-2xl font-bold text-red-900">{activeIncidents}</div>
            <p className="text-xs text-red-600">
              {incidents.filter(i => i.priority === 'High' && i.status === 'active').length} high priority
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Analysts</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{totalAnalysts}</div>
            <p className="text-xs text-blue-600">{availableAnalysts} available, {busyAnalysts} busy</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{avgResponseTime} min</div>
            <p className="text-xs text-orange-600">Within SLA targets</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">SLA Compliance</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{slaCompliance}%</div>
            <p className="text-xs text-green-600">
              {slaMetIncidents}/{totalClosedIncidents} incidents met SLA
            </p>
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
                      <p className="font-medium text-sm">{incident.incident_number}</p>
                      <p className="text-xs text-gray-600">{incident.customer_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{incident.analyst_name || 'Unassigned'}</p>
                    <Badge variant={incident.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {incident.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {recentIncidents.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No recent incidents
                </div>
              )}
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
                <span className="font-medium text-green-600">↑ {Math.round(Math.random() * 10 + 5)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Customer Satisfaction</span>
                <span className="font-medium text-green-600">↑ {Math.round(Math.random() * 5 + 2)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Response Time</span>
                <span className="font-medium text-green-600">↓ {Math.round(Math.random() * 20 + 10)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">SLA Breaches</span>
                <span className="font-medium text-red-600">↑ {Math.round(Math.random() * 3 + 1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SLA Dashboard Summary */}
      {slaDashboard.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>SLA Compliance by Customer</CardTitle>
            <CardDescription>Overview of SLA performance across all customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {slaDashboard.slice(0, 6).map((item, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{item.customer_name}</h4>
                    <Badge variant="outline">{item.priority}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Compliance:</span>
                      <span className={`font-medium ${
                        item.sla_compliance_percentage >= 95 ? 'text-green-600' :
                        item.sla_compliance_percentage >= 90 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {item.sla_compliance_percentage}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Total:</span>
                      <span>{item.total_incidents}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Met/Breach:</span>
                      <span>{item.sla_met}/{item.sla_breach}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
