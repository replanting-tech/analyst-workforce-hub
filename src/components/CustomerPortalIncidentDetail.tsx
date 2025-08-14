
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertTriangle, Clock, Building2, User, FileText, Check, X } from 'lucide-react';
import { useIncidentById } from '@/hooks/useIncidents';
import { StatusWorkflowDropdown } from './StatusWorkflowDropdown';
import RichTextEditor from './RichTextEditor';
import { useRequestChanges, useUpdateRequestChangeStatus } from '@/hooks/useRequestChanges';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface CustomerPortalIncidentDetailProps {
  incidentId: string;
  onBack: () => void;
}

export function CustomerPortalIncidentDetail({ incidentId, onBack }: CustomerPortalIncidentDetailProps) {
  const { data: incident, isLoading, error } = useIncidentById(incidentId);
  const { data: requestChanges = [], isLoading: isLoadingRequestChanges } = useRequestChanges(incident?.incident_number);
  const updateRequestStatus = useUpdateRequestChangeStatus();
  const { toast } = useToast();

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateRequestStatus.mutateAsync({ id, status });
      toast({
        title: 'Success',
        description: `Request has been ${status} successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update request status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Very High': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  const formatRawLogs = (rawLogs: string) => {
    try {
      const parsed = JSON.parse(rawLogs);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return rawLogs;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cases
        </Button>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cases
        </Button>
        <div className="text-center text-red-600">
          <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-medium">Error loading incident details</h3>
          <p className="text-sm">Incident not found or failed to load</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cases
        </Button>
        <Badge className={getPriorityColor(incident.priority)}>
          {incident.priority} Priority
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Incident #{incident.incident_number}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor incident={incident} />
              <div className="space-y-4 mt-5">
                <CardHeader>
                  <CardTitle>Raw Logs</CardTitle>
                </CardHeader>
                {incident.raw_logs ? (
                  <CardContent>
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-auto max-h-128">
                      <pre className="whitespace-pre-wrap">
                        {formatRawLogs(incident.raw_logs)}
                      </pre>
                    </div>
                  </CardContent>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <FileText className="mx-auto h-12 w-12 mb-4" />
                    <p>No raw logs available for this incident</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Entities */}
          {incident.entities && incident.entities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Affected Entities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {incident.entities.map((entityStr, index) => {
                    try {
                      const entity = JSON.parse(entityStr);
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">{entity.kind}</p>
                            <p className="text-sm text-muted-foreground">
                              {entity.properties?.friendlyName || entity.properties?.hashValue || entity.properties?.fileName || 'N/A'}
                            </p>
                          </div>
                          <Badge variant="outline">{entity.kind}</Badge>
                        </div>
                      );
                    } catch {
                      return (
                        <div key={index} className="p-3 bg-muted rounded-lg">
                          <p className="text-sm">{entityStr}</p>
                        </div>
                      );
                    }
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="w-5 h-5" />
                Ticket Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <Button className={"w-full " + getPriorityColor(incident.priority)} variant="outline">
                  {incident.priority}
                </Button>
  
                <StatusWorkflowDropdown 
                  currentStatus={incident.status}
                  incidentId={incident.incident_id}
                  // onStatusChange={setCurrentStatus}
                />
              </div>
              <div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-sm">{formatDateTime(incident.creation_time)}</p>
                </div>

                {incident.closed_time && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Closed</p>
                    <p className="text-sm">{formatDateTime(incident.closed_time)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>


          {/* Required Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5" />
                Required Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingRequestChanges ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : requestChanges.length > 0 ? (
                <div className="space-y-4">
                  {requestChanges.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Change Request</p>
                          <p className="text-sm text-muted-foreground">
                            Requested by: {request.analyst_name || 'Unknown'}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {request.status}
                        </Badge>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-sm font-medium">Assets:</p>
                        <p className="text-sm">{request.assets || 'No assets specified'}</p>
                      </div>
                      
                      {request.status === 'waiting for approval' && (
                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="gap-1"
                            onClick={() => handleStatusUpdate(request.id, 'approved')}
                            disabled={updateRequestStatus.isPending}
                          >
                            <Check className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="gap-1"
                            onClick={() => handleStatusUpdate(request.id, 'rejected')}
                            disabled={updateRequestStatus.isPending}
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No pending actions required.
                </p>
              )}
            </CardContent>
          </Card>

          {/* SLA Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5" />
                SLA Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">SLA Status</p>
                <Badge 
                  className={
                    incident.sla_status === "breach" ? "bg-red-100 text-red-800" :
                    incident.sla_status === "met" ? "bg-green-100 text-green-800" :
                    "bg-blue-100 text-blue-800"
                  }
                >
                  {incident.sla_status}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolution SLA</p>
                <p className="text-sm">{incident.resolution_minutes} minutes</p>
              </div>

              {incident.sla_target_time && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">SLA Target</p>
                  <p className="text-sm">{formatDateTime(incident.sla_target_time)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer</p>
                <p className="text-sm font-medium">{incident.customer_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Workspace</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {incident.workspace_name}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}