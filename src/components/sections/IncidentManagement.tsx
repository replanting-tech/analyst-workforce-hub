
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
import { AlertTriangle, Search, Filter, Plus, Eye, Edit, Clock, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIncidents } from '@/hooks/useIncidents';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { IncidentDetail } from '@/components/IncidentDetail';

export function IncidentManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  
  const { data: incidents = [], isLoading, error } = useIncidents();

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.incident_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (incident.analyst_name && incident.analyst_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const activeIncidents = incidents.filter(i => i.status === 'active').length;
  const highPriorityIncidents = incidents.filter(i => i.priority === 'High' && i.status === 'active').length;
  const slaRiskIncidents = incidents.filter(i => i.sla_remaining_seconds > 0 && i.sla_remaining_seconds <= 900 && i.status === 'active').length;
  const resolvedToday = incidents.filter(i => {
    if (!i.closed_time) return false;
    const today = new Date().toDateString();
    return new Date(i.closed_time).toDateString() === today;
  }).length;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSLAStatusColor = (slaStatus: string, remainingSeconds: number) => {
    if (slaStatus === 'breach') return 'bg-red-100 text-red-800';
    if (remainingSeconds <= 900 && remainingSeconds > 0) return 'bg-orange-100 text-orange-800';
    if (slaStatus === 'met') return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
          <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-medium">Error loading incidents</h3>
          <p className="text-sm">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Incident Management</h2>
          <p className="text-gray-600">Monitor and manage security incidents</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Incident
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-blue-600">{activeIncidents}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600">{highPriorityIncidents}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">SLA Risk</p>
                <p className="text-2xl font-bold text-orange-600">{slaRiskIncidents}</p>
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
                <p className="text-2xl font-bold text-green-600">{resolvedToday}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 flex gap-4 items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search incidents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="kanban">Board View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="mt-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Incident ID</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Analyst</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>SLA Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>SLA Target</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIncidents.map((incident) => (
                      <TableRow key={incident.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{incident.incident_number}</p>
                            <p className="text-xs text-gray-500">{incident.incident_id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(incident.priority)}>
                            {incident.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{incident.customer_name}</TableCell>
                        <TableCell>{incident.analyst_name || 'Unassigned'}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(incident.status)}>
                            {incident.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge className={getSLAStatusColor(incident.sla_status, incident.sla_remaining_seconds)}>
                              {incident.sla_status}
                            </Badge>
                            {incident.status === 'active' && (
                              <p className="text-xs text-gray-500">{incident.sla_remaining_formatted}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDateTime(incident.creation_time)}</TableCell>
                        <TableCell>
                          {incident.sla_target_time && formatDateTime(incident.sla_target_time)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  onClick={() => setSelectedIncidentId(incident.incident_id)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Incident Details - {incident.incident_number}</DialogTitle>
                                </DialogHeader>
                                {selectedIncidentId && (
                                  <IncidentDetail incidentId={selectedIncidentId} />
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button variant="ghost">
                              <Edit className="w-4 h-4" />
                            </Button>
                            {incident.incident_url && (
                              <Button variant="ghost" asChild>
                                <a href={incident.incident_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="kanban" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Active</CardTitle>
                    <CardDescription>Currently being worked on</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredIncidents.filter(i => i.status === 'active').map((incident) => (
                        <Card key={incident.id} className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-medium text-sm">{incident.incident_number}</p>
                            <Badge className={getPriorityColor(incident.priority)}>
                              {incident.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{incident.customer_name}</p>
                          <p className="text-xs text-gray-500">Assigned: {incident.analyst_name || 'Unassigned'}</p>
                          <div className="mt-2">
                            <Badge className={getSLAStatusColor(incident.sla_status, incident.sla_remaining_seconds)}>
                              {incident.sla_remaining_formatted}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">In Review</CardTitle>
                    <CardDescription>Awaiting verification</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-gray-500 py-8">
                      No incidents in review
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resolved</CardTitle>
                    <CardDescription>Completed incidents</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredIncidents.filter(i => i.status === 'closed').slice(0, 5).map((incident) => (
                        <Card key={incident.id} className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-medium text-sm">{incident.incident_number}</p>
                            <Badge className={getPriorityColor(incident.priority)}>
                              {incident.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{incident.customer_name}</p>
                          <p className="text-xs text-gray-500">
                            Resolved: {incident.closed_time && formatDateTime(incident.closed_time)}
                          </p>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
