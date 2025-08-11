
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIncidents } from '@/hooks/useIncidents';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Search, Filter, ExternalLink, Clock, Bell, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { usePagination } from '@/hooks/usePagination';
import { PaginationComponent } from '@/components/PaginationComponent';
import { Incident } from '@/hooks/useIncidents';
import { useToast } from '@/hooks/use-toast';
import { StatusWorkflowDropdown } from '@/components/StatusWorkflowDropdown';

interface IncidentWithCountdown extends Incident {
  liveCountdown: string;
  isNearBreach: boolean;
  priorityWeight: number;
  shouldShowSLAAlert: boolean;
}

interface SLABreachStats {
  threeMinutes: number;
  twoMinutes: number;
  oneMinute: number;
}

export function IncidentManagement() {
  const { data: incidents, isLoading, error } = useIncidents();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [slaStatusFilter, setSlaStatusFilter] = useState('ongoing');
  const [processedIncidents, setProcessedIncidents] = useState<IncidentWithCountdown[]>([]);
  const [slaBreachStats, setSlaBreachStats] = useState<SLABreachStats>({
    threeMinutes: 0,
    twoMinutes: 0,
    oneMinute: 0
  });
  const [sendingAlerts, setSendingAlerts] = useState<Set<string>>(new Set());

  // Enable realtime updates with custom notification handler
  useEffect(() => {
    const channel = supabase
      .channel('incidents-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'incidents'
        },
        (payload) => {
          console.log('New incident inserted:', payload);
          const incidentNumber = payload.new?.incident_number || 'Unknown';
          toast({
            title: "New Incident",
            description: `${incidentNumber} has been created`,
            action: (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(`/incident/${payload.new?.incident_id}`)}
              >
                <Bell className="w-4 h-4 mr-1" />
                View Details
              </Button>
            ),
            duration: 10000,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'incidents'
        },
        (payload) => {
          console.log('Incident updated:', payload);
          const incidentNumber = payload.new?.incident_number || 'Unknown';
          toast({
            title: "Incident Updated",
            description: `${incidentNumber} has been updated`,
            action: (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(`/incident/${payload.new?.incident_id}`)}
              >
                <Bell className="w-4 h-4 mr-1" />
                View Details
              </Button>
            ),
            duration: 10000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate, toast]);

  // Priority weights for sorting (higher = higher priority)
  const getPriorityWeight = (priority: string): number => {
    switch (priority) {
      case 'Very High': return 5;
      case 'High': return 4;
      case 'Medium': return 3;
      case 'Low': return 2;
      case 'Informational': return 1;
      default: return 0;
    }
  };

  // Calculate live countdown and process incidents
  useEffect(() => {
    if (!incidents) return;

    const updateCountdowns = () => {
      const now = new Date().getTime();
      let threeMinCount = 0;
      let twoMinCount = 0;
      let oneMinCount = 0;
      
      const processed: IncidentWithCountdown[] = incidents.map(incident => {
        let liveCountdown = '';
        let isNearBreach = false;
        let shouldShowSLAAlert = false;

        if ((incident.status === 'open' || incident.status === 'incident') && incident.sla_target_time) {
          const target = new Date(incident.sla_target_time).getTime();
          const difference = target - now;

          if (difference > 0) {
            const hours = Math.floor(difference / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);
            liveCountdown = `${hours}h ${minutes}m ${seconds}s`;
            
            // Count incidents for SLA breach warnings
            if (difference <= 180000) threeMinCount++; // 3 minutes
            if (difference <= 120000) twoMinCount++; // 2 minutes  
            if (difference <= 60000) oneMinCount++; // 1 minute
            
            // Show SLA alert button if within 3 minutes
            shouldShowSLAAlert = difference <= 180000; // 3 minutes
            
            // Mark as near breach if less than 15 minutes remaining
            isNearBreach = difference <= 900000; // 15 minutes in milliseconds
          } else {
            liveCountdown = 'BREACHED';
            isNearBreach = true;
            shouldShowSLAAlert = true; // Show alert button for breached incidents too
          }
        } else if (incident.status === 'incident_closed' || incident.status === 'false_positive_closed') {
          liveCountdown = 'Closed';
        } else {
          liveCountdown = 'N/A';
        }

        return {
          ...incident,
          liveCountdown,
          isNearBreach,
          shouldShowSLAAlert,
          priorityWeight: getPriorityWeight(incident.priority)
        };
      });

      // Update SLA breach stats
      setSlaBreachStats({
        threeMinutes: threeMinCount,
        twoMinutes: twoMinCount,
        oneMinute: oneMinCount
      });

      // Sort incidents: breached first, then by time remaining (ascending), then by priority (descending)
      processed.sort((a, b) => {
        // First, prioritize active incidents
        if ((a.status === 'open' || a.status === 'incident') && (b.status !== 'open' && b.status !== 'incident')) return -1;
        if ((a.status !== 'open' && a.status !== 'incident') && (b.status === 'open' || b.status === 'incident')) return 1;

        // For active incidents, sort by SLA status and remaining time
        if ((a.status === 'open' || a.status === 'incident') && (b.status === 'open' || b.status === 'incident')) {
          // Breached incidents first
          if (a.sla_status === 'breach' && b.sla_status !== 'breach') return -1;
          if (a.sla_status !== 'breach' && b.sla_status === 'breach') return 1;

          // If both breached or both not breached, sort by remaining seconds
          if (a.sla_remaining_seconds !== b.sla_remaining_seconds) {
            return a.sla_remaining_seconds - b.sla_remaining_seconds;
          }

          // If same remaining time, sort by priority
          return b.priorityWeight - a.priorityWeight;
        }

        // For closed incidents, sort by creation time (newest first)
        return new Date(b.creation_time).getTime() - new Date(a.creation_time).getTime();
      });

      setProcessedIncidents(processed);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);

    return () => clearInterval(interval);
  }, [incidents]);

  // Send SLA alert for specific incident
  const sendSLAAlertForIncident = async (incidentId: string) => {
    setSendingAlerts(prev => new Set(prev).add(incidentId));
    
    try {
      const { error } = await supabase.functions.invoke('send-alert-3-minutes-sla', {
        body: { 
          name: 'SLA Alert System',
          incident_id: incidentId
        }
      });

      if (error) {
        console.error('Error sending SLA alert:', error);
        toast({
          title: "Error",
          description: "Failed to send SLA alert",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "SLA alert sent successfully",
        });
      }
    } catch (error) {
      console.error('Error sending SLA alert:', error);
      toast({
        title: "Error",
        description: "Failed to send SLA alert",
        variant: "destructive",
      });
    } finally {
      setSendingAlerts(prev => {
        const newSet = new Set(prev);
        newSet.delete(incidentId);
        return newSet;
      });
    }
  };

  // Send SLA alert for all incidents
  const sendSLAAlert = async () => {
    try {
      const { error } = await supabase.functions.invoke('send-alert-3-minutes-sla', {
        body: { name: 'SLA Alert System' }
      });

      if (error) {
        console.error('Error sending SLA alert:', error);
        toast({
          title: "Error",
          description: "Failed to send SLA alert",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "SLA alert sent successfully",
        });
      }
    } catch (error) {
      console.error('Error sending SLA alert:', error);
      toast({
        title: "Error",
        description: "Failed to send SLA alert",
        variant: "destructive",
      });
    }
  };

  // Filter incidents based on search and filters
  const filteredIncidents = processedIncidents.filter(incident => {
    const matchesSearch = incident.incident_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.analyst_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || incident.priority === priorityFilter;
    const matchesSlaStatus = slaStatusFilter === 'all' || incident.sla_status === slaStatusFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesSlaStatus;
  });

  const {
    currentPage,
    totalPages,
    paginatedData: paginatedIncidents,
    goToPage
  } = usePagination(filteredIncidents, 10);

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

  const getSLAStatusColor = (slaStatus: string, remainingSeconds: number, liveCountdown: string) => {
    if (slaStatus === 'breach' || liveCountdown === 'BREACHED') return 'bg-red-100 text-red-800';
    if (remainingSeconds <= 900 && remainingSeconds > 0) return 'bg-orange-100 text-orange-800';
    if (slaStatus === 'met') return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getCountdownColor = (liveCountdown: string, isNearBreach: boolean, status: string) => {
    if (status !== 'open' && status !== 'incident') return 'text-muted-foreground';
    if (liveCountdown === 'BREACHED') return 'text-red-600 font-bold';
    if (isNearBreach) return 'text-orange-600 font-semibold';
    return 'text-green-600';
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
        <h3 className="text-lg font-medium">Error loading incidents</h3>
        <p className="text-sm">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            {filteredIncidents.length} Total Incidents
          </Badge>
        </div>
      </div>

      {/* SLA Breach Warning Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            SLA Breach Warnings
          </CardTitle>
          <CardDescription>
            Monitor incidents approaching SLA breach and send alerts to analysts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div>
                <p className="text-sm font-medium text-yellow-800">≤ 3 Minutes</p>
                <p className="text-2xl font-bold text-yellow-900">{slaBreachStats.threeMinutes}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div>
                <p className="text-sm font-medium text-orange-800">≤ 2 Minutes</p>
                <p className="text-2xl font-bold text-orange-900">{slaBreachStats.twoMinutes}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
              <div>
                <p className="text-sm font-medium text-red-800">≤ 1 Minute</p>
                <p className="text-2xl font-bold text-red-900">{slaBreachStats.oneMinute}</p>
              </div>
              <Clock className="w-8 h-8 text-red-600" />
            </div>
            <div className="flex items-center justify-center">
              <Button 
                onClick={sendSLAAlert}
                className="w-full"
                variant={slaBreachStats.threeMinutes > 0 ? "destructive" : "outline"}
              >
                <Bell className="w-4 h-4 mr-2" />
                Send Bulk SLA Alert
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search incidents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="incident">Incident</SelectItem>
                <SelectItem value="incident_closed">Incident-Closed</SelectItem>
                <SelectItem value="false_positive_closed">False-Positive Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={slaStatusFilter} onValueChange={setSlaStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by SLA status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SLA Status</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="breach">Breach</SelectItem>
                <SelectItem value="met">Met</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="Very High">Very High</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Informational">Informational</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Incidents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Incidents</CardTitle>
          <CardDescription>Real-time incident tracking and management with workflow validation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Incident ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Analyst</TableHead>
                  <TableHead>SLA Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedIncidents.map((incident) => (
                  <TableRow key={incident.incident_id} className={incident.isNearBreach && (incident.status === 'open' || incident.status === 'incident') ? 'bg-red-50' : ''}>
                    <TableCell className="font-mono text-sm">
                      {incident.incident_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{incident.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{incident.workspace_name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(incident.priority)}>
                        {incident.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusWorkflowDropdown 
                        currentStatus={incident.status}
                        incidentId={incident.incident_id}
                      />
                    </TableCell>
                    <TableCell>
                      {incident.analyst_name ? (
                        <div>
                          <p className="font-medium">{incident.analyst_name}</p>
                          <p className="text-xs text-muted-foreground">{incident.analyst_code}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge className={getSLAStatusColor(incident.sla_status, incident.sla_remaining_seconds, incident.liveCountdown)}>
                          {incident.liveCountdown === 'BREACHED' ? 'breach' : incident.sla_status}
                        </Badge>
                        <div className={`flex items-center text-xs ${getCountdownColor(incident.liveCountdown, incident.isNearBreach, incident.status)}`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {incident.liveCountdown}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateTime(incident.creation_time)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/incident/${incident.incident_id}`}>
                            View Details
                          </Link>
                        </Button>
                        {incident.shouldShowSLAAlert && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => sendSLAAlertForIncident(incident.incident_id)}
                            disabled={sendingAlerts.has(incident.incident_id)}
                          >
                            {sendingAlerts.has(incident.incident_id) ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                            ) : (
                              <Bell className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                        {incident.incident_url && (
                          <Button variant="ghost" size="sm" asChild>
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
          
          {/* Pagination */}
          <div className="mt-6 flex justify-center">
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
