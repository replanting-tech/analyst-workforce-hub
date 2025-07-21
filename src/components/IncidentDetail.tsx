
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIncidentById } from '@/hooks/useIncidents';
import { AlertTriangle, Clock, User, Building2, ExternalLink, Calendar, Target, FileText, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface IncidentDetailProps {
  incidentId: string;
}

export function IncidentDetail({ incidentId }: IncidentDetailProps) {
  const { data: incident, isLoading, error } = useIncidentById(incidentId);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="text-center text-red-600">
        <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
        <h3 className="text-lg font-medium">Error loading incident details</h3>
        <p className="text-sm">Incident not found or failed to load</p>
      </div>
    );
  }

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
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Incident ID</p>
                <p className="font-mono text-sm">{incident.incident_id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Incident Number</p>
                <p className="font-mono text-sm">{incident.incident_number}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Priority</p>
                <Badge className={getPriorityColor(incident.priority)}>
                  {incident.priority}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <Badge className={getStatusColor(incident.status)}>
                  {incident.status}
                </Badge>
              </div>
            </div>

            {incident.jira_ticket_id && (
              <div>
                <p className="text-sm font-medium text-gray-600">JIRA Ticket</p>
                <p className="font-mono text-sm">{incident.jira_ticket_id}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              SLA Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">SLA Status</p>
              <Badge className={getSLAStatusColor(incident.sla_status, incident.sla_remaining_seconds)}>
                {incident.sla_status}
              </Badge>
            </div>
            
            {incident.status === 'active' && (
              <div>
                <p className="text-sm font-medium text-gray-600">Time Remaining</p>
                <p className="text-lg font-semibold">{incident.sla_remaining_formatted}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2">
              <div>
                <p className="text-sm font-medium text-gray-600">Created</p>
                <p className="text-sm">{formatDateTime(incident.creation_time)}</p>
              </div>
              {incident.sla_target_time && (
                <div>
                  <p className="text-sm font-medium text-gray-600">SLA Target</p>
                  <p className="text-sm">{formatDateTime(incident.sla_target_time)}</p>
                </div>
              )}
              {incident.closed_time && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Closed</p>
                  <p className="text-sm">{formatDateTime(incident.closed_time)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment and Customer Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Assigned Analyst</p>
              <p className="text-sm">{incident.analyst_name || 'Unassigned'}</p>
              {incident.analyst_code && (
                <p className="text-xs text-gray-500">Code: {incident.analyst_code}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Customer</p>
              <p className="text-sm">{incident.customer_name}</p>
              <p className="text-xs text-gray-500 font-mono">{incident.workspace_name}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-600">Customer Notification</p>
              <Badge variant={incident.customer_notification === 'confirmed_sent' ? 'default' : 'secondary'}>
                {incident.customer_notification}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="logs">Raw Logs</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Resolution SLA</h4>
                  <p className="text-sm text-gray-600">{incident.resolution_minutes} minutes</p>
                </div>
                
                {incident.incident_url && (
                  <div>
                    <h4 className="font-medium mb-2">External Links</h4>
                    <Button variant="outline" asChild>
                      <a href={incident.incident_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View in Azure Sentinel
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="logs" className="mt-4">
              <div className="space-y-4">
                {incident.raw_logs ? (
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre className="whitespace-pre-wrap">{incident.raw_logs}</pre>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <FileText className="mx-auto h-12 w-12 mb-4" />
                    <p>No raw logs available for this incident</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <div className="space-y-4">
                <div className="border-l-2 border-blue-200 pl-4 space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mt-1"></div>
                    <div>
                      <p className="text-sm font-medium">Incident Created</p>
                      <p className="text-xs text-gray-500">{formatDateTime(incident.creation_time)}</p>
                    </div>
                  </div>
                  
                  {incident.analyst_name && (
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
                      <div>
                        <p className="text-sm font-medium">Assigned to {incident.analyst_name}</p>
                        <p className="text-xs text-gray-500">Analyst assignment</p>
                      </div>
                    </div>
                  )}
                  
                  {incident.closed_time && (
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-gray-500 rounded-full mt-1"></div>
                      <div>
                        <p className="text-sm font-medium">Incident Closed</p>
                        <p className="text-xs text-gray-500">{formatDateTime(incident.closed_time)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
