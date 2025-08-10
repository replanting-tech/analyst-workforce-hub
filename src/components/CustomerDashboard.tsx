
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

interface CustomerUser {
  id: string;
  email: string;
  full_name: string;
  customer_id: string;
  role: string;
}

interface CustomerDashboardProps {
  user: CustomerUser;
}

export function CustomerDashboard({ user }: CustomerDashboardProps) {
  // Mock data for demo - in real implementation, fetch from API
  const dashboardData = {
    activeIncidents: 3,
    resolvedToday: 7,
    slaCompliance: 98.5,
    avgResponseTime: '2.3 hours',
    recentIncidents: [
      {
        id: 'INC-001',
        title: 'Suspicious login detected',
        severity: 'High',
        status: 'active',
        created: '2 hours ago'
      },
      {
        id: 'INC-002',
        title: 'Malware detected in email',
        severity: 'Medium',
        status: 'investigating',
        created: '4 hours ago'
      },
      {
        id: 'INC-003',
        title: 'Unauthorized access attempt',
        severity: 'Low',
        status: 'resolved',
        created: '1 day ago'
      }
    ]
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-red-100 text-red-800';
      case 'investigating':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {user.full_name}!</h2>
        <p className="text-blue-100">Here's your security overview for today.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Incidents</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{dashboardData.activeIncidents}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved Today</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{dashboardData.resolvedToday}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">SLA Compliance</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{dashboardData.slaCompliance}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{dashboardData.avgResponseTime}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Incidents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Recent Security Incidents</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.recentIncidents.map((incident) => (
              <div key={incident.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {incident.id}
                    </code>
                    <h4 className="font-medium">{incident.title}</h4>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{incident.created}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getSeverityColor(incident.severity)}>
                    {incident.severity}
                  </Badge>
                  <Badge className={getStatusColor(incident.status)}>
                    {incident.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Security Posture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Threat Detection</span>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Security</span>
                <Badge className="bg-green-100 text-green-800">Protected</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Endpoint Protection</span>
                <Badge className="bg-yellow-100 text-yellow-800">Monitoring</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Network Security</span>
                <Badge className="bg-green-100 text-green-800">Secure</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">View All Incidents</div>
                <div className="text-sm text-gray-500">Manage your security incidents</div>
              </button>
              <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">Generate Report</div>
                <div className="text-sm text-gray-500">Create security reports</div>
              </button>
              <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">Update Settings</div>
                <div className="text-sm text-gray-500">Configure preferences</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
