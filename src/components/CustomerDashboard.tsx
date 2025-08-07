import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import { 
  Shield, AlertTriangle, CheckCircle, Clock, TrendingUp, 
  Users, Activity, FileText, LogOut, Download 
} from 'lucide-react';
import { useIncidents } from '@/hooks/useIncidents';
import { useIncidentsRealtime } from '@/hooks/useIncidentsRealtime';

interface CustomerDashboardProps {
  onLogout: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onLogout }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [realtimeDetections, setRealtimeDetections] = useState<Array<{id: string, priority: string, timestamp: Date}>>([]);
  
  const { data: incidents = [] } = useIncidents();
  
  // Use real-time hook
  useIncidentsRealtime();

  // Calculate incident statistics
  const openIncidents = incidents.filter(incident => incident.status === 'active');
  const closedIncidents = incidents.filter(incident => incident.status === 'closed');
  const underInvestigation = openIncidents.filter(incident => incident.analyst_id);
  const totalOpenIncidents = openIncidents.length;
  const totalClosedIncidents = closedIncidents.length;
  const totalFalsePositive = 6; // This would come from your data
  const completionRate = totalClosedIncidents > 0 ? Math.round((totalClosedIncidents / (totalClosedIncidents + totalFalsePositive)) * 10) : 0;

  // Mock real-time incident detection data
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance of new detection
        const priorities = ['high', 'medium', 'low', 'critical'];
        const newDetection = {
          id: Math.random().toString(),
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          timestamp: new Date()
        };
        setRealtimeDetections(prev => [...prev.slice(-5), newDetection]); // Keep last 6 detections
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-red-400';
      case 'medium': return 'bg-yellow-400';
      case 'low': return 'bg-blue-400';
      default: return 'bg-gray-400';
    }
  };

  const getSeverityCount = (priority: string) => {
    return realtimeDetections.filter(detection => detection.priority === priority).length;
  };

  const completionData = [
    { name: 'Completed', value: completionRate, color: '#10b981' },
    { name: 'Remaining', value: 10 - completionRate, color: '#e5e7eb' }
  ];

  const threatData = [
    { name: 'Jan', value: 20 },
    { name: 'Feb', value: 35 },
    { name: 'Mar', value: 25 },
    { name: 'Apr', value: 40 },
    { name: 'May', value: 55 },
    { name: 'Jun', value: 30 }
  ];

  const incidentsBySecurityLevel = [
    { name: 'High', value: 45, color: '#ef4444' },
    { name: 'Medium', value: 30, color: '#f59e0b' },
    { name: 'Low', value: 25, color: '#10b981' }
  ];

  const incidentsByCategory = [
    { category: 'Phishing', count: 45 },
    { category: 'Malware', count: 38 },
    { category: 'Data Breach', count: 25 },
    { category: 'Suspicious Activity', count: 20 },
    { category: 'Policy Violation', count: 18 }
  ];

  const topAttackers = [
    { ip: '192.168.1.100', attacks: 150 },
    { ip: '10.0.0.50', attacks: 120 },
    { ip: '172.16.1.25', attacks: 98 },
    { ip: '203.0.113.10', attacks: 85 },
    { ip: '198.51.100.5', attacks: 72 }
  ];

  const recentIncidents = [
    {
      id: 'INC001',
      name: 'Suspicious Login Attempt',
      priority: 'High',
      category: 'Security',
      status: 'Active',
      date: '2025-01-15 14:30'
    },
    {
      id: 'INC002', 
      name: 'Malware Detection',
      priority: 'Critical',
      category: 'Malware',
      status: 'Investigating',
      date: '2025-01-15 13:15'
    },
    {
      id: 'INC003',
      name: 'Data Access Anomaly',
      priority: 'Medium',
      category: 'Data Protection',
      status: 'Resolved',
      date: '2025-01-15 12:00'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900"># CUSTOMER DASHBOARD</h1>
              <p className="text-gray-600">Security Incident Management Portal</p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Real-time Incident Detection */}
        <Card>
          <CardHeader>
            <CardTitle>Realtime incident detection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-24">
              {['critical', 'high', 'medium', 'low'].map((priority, index) => {
                const count = getSeverityCount(priority);
                const maxCount = Math.max(...['critical', 'high', 'medium', 'low'].map(p => getSeverityCount(p)), 1);
                const height = Math.max((count / maxCount) * 80, 8);
                
                return (
                  <div key={priority} className="flex flex-col items-center">
                    <div
                      className={`w-12 ${getSeverityColor(priority)} rounded-t transition-all duration-500`}
                      style={{ height: `${height}px` }}
                    />
                    <span className="text-sm font-medium mt-1">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Statistics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incident Open */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Incident Open</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">under investigation</p>
                    <p className="text-4xl font-bold">{underInvestigation.length}</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">all incidents</p>
                    <p className="text-4xl font-bold">{incidents.length}</p>
                  </div>
                </Card>
                <Card className="p-4 col-span-2">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">total incident open</p>
                    <p className="text-4xl font-bold">{totalOpenIncidents}</p>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Incident Closed */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Incident Closed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">total incident closed</p>
                    <p className="text-4xl font-bold">{totalClosedIncidents}</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Completion</p>
                    <p className="text-2xl font-bold">{completionRate}/10</p>
                    <p className="text-sm text-gray-500 mt-1">pie chart</p>
                    <div className="mt-2 w-16 h-16 mx-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={completionData}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={20}
                            outerRadius={30}
                            startAngle={90}
                            endAngle={450}
                          >
                            {completionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 col-span-2">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">total false positive</p>
                    <p className="text-4xl font-bold">{totalFalsePositive}</p>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Threat Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>🔍 Threat SLA Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: { label: "Incidents", color: "#3b82f6" }
                }}
                className="h-64"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={threatData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Security Level Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Incidents by Security Severity</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: { label: "Count", color: "#10b981" }
                }}
                className="h-64"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incidentsBySecurityLevel}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {incidentsBySecurityLevel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Attack Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Top Attack Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Top Attack Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {incidentsByCategory.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{item.category}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(item.count / 50) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top IP Attacker */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Top IP Attacker</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topAttackers.map((attacker, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm font-mono text-gray-600">{attacker.ip}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${(attacker.attacks / 150) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{attacker.attacks}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Suspect Host */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Top Suspect Host</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Compromised Systems</span>
                  <span className="font-medium">15</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Quarantined</span>
                  <span className="font-medium">8</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Under Investigation</span>
                  <span className="font-medium">12</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Critical Assets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">List of Critical Asset Affected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Servers</span>
                  <span className="font-medium">10</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Databases</span>
                  <span className="font-medium">5</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Workstations</span>
                  <span className="font-medium">25</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Incident Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Security Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Ticket Number</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Ticket Name</th>
                    <th className="text-left p-2">Priority</th>
                    <th className="text-left p-2">Threat Category</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentIncidents.map((incident) => (
                    <tr key={incident.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <span className="text-blue-600 font-medium">{incident.id}</span>
                      </td>
                      <td className="p-2 text-gray-600">{incident.date}</td>
                      <td className="p-2">{incident.name}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(incident.priority)}`} />
                          <span>{incident.priority}</span>
                        </div>
                      </td>
                      <td className="p-2 text-gray-600">{incident.category}</td>
                      <td className="p-2">
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
