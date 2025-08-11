
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
  Users, Activity, FileText, LogOut, Download,
  BarChart3, CheckCircle2, XCircle, List, AlertCircle, Check
} from 'lucide-react';
import { useIncidents } from '@/hooks/useIncidents';
import { useIncidentsRealtime } from '@/hooks/useIncidentsRealtime';
import { useSLADashboard } from '@/hooks/useSLADashboard';

interface CustomerDashboardProps {
  onLogout: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onLogout }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [realtimeDetections, setRealtimeDetections] = useState<Array<{id: string, priority: string, timestamp: Date}>>([]);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  
  const { data: incidents = [], isLoading: incidentsLoading } = useIncidents();
  const { data: slaData = [], isLoading: slaLoading } = useSLADashboard();

  const handleIncidentSelect = (incidentId: string) => {
    const incident = incidents.find(inc => inc.incident_id === incidentId);
    if (incident) {
      setSelectedIncident(incident);
      // You can add additional logic here, like showing a modal with incident details
      console.log('Selected incident:', incident);
    } else {
      console.error('Incident not found:', incidentId);
    }
  };
  
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
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full p-4 sm:p-6">
        {/* Header */}
        <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="w-full px-4 py-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
                <Button variant="outline" size="sm" onClick={onLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 space-y-6">
        {/* Real-time Incident Detection */}
        {/* Main Statistics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incident Status Overview */}
          <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Activity className="h-5 w-5 text-blue-600" />
                Incident Status
              </CardTitle>
              <p className="text-sm text-gray-500">Real-time incident monitoring and statistics</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {/* Under Investigation */}
                <Card className="p-4 bg-blue-50 hover:bg-blue-100 transition-colors">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-1 mb-1">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <p className="text-xs font-medium text-blue-700">Under Investigation</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-900">{underInvestigation.length}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {incidents.length > 0 
                        ? `${Math.round((underInvestigation.length / incidents.length) * 100)}% of total`
                        : 'No active incidents'}
                    </p>
                  </div>
                </Card>

                {/* Total Open Incidents */}
                <Card className="p-4 bg-amber-50 hover:bg-amber-100 transition-colors">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-1 mb-1">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <p className="text-xs font-medium text-amber-700">Total Open</p>
                    </div>
                    <p className="text-3xl font-bold text-amber-900">{totalOpenIncidents}</p>
                    <p className="text-xs text-amber-600 mt-1">
                      {incidents.length > 0 
                        ? `${Math.round((totalOpenIncidents / incidents.length) * 100)}% of total`
                        : 'No incidents'}
                    </p>
                  </div>
                </Card>

                {/* All Incidents */}
                <Card className="p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-1 mb-1">
                      <List className="h-4 w-4 text-gray-600" />
                      <p className="text-xs font-medium text-gray-700">All Incidents</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{incidents.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Total recorded</p>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Incident Resolution */}
          <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Incident Resolution
              </CardTitle>
              <p className="text-sm text-gray-500">Resolution metrics and analysis</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {/* Total Closed Incidents */}
                <Card className="p-4 bg-green-50 hover:bg-green-100 transition-colors">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-1 mb-1">
                      <Check className="h-4 w-4 text-green-600" />
                      <p className="text-xs font-medium text-green-700">Resolved</p>
                    </div>
                    <p className="text-3xl font-bold text-green-900">{totalClosedIncidents}</p>
                    <p className="text-xs text-green-600 mt-1">
                      {incidents.length > 0 
                        ? `${Math.round((totalClosedIncidents / incidents.length) * 100)}% of total`
                        : 'No resolved incidents'}
                    </p>
                  </div>
                </Card>

                {/* Completion Rate */}
                <Card className="p-4 bg-purple-50 hover:bg-purple-100 transition-colors">
                  <div className="flex flex-col items-center h-full">
                    <div className="text-center">
                      <div className="inline-flex items-center gap-1 mb-1">
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                        <p className="text-xs font-medium text-purple-700">Completion</p>
                      </div>
                      <div className="relative w-16 h-16 mx-auto mb-2">
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
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-purple-900">
                            {completionRate}/10
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-purple-600">
                        {completionRate >= 8 ? 'Excellent' : 
                         completionRate >= 6 ? 'Good' : 
                         completionRate >= 4 ? 'Average' : 'Needs Improvement'}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* False Positives */}
                <Card className="p-4 bg-red-50 hover:bg-red-100 transition-colors">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-1 mb-1">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <p className="text-xs font-medium text-red-700">False Positives</p>
                    </div>
                    <p className="text-3xl font-bold text-red-900">{totalFalsePositive}</p>
                    <p className="text-xs text-red-600 mt-1">
                      {incidents.length > 0 
                        ? `${Math.round((totalFalsePositive / incidents.length) * 100)}% of total`
                        : 'No false positives'}
                    </p>
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
              <div className="grid grid-cols-3 gap-6">
                {/* Pie Chart */}
                <div className="w-48 h-48">
                  <ChartContainer
                    config={{ value: { label: "Incidents", color: "#3b82f6" } }}
                    className="h-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={incidentsByEventSource}
                          dataKey="value"
                          cx="30%"
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
                  </ChartContainer>
                </div>
                {/* Table */}
                <div className="flex-1 col-span-2">
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
            <div className="grid grid-cols-3 gap-6">
                {/* Pie Chart */}
                <div className="w-48 h-48">
                  <ChartContainer
                    config={{ value: { label: "Incidents", color: "#3b82f6" } }}
                    className="h-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={incidentsBySeverity.filter(item => item.value > 0)}
                          dataKey="value"
                          cx="30%"
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
                  </ChartContainer>
                </div>
                {/* Table */}
                <div className="flex-1 col-span-2">
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
              <CardTitle>Threat SLA Performance</CardTitle>
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

        </div>

        {/* Attack Analysis Section */}
        
      </div>
    </div>
  );
};