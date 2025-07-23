
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIncidents } from '@/hooks/useIncidents';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Search, Filter, ExternalLink, Clock, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { usePagination } from '@/hooks/usePagination';
import { PaginationComponent } from '@/components/PaginationComponent';
import { Incident } from '@/hooks/useIncidents';
import { useToast } from '@/hooks/use-toast';

interface IncidentWithCountdown extends Incident {
  liveCountdown: string;
  isNearBreach: boolean;
  priorityWeight: number;
}

export function IncidentManagement() {
  const { data: incidents, isLoading, error } = useIncidents();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [slaStatusFilter, setSlaStatusFilter] = useState('ongoing'); // Default to ongoing
  const [processedIncidents, setProcessedIncidents] = useState<IncidentWithCountdown[]>([]);

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
      
      const processed: IncidentWithCountdown[] = incidents.map(incident => {
        let liveCountdown = '';
        let isNearBreach = false;

        if (incident.status === 'active' && incident.sla_target_time) {
          const target = new Date(incident.sla_target_time).getTime();
          const difference = target - now;

          if (difference > 0) {
            const hours = Math.floor(difference / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);
            liveCountdown = `${hours}h ${minutes}m ${seconds}s`;
            
            // Mark as near breach if less than 15 minutes remaining
            isNearBreach = difference <= 900000; // 15 minutes in milliseconds
          } else {
            liveCountdown = 'BREACHED';
            isNearBreach = true;
          }
        } else if (incident.status === 'closed') {
          liveCountdown = 'Closed';
        } else {
          liveCountdown = 'N/A';
        }

        return {
          ...incident,
          liveCountdown,
          isNearBreach,
          priorityWeight: getPriorityWeight(incident.priority)
        };
      });

      // Sort incidents: breached first, then by time remaining (ascending), then by priority (descending)
      processed.sort((a, b) => {
        // First, prioritize active incidents
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;

        // For active incidents, sort by SLA status and remaining time
        if (a.status === 'active' && b.status === 'active') {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSLAStatusColor = (slaStatus: string, remainingSeconds: number, liveCountdown: string) => {
    if (slaStatus === 'breach' || liveCountdown === 'BREACHED') return 'bg-red-100 text-red-800';
    if (remainingSeconds <= 900 && remainingSeconds > 0) return 'bg-orange-100 text-orange-800';
    if (slaStatus === 'met') return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getCountdownColor = (liveCountdown: string, isNearBreach: boolean, status: string) => {
    if (status !== 'active') return 'text-muted-foreground';
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
        <div>
          <h2 className="text-3xl font-bold text-foreground">Incident Management</h2>
          <p className="text-muted-foreground">Monitor and manage security incidents</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            {filteredIncidents.length} Total Incidents
          </Badge>
        </div>
      </div>

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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
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
          <CardDescription>Real-time incident tracking and management</CardDescription>
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
                  <TableRow key={incident.incident_id} className={incident.isNearBreach && incident.status === 'active' ? 'bg-red-50' : ''}>
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
                      <Badge className={getStatusColor(incident.status)}>
                        {incident.status}
                      </Badge>
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
