
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
import { FileText, Search, Plus, Eye, Edit, ExternalLink, Hash, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRequestChanges } from '@/hooks/useRequestChanges';
import { useAuth } from '@/contexts/AuthContext';

export function RequestChanges() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
    const { role: userRole, analyst } = useAuth();
    const analystCode = analyst?.code || null;

  const { data: requestChanges = [], isLoading, error, refetch } = useRequestChanges(null, userRole, analystCode);

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

  const filteredRequests = requestChanges.filter(request => {
    const matchesSearch = request.incident_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.jira_ticket_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.analyst_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const activeRequests = requestChanges.filter(r => r.status === 'waiting for approval').length;
  const completedRequests = requestChanges.filter(r => r.status === 'approved').length;
  const approvedRequests = requestChanges.filter(r => r.status === 'approved').length;
  const rejectedRequests = requestChanges.filter(r => r.status === 'rejected').length;
  const totalIndicators = requestChanges.reduce((sum, request) => sum + request.indicators.length, 0);
  const pendingIndicators = requestChanges.reduce((sum, request) => 
    sum + request.indicators.filter(i => i.status === 'pending').length, 0
  );

  if (isLoading) {
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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center text-red-600">
          <FileText className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-medium">Error loading request changes</h3>
          <p className="text-sm">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Request Changes</h2>
          <p className="text-gray-600">Manage security remediation requests and indicators</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Request
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Requests</p>
                <p className="text-2xl font-bold text-blue-600">{activeRequests}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected Requests</p>
                <p className="text-2xl font-bold text-orange-600">{rejectedRequests}</p>
              </div>
              <Hash className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved Requests</p>
                <p className="text-2xl font-bold text-green-600">{approvedRequests}</p>
              </div>
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Requests</p>
                <p className="text-2xl font-bold text-purple-600">{completedRequests}</p>
              </div>
              <Hash className="w-8 h-8 text-purple-600" />
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
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.incident_number || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {request.jira_ticket_id ? (
                            <div className="flex items-center space-x-2">
                              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                                {request.jira_ticket_id}
                              </code>
                              <ExternalLink className="w-3 h-3 text-gray-400" />
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{request.analyst_name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{request.analyst_id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="text-sm truncate" title={request.assets || ''}>
                              {request.assets || 'N/A'}
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
                {filteredRequests.map((request) => 
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
                                from {request.incident_number || 'N/A'}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                                {indicator.value}
                              </p>
                              <p className="text-sm text-gray-600">{indicator.description}</p>
                              <p className="text-xs text-gray-500">
                                Requested by {request.analyst_name || 'Unknown'} • {formatDateTime(indicator.created_at)}
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
              {requestChanges.slice(0, 5).map((request, index) => (
                <div key={request.id} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    request.status === 'active' ? 'bg-blue-500' : 
                    request.status === 'completed' ? 'bg-green-500' : 'bg-gray-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium">
                      {request.status === 'active' ? 'Active request' : 
                       request.status === 'completed' ? 'Request completed' : 'Request updated'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {request.incident_number || 'N/A'} • {formatDateTime(request.created_at)}
                    </p>
                  </div>
                </div>
              ))}
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
              {(() => {
                const typeStats = requestChanges.reduce((acc, request) => {
                  request.indicators.forEach(indicator => {
                    acc[indicator.type] = (acc[indicator.type] || 0) + 1;
                  });
                  return acc;
                }, {} as Record<string, number>);

                const total = Object.values(typeStats).reduce((sum, count) => sum + count, 0);

                return Object.entries(typeStats).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getIndicatorTypeIcon(type)}
                      <span className="text-sm capitalize">{type}</span>
                    </div>
                    <span className="font-medium">
                      {total > 0 ? Math.round((count / total) * 100) : 0}%
                    </span>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
