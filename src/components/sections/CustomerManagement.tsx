
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Building2, Search, Plus, Edit, Globe, AlertTriangle, CheckCircle } from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import { useIncidents } from '@/hooks/useIncidents';
import { useSLADashboard } from '@/hooks/useSLADashboard';

export function CustomerManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: customers = [], isLoading: customersLoading } = useCustomers();
  const { data: incidents = [], isLoading: incidentsLoading } = useIncidents();
  const { data: slaDashboard = [], isLoading: slaLoading } = useSLADashboard();

  const filteredCustomers = customers.filter(customer =>
    customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.workspace_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate customer stats
  const getCustomerStats = (customerId: string, customerName: string) => {
    const customerIncidents = incidents.filter(i => i.customer_name === customerName);
    const activeIncidents = customerIncidents.filter(i => i.status === 'active').length;
    const totalIncidents = customerIncidents.length;
    
    // Get SLA compliance from dashboard
    const slaData = slaDashboard.filter(s => s.customer_name === customerName);
    const avgCompliance = slaData.length > 0 
      ? slaData.reduce((acc, s) => acc + s.sla_compliance_percentage, 0) / slaData.length
      : 0;

    return {
      activeIncidents,
      totalIncidents,
      slaCompliance: avgCompliance
    };
  };

  // Calculate totals
  const totalCustomers = customers.length;
  const totalIncidents = incidents.length;
  const avgSLACompliance = slaDashboard.length > 0 
    ? slaDashboard.reduce((acc, s) => acc + s.sla_compliance_percentage, 0) / slaDashboard.length
    : 0;

  const getSLAColor = (compliance: number) => {
    if (compliance >= 95) return 'text-green-600 bg-green-100';
    if (compliance >= 90) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getTimezoneRegion = (timezone: string) => {
    if (timezone.includes('America')) return 'North America';
    if (timezone.includes('Europe')) return 'Europe';
    if (timezone.includes('Asia')) return 'Asia Pacific';
    return 'Other';
  };

  // Group customers by region
  const regionStats = customers.reduce((acc, customer) => {
    const region = getTimezoneRegion(customer.timezone);
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (customersLoading || incidentsLoading || slaLoading) {
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
          <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
          <p className="text-gray-600">Manage customer accounts and configurations</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-blue-600">{totalCustomers}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Workspaces</p>
                <p className="text-2xl font-bold text-green-600">{totalCustomers}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Incidents</p>
                <p className="text-2xl font-bold text-orange-600">{totalIncidents}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg SLA Compliance</p>
                <p className="text-2xl font-bold text-green-600">{avgSLACompliance.toFixed(1)}%</p>
              </div>
              <Globe className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Customer Overview</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Timezone</TableHead>
                  <TableHead>Active Incidents</TableHead>
                  <TableHead>Total Incidents</TableHead>
                  <TableHead>SLA Compliance</TableHead>
                  <TableHead>Member Since</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => {
                  const stats = getCustomerStats(customer.id, customer.customer_name);
                  return (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{customer.customer_name}</p>
                            <p className="text-xs text-gray-500">Enterprise</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {customer.workspace_name}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {customer.timezone}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          stats.activeIncidents > 0 ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {stats.activeIncidents}
                        </span>
                      </TableCell>
                      <TableCell>{stats.totalIncidents}</TableCell>
                      <TableCell>
                        <Badge className={getSLAColor(stats.slaCompliance)}>
                          {stats.slaCompliance.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(customer.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Customer Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
            <CardDescription>Customers by timezone/region</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(regionStats).map(([region, count]) => (
                <div key={region} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      region === 'North America' ? 'bg-blue-500' :
                      region === 'Europe' ? 'bg-green-500' :
                      region === 'Asia Pacific' ? 'bg-orange-500' : 'bg-gray-500'
                    }`}></div>
                    <span className="text-sm">{region}</span>
                  </div>
                  <span className="font-medium">{count} customers</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest customer-related activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {incidents.slice(0, 5).map((incident, index) => (
                <div key={incident.id} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    incident.status === 'active' ? 'bg-blue-500' :
                    incident.status === 'closed' ? 'bg-green-500' : 'bg-gray-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium">
                      {incident.status === 'active' ? 'New incident created' : 'Incident resolved'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {incident.customer_name} - {new Date(incident.creation_time).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
