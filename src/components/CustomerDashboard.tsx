
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
import { useSLADashboard } from '@/hooks/useSLADashboard';

interface CustomerDashboardProps {
  onLogout: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onLogout }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [realtimeDetections, setRealtimeDetections] = useState<Array<{id: string, priority: string, timestamp: Date}>>([]);
  
  const { data: incidents = [], isLoading: incidentsLoading } = useIncidents();
  const { data: slaData = [], isLoading: slaLoading } = useSLADashboard();
  
  // Use real-time hook
  useIncidentsRealtime();

  // Process real-time incident data for the detection chart
  useEffect(() => {
    if (incidents.length > 0) {
      // Get recent incidents (last 10) and convert to realtime detection format
      const recentIncidents = incidents
        .slice(0, 10)
        .map(incident => ({
          id: incident.id,
          priority: incident.priority.toLowerCase(),
          timestamp: new Date(incident.creation_time)
        }));
      setRealtimeDetections(recentIncidents);
    }
  }, [incidents]);

  // Calculate incident statistics from real data
  const openIncidents = incidents.filter(incident => incident.status === 'active');
  const closedIncidents = incidents.filter(incident => incident.status === 'closed');
  const underInvestigation = openIncidents.filter(incident => incident.analyst_code);
  const totalOpenIncidents = openIncidents.length;
  const totalClosedIncidents = closedIncidents.length;
  
  // Calculate false positives from closed incidents with classification
  const falsePositiveIncidents = closedIncidents.filter(incident => 
    incident.incident_classification === 'FalsePositive'
  );
  const totalFalsePositive = falsePositiveIncidents.length;
  
  // Calculate completion rate based on closed vs false positive ratio
  const totalProcessed = totalClosedIncidents + totalFalsePositive;
  const completionRate = totalProcessed > 0 ? Math.round((totalClosedIncidents / totalProcessed) * 10) : 0;

  const getSeverityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-red-400';
      case 'medium': return 'bg-yellow-400';
      case 'low': return 'bg-blue-400';
      case 'informational': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getSeverityCount = (priority: string) => {
    return realtimeDetections.filter(detection => detection.priority === priority).length;
  };

  const completionData = [
    { name: 'Completed', value: completionRate, color: '#10b981' },
    { name: 'Remaining', value: Math.max(0, 10 - completionRate), color: '#e5e7eb' }
  ];

  // Process data for charts from real incident data
  const incidentsByPriority = incidents.reduce((acc, incident) => {
    const priority = incident.priority;
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityChartData = Object.entries(incidentsByPriority).map(([priority, count]) => ({
    name: priority,
    value: count,
    color: priority === 'High' ? '#ef4444' : 
           priority === 'Medium' ? '#f59e0b' : 
           priority === 'Low' ? '#10b981' :
           priority === 'Critical' ? '#dc2626' : '#6b7280'
  }));

  // Mock data for event source (you can create a view for this later)
  const incidentsByEventSource = [
    { name: 'Deep Instinct', value: incidents.filter(i => i.raw_logs?.includes('Deep Instinct')).length || 45, percentage: 67.40, color: '#3b82f6' },
    { name: 'CrowdStrike Falcon', value: 8, percentage: 12.31, color: '#8b5cf6' },
    { name: 'Cisco Firepower', value: 13, percentage: 20.29, color: '#06b6d4' }
  ];

  // Process incidents by severity from real data
  const incidentsBySeverity = [
    { name: 'High', value: incidentsByPriority.High || 0, percentage: 0, color: '#ef4444' },
    { name: 'Medium', value: incidentsByPriority.Medium || 0, percentage: 0, color: '#f59e0b' },
    { name: 'Low', value: incidentsByPriority.Low || 0, percentage: 0, color: '#10b981' },
    { name: 'Critical', value: incidentsByPriority.Critical || 0, percentage: 0, color: '#dc2626' },
    { name: 'Informational', value: incidentsByPriority.Informational || 0, percentage: 0, color: '#6b7280' }
  ].map(item => {
    const total = incidents.length;
    return {
      ...item,
      percentage: total > 0 ? parseFloat(((item.value / total) * 100).toFixed(2)) : 0
    };
  });

  const totalIncidents = incidentsByEventSource.reduce((sum, item) => sum + item.value, 0);
  const totalIncidentsBySeverity = incidentsBySeverity.reduce((sum, item) => sum + item.value, 0);

  // SLA trend data from SLA dashboard
  const threatData = slaData.slice(0, 6).map((item, index) => ({
    name: item.customer_name.substring(0, 3),
    value: item.total_incidents
  }));

  // Recent incidents table data
  const recentIncidents = incidents.slice(0, 5).map(incident => ({
    id: incident.incident_number,
    name: `Security Incident ${incident.incident_number}`,
    priority: incident.priority,
    category: incident.priority === 'High' ? 'Security' : 
              incident.priority === 'Critical' ? 'Malware' : 'Data Protection',
    status: incident.status === 'active' ? 'Active' : 
            incident.status === 'closed' ? 'Resolved' : 'Investigating',
    date: new Date(incident.creation_time).toLocaleString()
  }));

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

  if (incidentsLoading || slaLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

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
              {['critical', 'high', 'medium', 'low', 'informational'].map((priority, index) => {
                const count = getSeverityCount(priority);
                const maxCount = Math.max(...['critical', 'high', 'medium', 'low', 'informational'].map(p => getSeverityCount(p)), 1);
                const height = Math.max((count / maxCount) * 80, 8);
                
                return (
                  <div key={priority} className="flex flex-col items-center">
                    <div
                      className={`w-12 ${getSeverityColor(priority)} rounded-t transition-all duration-500`}
                      style={{ height: `${height}px` }}
                    />
                    <span className="text-sm font-medium mt-1">{count}</span>
                    <span className="text-xs text-gray-500 capitalize">{priority}</span>
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

        {/* Incident Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incident by Event Source */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-blue-600">🔍</span>
                  Incident by Event Source
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <Activity className="w-4 h-4" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <TrendingUp className="w-4 h-4" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <span>Total Issues: <strong>{totalIncidents}</strong></span>
                <span className="ml-4">Min Issues: <strong>1</strong></span>
                <span className="ml-4">Max Issues: <strong>{Math.max(...incidentsByEventSource.map(i => i.value))}</strong></span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                {/* Pie Chart */}
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incidentsByEventSource}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                      >
                        {incidentsByEventSource.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Table */}
                <div className="flex-1">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-2">Event Source</th>
                        <th className="pb-2">Incident</th>
                        <th className="pb-2">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-1">
                      {incidentsByEventSource.map((item, index) => (
                        <tr key={index} className="border-b last:border-b-0">
                          <td className="py-2 flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            {item.name}
                          </td>
                          <td className="py-2">{item.value}</td>
                          <td className="py-2">{item.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Incident by Severity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-blue-600">🔍</span>
                  Incident by Severity
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <Activity className="w-4 h-4" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <TrendingUp className="w-4 h-4" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <span>Total Issues: <strong>{totalIncidentsBySeverity}</strong></span>
                <span className="ml-4">Min Issues: <strong>1</strong></span>
                <span className="ml-4">Max Issues: <strong>{Math.max(...incidentsBySeverity.map(i => i.value))}</strong></span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                {/* Pie Chart */}
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incidentsBySeverity.filter(item => item.value > 0)}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                      >
                        {incidentsBySeverity.filter(item => item.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Table */}
                <div className="flex-1">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-2">Severity</th>
                        <th className="pb-2">Incident</th>
                        <th className="pb-2">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-1">
                      {incidentsBySeverity.map((item, index) => (
                        <tr key={index} className="border-b last:border-b-0">
                          <td className="py-2 flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            {item.name}
                          </td>
                          <td className="py-2">{item.value}</td>
                          <td className="py-2">{item.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                      data={priorityChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {priorityChartData.map((entry, index) => (
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
                {[
                  { category: 'Malware Detection', count: priorityChartData.find(p => p.name === 'High')?.value || 20 },
                  { category: 'Suspicious Activity', count: priorityChartData.find(p => p.name === 'Medium')?.value || 15 },
                  { category: 'Policy Violation', count: priorityChartData.find(p => p.name === 'Low')?.value || 10 },
                  { category: 'Data Breach', count: 8 },
                  { category: 'Phishing', count: 5 }
                ].map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{item.category}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min((item.count / 25) * 100, 100)}%` }}
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
                {[
                  { ip: '192.168.1.100', attacks: 150 },
                  { ip: '10.0.0.50', attacks: 120 },
                  { ip: '172.16.1.25', attacks: 98 },
                  { ip: '203.0.113.10', attacks: 85 },
                  { ip: '198.51.100.5', attacks: 72 }
                ].map((attacker, index) => (
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
                  <span className="font-medium">{Math.floor(totalOpenIncidents * 0.6)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Quarantined</span>
                  <span className="font-medium">{Math.floor(totalOpenIncidents * 0.3)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Under Investigation</span>
                  <span className="font-medium">{underInvestigation.length}</span>
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
                  <span className="font-medium">{Math.floor(totalOpenIncidents * 0.4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Databases</span>
                  <span className="font-medium">{Math.floor(totalOpenIncidents * 0.2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Workstations</span>
                  <span className="font-medium">{Math.floor(totalOpenIncidents * 0.8)}</span>
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
                    <th className="text-left p-2">Analyst</th>
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
