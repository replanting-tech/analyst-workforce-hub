
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

export function CustomerManagement() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - akan diganti dengan data dari Supabase
  const customers = [
    {
      id: '1',
      workspace_name: 'abc-corp-workspace',
      customer_name: 'ABC Corporation',
      timezone: 'America/New_York',
      created_at: '2024-01-10T00:00:00Z',
      activeIncidents: 3,
      totalIncidents: 25,
      slaCompliance: 96.2
    },
    {
      id: '2',
      workspace_name: 'xyz-ltd-workspace',
      customer_name: 'XYZ Limited',
      timezone: 'Europe/London',
      created_at: '2024-01-08T00:00:00Z',
      activeIncidents: 1,
      totalIncidents: 18,
      slaCompliance: 88.9
    },
    {
      id: '3',
      workspace_name: 'def-inc-workspace',
      customer_name: 'DEF Industries',
      timezone: 'Asia/Tokyo',
      created_at: '2024-01-05T00:00:00Z',
      activeIncidents: 2,
      totalIncidents: 42,
      slaCompliance: 92.5
    }
  ];

  const getSLAColor = (compliance: number) => {
    if (compliance >= 95) return 'text-green-600 bg-green-100';
    if (compliance >= 90) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

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
                <p className="text-2xl font-bold text-blue-600">12</p>
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
                <p className="text-2xl font-bold text-green-600">12</p>
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
                <p className="text-2xl font-bold text-orange-600">85</p>
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
                <p className="text-2xl font-bold text-green-600">92.5%</p>
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
                {customers.map((customer) => (
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
                        customer.activeIncidents > 0 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {customer.activeIncidents}
                      </span>
                    </TableCell>
                    <TableCell>{customer.totalIncidents}</TableCell>
                    <TableCell>
                      <Badge className={getSLAColor(customer.slaCompliance)}>
                        {customer.slaCompliance}%
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
                ))}
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
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">North America</span>
                </div>
                <span className="font-medium">5 customers</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Europe</span>
                </div>
                <span className="font-medium">4 customers</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">Asia Pacific</span>
                </div>
                <span className="font-medium">3 customers</span>
              </div>
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
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">New incident created</p>
                  <p className="text-xs text-gray-500">ABC Corporation - 5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">SLA configuration updated</p>
                  <p className="text-xs text-gray-500">XYZ Limited - 1 hour ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Incident resolved</p>
                  <p className="text-xs text-gray-500">DEF Industries - 2 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
