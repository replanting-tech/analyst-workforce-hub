
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
import { FileText, Search, Plus, Eye, Edit, ExternalLink, Hash } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function RequestChanges() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data - akan diganti dengan data dari Supabase
  const requestChanges = [
    {
      id: '1',
      incident_number: 'INC-2024-001',
      jira_ticket_id: 'JIRA-123',
      analyst_id: 'ANALYST001',
      analyst_name: 'John Doe',
      assets: 'web-server-01, database-02',
      status: 'active',
      created_at: '2024-01-15T10:30:00Z',
      indicators: [
        { id: '1', type: 'hash', value: 'a1b2c3d4e5f6', description: 'Malicious file hash', status: 'pending' },
        { id: '2', type: 'ip', value: '192.168.1.100', description: 'Suspicious IP address', status: 'pending' }
      ]
    },
    {
      id: '2',
      incident_number: 'INC-2024-002',
      jira_ticket_id: 'JIRA-124',
      analyst_id: 'ANALYST002',
      analyst_name: 'Jane Smith',
      assets: 'mail-server-01',
      status: 'active',
      created_at: '2024-01-15T11:45:00Z',
      indicators: [
        { id: '3', type: 'url', value: 'http://malicious-site.com', description: 'Phishing URL', status: 'pending' }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIndicatorTypeIcon = (type: string) => {
    switch (type) {
      case 'hash': return <Hash className="w-3 h-3" />;
      case 'ip': return <span className="w-3 h-3 text-xs font-mono">IP</span>;
      case 'url': return <ExternalLink className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Request Changes</h2>
          <p className="text-gray-600">Manage security remediation requests and indicators</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Request
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Requests</p>
                <p className="text-2xl font-bold text-blue-600">8</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Indicators</p>
                <p className="text-2xl font-bold text-orange-600">15</p>
              </div>
              <Hash className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-green-600">5</p>
              </div>
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-purple-600">2.3h</p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Change Requests Overview</CardTitle>
            <div className="flex gap-4 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="requests" className="w-full">
            <TabsList>
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="indicators">Indicators</TabsTrigger>
            </TabsList>
            
            <TabsContent value="requests" className="mt-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Incident</TableHead>
                      <TableHead>JIRA Ticket</TableHead>
                      <TableHead>Analyst</TableHead>
                      <TableHead>Assets</TableHead>
                      <TableHead>Indicators</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requestChanges.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.incident_number}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                              {request.jira_ticket_id}
                            </code>
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{request.analyst_name}</p>
                            <p className="text-xs text-gray-500">{request.analyst_id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="text-sm truncate" title={request.assets}>
                              {request.assets}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {request.indicators.length} indicators
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(request.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="indicators" className="mt-4">
              <div className="space-y-4">
                {requestChanges.map((request) => 
                  request.indicators.map((indicator) => (
                    <Card key={indicator.id} className="border-l-4 border-l-orange-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {getIndicatorTypeIcon(indicator.type)}
                              <Badge variant="outline" className="uppercase text-xs">
                                {indicator.type}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                from {request.incident_number}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                                {indicator.value}
                              </p>
                              <p className="text-sm text-gray-600">{indicator.description}</p>
                              <p className="text-xs text-gray-500">
                                Requested by {request.analyst_name} • {formatDateTime(request.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(indicator.status)}>
                              {indicator.status}
                            </Badge>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest change request activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">New change request created</p>
                  <p className="text-xs text-gray-500">INC-2024-003 • 10 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Indicators processed</p>
                  <p className="text-xs text-gray-500">5 IOCs blocked • 1 hour ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Request completed</p>
                  <p className="text-xs text-gray-500">JIRA-122 • 2 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Indicator Types Distribution</CardTitle>
            <CardDescription>Breakdown of IOC types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Hash className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">File Hashes</span>
                </div>
                <span className="font-medium">42%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-4 text-green-500 text-xs font-mono">IP</span>
                  <span className="text-sm">IP Addresses</span>
                </div>
                <span className="font-medium">28%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ExternalLink className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">URLs/Domains</span>
                </div>
                <span className="font-medium">23%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">Other</span>
                </div>
                <span className="font-medium">7%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
