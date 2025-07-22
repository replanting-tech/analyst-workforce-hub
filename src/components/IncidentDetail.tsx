
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIncidentById } from '@/hooks/useIncidents';
import { AlertTriangle, Clock, User, Building2, ExternalLink, Calendar, Target, FileText, AlertCircle, Database, Mail } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from './RichTextEditor';

interface IncidentDetailProps {
  incidentId: string;
}

export function IncidentDetail({ incidentId }: IncidentDetailProps) {
  const { data: incident, isLoading, error } = useIncidentById(incidentId);
  const [remainingTime, setRemainingTime] = useState<string>('');
  const [recommendationAnalysis, setRecommendationAnalysis] = useState<string>('');

  // Live countdown timer for SLA
  useEffect(() => {
    if (!incident || incident.status === 'closed' || !incident.sla_target_time) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = new Date(incident.sla_target_time).getTime();
      const difference = target - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setRemainingTime(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setRemainingTime('BREACHED');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [incident]);

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

  const formatRawLogs = (rawLogs: string) => {
    try {
      const parsed = JSON.parse(rawLogs);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return rawLogs;
    }
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Left Column - Main Content */}
      <div className="flex-1 space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Incident ID</p>
                <p className="font-mono text-sm">{incident.incident_id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Incident Number</p>
                <p className="font-mono text-sm">{incident.incident_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className={getStatusColor(incident.status)}>
                  {incident.status}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Priority</p>
                <Badge className={getPriorityColor(incident.priority)}>
                  {incident.priority}
                </Badge>
              </div>
              {incident.jira_ticket_id && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">JIRA Ticket</p>
                  <p className="font-mono text-sm">{incident.jira_ticket_id}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Customer Notification</p>
              <Badge variant={incident.customer_notification === 'confirmed_sent' ? 'default' : 'secondary'}>
                {incident.customer_notification}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* SLA Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5" />
              SLA Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">SLA Status</p>
                <Badge className={getSLAStatusColor(incident.sla_status, incident.sla_remaining_seconds)}>
                  {incident.sla_status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolution SLA</p>
                <p className="text-sm">{incident.resolution_minutes} minutes</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">SLA Target</p>
                <p className="text-sm">{incident.sla_target_time ? formatDateTime(incident.sla_target_time) : 'Not set'}</p>
              </div>
              {incident.status === 'active' && incident.sla_target_time && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Time Remaining</p>
                  <p className={`text-lg font-semibold ${remainingTime === 'BREACHED' ? 'text-red-600' : 'text-green-600'}`}>
                    {remainingTime}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
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

        {/* Assignment */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5" />
              Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Assigned Analyst</p>
              <p className="text-sm font-medium">{incident.analyst_name || 'Unassigned'}</p>
              {incident.analyst_code && (
                <p className="text-xs text-muted-foreground">Code: {incident.analyst_code}</p>
              )}
              {incident.analyst_email && (
                <div className="flex items-center gap-1 mt-1">
                  <Mail className="w-3 h-3" />
                  <p className="text-xs text-muted-foreground">{incident.analyst_email}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer</p>
                <p className="text-sm font-medium">{incident.customer_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Workspace</p>
                <p className="text-xs text-muted-foreground font-mono">{incident.workspace_name}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Customer ID</p>
              <p className="text-xs text-muted-foreground font-mono">{incident.customer_id}</p>
            </div>
          </CardContent>
        </Card>

        {/* Azure Sentinel Button */}
        {incident.incident_url && (
          <Card>
            <CardContent className="pt-6">
              <Button className="w-full" asChild>
                <a href={incident.incident_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View in Azure Sentinel
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recommendation Analysis */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recommendation Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <RichTextEditor
              value={recommendationAnalysis}
              onChange={setRecommendationAnalysis}
              placeholder="Enter your recommendation analysis..."
            />
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Raw Logs */}
      <div className="w-96">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Raw Logs</CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            {incident.raw_logs ? (
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-auto h-full">
                <pre className="whitespace-pre-wrap">{formatRawLogs(incident.raw_logs)}</pre>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="mx-auto h-12 w-12 mb-4" />
                <p>No raw logs available for this incident</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
