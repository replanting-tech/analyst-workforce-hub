
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Target, Clock, AlertTriangle, Settings, Plus, Edit, Building2 } from 'lucide-react';

export function SLAConfiguration() {
  const [selectedCustomer, setSelectedCustomer] = useState('all');

  // Mock data - akan diganti dengan data dari Supabase
  const slaConfigs = [
    {
      id: '1',
      customer_name: 'ABC Corporation',
      workspace_name: 'abc-corp-workspace',
      priority: 'Very High',
      resolution_minutes: 60,
      created_at: '2024-01-10T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z'
    },
    {
      id: '2',
      customer_name: 'ABC Corporation',
      workspace_name: 'abc-corp-workspace',
      priority: 'High',
      resolution_minutes: 240,
      created_at: '2024-01-10T00:00:00Z',
      updated_at: '2024-01-10T00:00:00Z'
    },
    {
      id: '3',
      customer_name: 'XYZ Limited',
      workspace_name: 'xyz-ltd-workspace',
      priority: 'High',
      resolution_minutes: 480,
      created_at: '2024-01-08T00:00:00Z',
      updated_at: '2024-01-12T00:00:00Z'
    },
    {
      id: '4',
      customer_name: 'DEF Industries',
      workspace_name: 'def-inc-workspace',
      priority: 'Medium',
      resolution_minutes: 1440,
      created_at: '2024-01-05T00:00:00Z',
      updated_at: '2024-01-05T00:00:00Z'
    }
  ];

  const customers = [
    'ABC Corporation',
    'XYZ Limited',
    'DEF Industries'
  ];

  const priorities = [
    'Very High',
    'High', 
    'Medium',
    'Low',
    'Informational'
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Very High': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Informational': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatResolutionTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    } else {
      const days = Math.floor(minutes / 1440);
      const remainingHours = Math.floor((minutes % 1440) / 60);
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
  };

  const getResolutionTimeColor = (minutes: number) => {
    if (minutes <= 60) return 'text-red-600 bg-red-50';
    if (minutes <= 240) return 'text-orange-600 bg-orange-50';
    if (minutes <= 480) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SLA Configuration</h2>
          <p className="text-gray-600">Configure Service Level Agreement targets per customer and priority</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add SLA Config
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Configurations</p>
                <p className="text-2xl font-bold text-blue-600">24</p>
              </div>
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Customers Configured</p>
                <p className="text-2xl font-bold text-green-600">12</p>
              </div>
              <Building2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Resolution Time</p>
                <p className="text-2xl font-bold text-orange-600">6.2h</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical SLAs</p>
                <p className="text-2xl font-bold text-red-600">8</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SLA Configuration Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>SLA Configurations</CardTitle>
            <div className="flex gap-4 items-center">
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map(customer => (
                    <SelectItem key={customer} value={customer}>
                      {customer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <TableHead>Priority Level</TableHead>
                  <TableHead>Resolution Target</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slaConfigs
                  .filter(config => selectedCustomer === 'all' || config.customer_name === selectedCustomer)
                  .map((config) => (
                  <TableRow key={config.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <Building2 className="w-3 h-3 text-blue-600" />
                        </div>
                        <span className="font-medium">{config.customer_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {config.workspace_name}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(config.priority)}>
                        {config.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge className={getResolutionTimeColor(config.resolution_minutes)}>
                          {formatResolutionTime(config.resolution_minutes)}
                        </Badge>
                        <Clock className="w-4 h-4 text-gray-400" />
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(config.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          Configure
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

      {/* SLA Templates & Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5 text-blue-600" />
              SLA Templates
            </CardTitle>
            <CardDescription>Predefined SLA configurations for different service tiers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Enterprise Tier</h4>
                  <Badge variant="outline">Template</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Very High:</span>
                    <span className="font-medium">1 hour</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">High:</span>
                    <span className="font-medium">4 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Medium:</span>
                    <span className="font-medium">24 hours</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  Apply Template
                </Button>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Standard Tier</h4>
                  <Badge variant="outline">Template</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">High:</span>
                    <span className="font-medium">8 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Medium:</span>
                    <span className="font-medium">48 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Low:</span>
                    <span className="font-medium">72 hours</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  Apply Template
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-orange-600" />
              SLA Guidelines
            </CardTitle>
            <CardDescription>Best practices and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-1">Priority Definitions</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Very High: Critical business impact</li>
                  <li>• High: Significant business impact</li>
                  <li>• Medium: Moderate business impact</li>
                  <li>• Low: Minimal business impact</li>
                </ul>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-1">Recommended Targets</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Critical incidents: &lt; 1 hour</li>
                  <li>• High priority: &lt; 4 hours</li>
                  <li>• Standard incidents: &lt; 24 hours</li>
                  <li>• Consider timezone differences</li>
                </ul>
              </div>

              <div className="p-3 bg-orange-50 rounded-lg">
                <h4 className="font-medium text-orange-900 mb-1">Alert Thresholds</h4>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• Warning: 80% of SLA time elapsed</li>
                  <li>• Critical: 95% of SLA time elapsed</li>
                  <li>• Breach: SLA time exceeded</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
