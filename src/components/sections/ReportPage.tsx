
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  BarChart3,
  Download,
  Calendar,
  Filter
} from 'lucide-react';
import { useSLADashboard } from '@/hooks/useSLADashboard';
import { useIncidents } from '@/hooks/useIncidents';
import { useAnalysts } from '@/hooks/useAnalysts';
import { useCustomers } from '@/hooks/useCustomers';

export function ReportPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSLAStatus, setSelectedSLAStatus] = useState('all');

  const { data: slaData = [], isLoading: slaLoading } = useSLADashboard();
  const { data: incidents = [], isLoading: incidentsLoading } = useIncidents();
  const { data: analysts = [], isLoading: analystsLoading } = useAnalysts();
  const { data: customers = [], isLoading: customersLoading } = useCustomers();

  // Filter incidents based on selected filters
  const filteredIncidents = incidents.filter(incident => {
    const matchesCustomer = selectedCustomer === 'all' || incident.customer_name === selectedCustomer;
    const matchesPriority = selectedPriority === 'all' || incident.priority === selectedPriority;
    const matchesStatus = selectedStatus === 'all' || incident.status === selectedStatus;
    const matchesSLAStatus = selectedSLAStatus === 'all' || incident.sla_status === selectedSLAStatus;
    
    return matchesCustomer && matchesPriority && matchesStatus && matchesSLAStatus;
  });

  // Calculate SLA statistics by customer
  const slaByCustomer = slaData.map(item => ({
    customer: item.customer_name,
    workspace: item.workspace_name,
    priority: item.priority,
    total: item.total_incidents,
    met: item.sla_met,
    breach: item.sla_breach,
    ongoing: item.sla_ongoing,
    compliance: item.sla_compliance_percentage
  }));

  // Calculate incident statistics
  const incidentStats = {
    total: filteredIncidents.length,
    byPriority: filteredIncidents.reduce((acc, inc) => {
      acc[inc.priority] = (acc[inc.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byStatus: filteredIncidents.reduce((acc, inc) => {
      acc[inc.status] = (acc[inc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    bySLAStatus: filteredIncidents.reduce((acc, inc) => {
      acc[inc.sla_status] = (acc[inc.sla_status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byCustomer: filteredIncidents.reduce((acc, inc) => {
      acc[inc.customer_name] = (acc[inc.customer_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  // Calculate analyst performance metrics
  const analystPerformance = analysts.map(analyst => {
    const analystIncidents = incidents.filter(inc => inc.analyst_name === analyst.name);
    const totalIncidents = analystIncidents.length;
    const closedIncidents = analystIncidents.filter(inc => inc.status === 'closed').length;
    const slaMetIncidents = analystIncidents.filter(inc => inc.sla_status === 'met').length;
    
    return {
      name: analyst.name,
      code: analyst.code,
      email: analyst.email,
      availability: analyst.availability,
      currentActive: analyst.current_active_incidents,
      todayTotal: analyst.today_total_incidents,
      todayClosed: analyst.today_closed_incidents,
      totalIncidents,
      closedIncidents,
      slaMetIncidents,
      resolutionRate: totalIncidents > 0 ? Math.round((closedIncidents / totalIncidents) * 100) : 0,
      slaCompliance: totalIncidents > 0 ? Math.round((slaMetIncidents / totalIncidents) * 100) : 0,
      efficiency: analyst.today_total_incidents > 0 ? Math.round((analyst.today_closed_incidents / analyst.today_total_incidents) * 100) : 0
    };
  });

  // Chart data preparations
  const priorityChartData = Object.entries(incidentStats.byPriority).map(([priority, count]) => ({
    priority,
    count
  }));

  const statusChartData = Object.entries(incidentStats.byStatus).map(([status, count]) => ({
    status,
    count
  }));

  const slaChartData = Object.entries(incidentStats.bySLAStatus).map(([status, count]) => ({
    status,
    count
  }));

  const customerChartData = Object.entries(incidentStats.byCustomer).map(([customer, count]) => ({
    customer,
    count
  })).slice(0, 10); // Top 10 customers

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const getSLAColor = (percentage: number) => {
    if (percentage >= 95) return 'text-green-600 bg-green-100';
    if (percentage >= 90) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-orange-100 text-orange-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (slaLoading || incidentsLoading || analystsLoading || customersLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600">Comprehensive reports and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="range">Date Range</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger>
                <SelectValue placeholder="Customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.customer_name}>
                    {customer.customer_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedSLAStatus} onValueChange={setSelectedSLAStatus}>
              <SelectTrigger>
                <SelectValue placeholder="SLA Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SLA Status</SelectItem>
                <SelectItem value="met">Met</SelectItem>
                <SelectItem value="breach">Breach</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Date Range
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="sla" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sla">SLA Reports</TabsTrigger>
          <TabsTrigger value="incidents">Incident Reports</TabsTrigger>
          <TabsTrigger value="analysts">Analyst Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="sla" className="space-y-6">
          {/* SLA Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Incidents</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {slaData.reduce((acc, item) => acc + item.total_incidents, 0)}
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">SLA Met</p>
                    <p className="text-2xl font-bold text-green-600">
                      {slaData.reduce((acc, item) => acc + item.sla_met, 0)}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">SLA Breach</p>
                    <p className="text-2xl font-bold text-red-600">
                      {slaData.reduce((acc, item) => acc + item.sla_breach, 0)}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Compliance</p>
                    <p className="text-2xl font-bold text-green-600">
                      {slaData.length > 0 ? (slaData.reduce((acc, item) => acc + item.sla_compliance_percentage, 0) / slaData.length).toFixed(1) : 0}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SLA by Customer Table */}
          <Card>
            <CardHeader>
              <CardTitle>SLA Performance by Customer</CardTitle>
              <CardDescription>Detailed SLA metrics for each customer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Workspace</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Met</TableHead>
                      <TableHead>Breach</TableHead>
                      <TableHead>Ongoing</TableHead>
                      <TableHead>Compliance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slaByCustomer.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.customer}</TableCell>
                        <TableCell>
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {item.workspace}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.priority === 'Critical' ? 'destructive' : 'outline'}>
                            {item.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.total}</TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">{item.met}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-red-600 font-medium">{item.breach}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-blue-600 font-medium">{item.ongoing}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSLAColor(item.compliance)}>
                            {item.compliance.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6">
          {/* Incident Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Incidents</p>
                    <p className="text-2xl font-bold text-blue-600">{incidentStats.total}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {incidentStats.byStatus.active || 0}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Closed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {incidentStats.byStatus.closed || 0}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">SLA Breach</p>
                    <p className="text-2xl font-bold text-red-600">
                      {incidentStats.bySLAStatus.breach || 0}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Incidents by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={priorityChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="priority" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SLA Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={slaChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, value }) => `${status}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {slaChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 10 Customers by Incidents</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={customerChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="customer" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Incident Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, value }) => `${status}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysts" className="space-y-6">
          {/* Analyst Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Analysts</p>
                    <p className="text-2xl font-bold text-blue-600">{analysts.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Available</p>
                    <p className="text-2xl font-bold text-green-600">
                      {analysts.filter(a => a.availability === 'available').length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Cases</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {analysts.reduce((acc, a) => acc + a.current_active_incidents, 0)}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Resolved Today</p>
                    <p className="text-2xl font-bold text-green-600">
                      {analysts.reduce((acc, a) => acc + a.today_closed_incidents, 0)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analyst Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Analyst Performance Metrics</CardTitle>
              <CardDescription>Key performance indicators for each analyst</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Analyst</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Current Load</TableHead>
                      <TableHead>Today's Cases</TableHead>
                      <TableHead>Resolved Today</TableHead>
                      <TableHead>Total Cases</TableHead>
                      <TableHead>Resolution Rate</TableHead>
                      <TableHead>SLA Compliance</TableHead>
                      <TableHead>Efficiency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analystPerformance.map((analyst) => (
                      <TableRow key={analyst.code}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{analyst.name}</p>
                            <p className="text-xs text-gray-500">{analyst.code}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getAvailabilityColor(analyst.availability)}>
                            {analyst.availability}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${
                            analyst.currentActive > 0 ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {analyst.currentActive}
                          </span>
                        </TableCell>
                        <TableCell>{analyst.todayTotal}</TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">{analyst.todayClosed}</span>
                        </TableCell>
                        <TableCell>{analyst.totalIncidents}</TableCell>
                        <TableCell>
                          <Badge className={analyst.resolutionRate >= 80 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                            {analyst.resolutionRate}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSLAColor(analyst.slaCompliance)}>
                            {analyst.slaCompliance}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={analyst.efficiency >= 70 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                            {analyst.efficiency}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
