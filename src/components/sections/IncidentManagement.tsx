import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIncidents } from '@/hooks/useIncidents';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, Search, Filter, ExternalLink, Clock, Bell, AlertCircle, CheckCircle2 } from 'lucide-react';
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

interface IncidentSummary {
  triage: number;
  warning: number;
  breached: number;
  escalated: number;
  open: number;
  closed: number;
}

export function IncidentManagement() {
  const { role: userRole, analyst } = useAuth();
  const analystCode = analyst?.code || null;
  const [analystFilter, setAnalystFilter] = useState('all'); // Move declaration here
  const [dateFilter, setDateFilter] = useState<string>(() => {
    // Set default to today's date
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  console.log('Analyst filter:', analystFilter);
  console.log('Date filter:', dateFilter);
  
  const { data: incidents, isLoading, error } = useIncidents({
    userRole,
    analystCode,
    analystFilter, // Pass the analystFilter state to the hook
    dateFilter // Pass the dateFilter state to the hook
  });
  
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
  const [availableAnalysts, setAvailableAnalysts] = useState<Array<{id: string, name: string, code: string}>>([]);
  const [incidentSummary, setIncidentSummary] = useState<IncidentSummary>({
    triage: 0,
    warning: 0,
    breached: 0,
    escalated: 0,
    open: 0,
    closed: 0,
  });

  // Fetch available analysts
  useEffect(() => {
    const fetchAnalysts = async () => {
      try {
        const { data, error } = await supabase
          .from('analysts')
          .select('id, name, code')
          .eq('availability', 'available')
          .order('name', { ascending: true });

        if (error) throw error;
        setAvailableAnalysts(data || []);
      } catch (error) {
        console.error('Error fetching analysts:', error);
        toast({
          title: "Error",
          description: "Failed to load analysts",
          variant: "destructive",
        });
      }
    };

    fetchAnalysts();
  }, []);

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

        if ((incident.status === 'active' || incident.status === 'incident') && incident.sla_target_time) {
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

      const filtered = processed.filter(incident => {
        const searchTermMatch = searchTerm.toLowerCase() === '' ||
          incident.incident_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          incident.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          incident.analyst_name?.toLowerCase().includes(searchTerm.toLowerCase());

        // Custom status matching logic
        let statusMatch = true;
        if (statusFilter === 'all') {
          statusMatch = true;
        } else if (statusFilter === 'triage') {
          // Triage: status != closed and analyst_name != null and sla_remaining_seconds > 0
          statusMatch = incident.status !== 'closed' && incident.analyst_name !== null && incident.sla_remaining_seconds > 0;
        } else if (statusFilter === 'warning') {
          // Warning: status != closed and analyst_name != null and sla_remaining_seconds < 300
          statusMatch = incident.status !== 'closed' && incident.analyst_name !== null && incident.sla_remaining_seconds < 300;
        } else {
          // Direct status matching for other statuses
          statusMatch = incident.status === statusFilter;
        }

        const slaStatusMatch = slaStatusFilter === 'all' || incident.sla_status === slaStatusFilter;
        const priorityMatch = priorityFilter === 'all' || incident.priority === priorityFilter;
        const analystMatch = analystFilter === 'all' || incident.analyst_code === analystFilter;

        return searchTermMatch && statusMatch && slaStatusMatch && priorityMatch && analystMatch;
      });

      // Update SLA breach stats based on filtered data
      const filteredThreeMinCount = filtered.filter(p => p.shouldShowSLAAlert && p.sla_remaining_seconds <= 180).length;
      const filteredTwoMinCount = filtered.filter(p => p.shouldShowSLAAlert && p.sla_remaining_seconds <= 120).length;
      const filteredOneMinCount = filtered.filter(p => p.shouldShowSLAAlert && p.sla_remaining_seconds <= 60).length;

      setSlaBreachStats({
        threeMinutes: filteredThreeMinCount,
        twoMinutes: filteredTwoMinCount,
        oneMinute: filteredOneMinCount
      });

      // Sort incidents: breached first, then by time remaining (ascending), then by priority (descending)
      filtered.sort((a, b) => {
        // First, prioritize active incidents
        if ((a.status === 'active' || a.status === 'incident') && (b.status !== 'active' && b.status !== 'incident')) return -1;
        if ((a.status !== 'active' && a.status !== 'incident') && (b.status === 'active' || b.status === 'incident')) return 1;

        // For active incidents, sort by SLA status and remaining time
        if ((a.status === 'active' || a.status === 'incident') && (b.status === 'active' || b.status === 'incident')) {
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

      setProcessedIncidents(filtered);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);

    return () => clearInterval(interval);
  }, [incidents, searchTerm, statusFilter, priorityFilter, analystFilter]);

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

  // Calculate summary counts based on all incidents
  useEffect(() => {
    const calculateSummary = () => {
      if (!incidents) return; // Ensure incidents data is available

      const summary: IncidentSummary = {
        triage: 0,
        warning: 0,
        breached: 0,
        escalated: 0,
        open: 0,
        closed: 0,
      };

      // Filter incidents by analyst if analystFilter is applied
      const incidentsForSummary = analystFilter === 'all'
        ? incidents
        : incidents.filter(incident => incident.analyst_code === analystFilter);

      incidentsForSummary.forEach(incident => {
        // Triage: status != closed and analyst_name != null and sla_remaining_seconds > 0
        if (incident.status !== 'closed' && incident.analyst_name !== null && incident.sla_remaining_seconds > 0) {
          summary.triage++;
        }
        
        // Warning: status != closed, analyst_name != null, and sla_remaining_seconds < 300
        if (incident.status !== 'closed' && incident.analyst_name !== null && incident.sla_remaining_seconds < 300) {
          summary.warning++;
        }
        
        // Breach: sla_status == breach
        if (incident.sla_status === 'breach') {
          summary.breached++;
        }
        
        // Escalated: status == escalated
        if (incident.status === 'escalated') {
          summary.escalated++;
        }
        
        // Open: status == need review
        if (incident.status === 'need review') {
          summary.open++;
        }
        
        // Closed: status == closed
        if (incident.status === 'closed') {
          summary.closed++;
        }
      });

      setIncidentSummary(summary);
    };

    calculateSummary();
  }, [incidents, analystFilter]); // Re-calculate summary when incidents or analystFilter change


  // Handle summary card click
  const handleSummaryClick = (filterType: string) => {
    // Reset all filters except analyst filter
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setSlaStatusFilter('all');
    
    // Set the appropriate filters based on the clicked card
    switch(filterType) {
      case 'triage':
        setStatusFilter('triage');
        setSlaStatusFilter('all');
        break;
      case 'warning':
        setStatusFilter('warning');
        setSlaStatusFilter('all');
        break;
      case 'breached':
        setStatusFilter('all');
        setSlaStatusFilter('breach');
        break;
      case 'escalated':
        setStatusFilter('escalated');
        setSlaStatusFilter('all');
        break;
      case 'open':
        setStatusFilter('need review');
        setSlaStatusFilter('all');
        break;
      case 'closed':
        setStatusFilter('closed');
        setSlaStatusFilter('all');
        break;
    }
  };

  const filteredAndSortedIncidents = processedIncidents;

  const {
    currentPage,
    totalPages,
    paginatedData: paginatedIncidents,
    goToPage,
  } = usePagination<IncidentWithCountdown>(filteredAndSortedIncidents, 10);

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
    if (status !== 'active' && status !== 'incident') return 'text-muted-foreground';
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
      <div className="flex justify-end items-center">
        { userRole !== 'L1' && (
          <div className="flex items-center space-x-4">
            <div className="w-48">
              <label className="block text-sm font-medium mb-1">Period</label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium mb-1">Analyst</label>
              <Select
                value={analystFilter}
                onValueChange={setAnalystFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by analyst" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Analysts</SelectItem>
                  {availableAnalysts.map((analyst) => (
                    <SelectItem key={analyst.code} value={analyst.code}>
                      {analyst.name} ({analyst.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Incident Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Incident Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Triage */}
            <div 
              className={`flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors ${statusFilter === 'active' ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => handleSummaryClick('triage')}
            >
              <div>
                <p className="text-sm font-medium text-blue-800">Triage</p>
                <p className="text-2xl font-bold text-blue-900">{incidentSummary.triage}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            {/* Warning */}
            <div 
              className={`flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200 hover:bg-yellow-100 cursor-pointer transition-colors ${statusFilter === 'active' ? 'ring-2 ring-yellow-500' : ''}`}
              onClick={() => handleSummaryClick('warning')}
            >
              <div>
                <p className="text-sm font-medium text-yellow-800">Warning</p>
                <p className="text-2xl font-bold text-yellow-900">{incidentSummary.warning}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>

            {/* Breached */}
            <div 
              className={`flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 cursor-pointer transition-colors ${statusFilter === 'closed' && slaStatusFilter === 'breach' ? 'ring-2 ring-red-500' : ''}`}
              onClick={() => handleSummaryClick('breached')}
            >
              <div>
                <p className="text-sm font-medium text-red-800">Breached</p>
                <p className="text-2xl font-bold text-red-900">{incidentSummary.breached}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>

            {/* Escalated */}
            <div 
              className={`flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 cursor-pointer transition-colors ${statusFilter === 'escalated' ? 'ring-2 ring-purple-500' : ''}`}
              onClick={() => handleSummaryClick('escalated')}
            >
              <div>
                <p className="text-sm font-medium text-purple-800">Escalated</p>
                <p className="text-2xl font-bold text-purple-900">{incidentSummary.escalated}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-purple-600" />
              </div>
            </div>

            {/* Open */}
            <div 
              className={`flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 cursor-pointer transition-colors ${statusFilter === 'need review' ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => handleSummaryClick('open')}
            >
              <div>
                <p className="text-sm font-medium text-green-800">Open</p>
                <p className="text-2xl font-bold text-green-900">{incidentSummary.open}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>

            {/* Closed */}
            <div 
              className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors ${statusFilter === 'closed' && slaStatusFilter !== 'breach' ? 'ring-2 ring-gray-500' : ''}`}
              onClick={() => handleSummaryClick('closed')}
            >
              <div>
                <p className="text-sm font-medium text-gray-800">Closed</p>
                <p className="text-2xl font-bold text-gray-900">{incidentSummary.closed}</p>
              </div>
              <div className="p-2 bg-gray-100 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Incidents Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Incidents</CardTitle>
              <CardDescription>Real-time incident tracking and management with workflow validation</CardDescription>
            </div>
            <div className="w-full sm:w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search incidents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
          </div>
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
                  <TableRow key={incident.incident_id} className={incident.isNearBreach && (incident.status === 'active' || incident.status === 'incident') ? 'bg-red-50' : ''}>
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
