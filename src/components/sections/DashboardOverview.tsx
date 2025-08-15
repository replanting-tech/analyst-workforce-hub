import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Users, Clock, CheckCircle, Activity, AlertCircle, FileText, User, UserCheck, UserX, XCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useIncidents } from '@/hooks/useIncidents';
import { useAnalysts } from '@/hooks/useAnalysts';
import { useAuth } from '@/contexts/AuthContext';
import { format, differenceInSeconds } from 'date-fns';

interface IncidentMetrics {
  total: number;
  active: number;
  openedToday: number;
  closedToday: number;
  nearBreach: number;
}

export const DashboardOverview = () => {
  const navigate = useNavigate();
  const { role: userRole, analyst } = useAuth();
  const analystCode = analyst?.code || null;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedAnalyst, setSelectedAnalyst] = useState<string | null>(null);

  // Update current time every second for SLA counters
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all analysts for L2+ users
  const { data: allAnalysts = [] } = useAnalysts({
    userRole,
    analystCode,
    availability: 'available'
  });
  const availableAnalysts = allAnalysts.filter(a => a.availability === 'available');
  
  // Fetch incidents data
  const { data: allIncidents = [], isLoading: incidentsLoading } = useIncidents({
    userRole,
    analystCode
  });
  
  // Filter incidents based on user role and analyst code
  const incidents = userRole === 'L1' && analystCode 
    ? allIncidents.filter(i => i.analyst_code === analystCode)
    : allIncidents;
  
  // Calculate analyst statistics
  const analystsWithStats = useMemo(() => {
    return allAnalysts.map(analyst => {
      const analystIncidents = allIncidents.filter(i => i.analyst_code === analyst.code);
      const triage = analystIncidents.filter(i => 
        i.status !== 'closed' && i.analyst_code && (i.sla_remaining_seconds || 0) > 0
      ).length;
      const warning = analystIncidents.filter(i => 
        i.status !== 'closed' && i.analyst_code && (i.sla_remaining_seconds || 0) < 300 && (i.sla_remaining_seconds || 0) > 0
      ).length;
      const breached = analystIncidents.filter(i => 
        i.status === 'closed' && i.analyst_code && i.sla_status === 'breach'
      ).length;
      const escalated = analystIncidents.filter(i => i.status === 'escalated').length;
      const open = analystIncidents.filter(i => i.status === 'need review').length;
      const closed = analystIncidents.filter(i => i.status === 'closed').length;
      
      return {
        ...analyst,
        stats: { triage, warning, breached, escalated, open, closed }
      };
    });
  }, [allAnalysts, allIncidents]);

  // Calculate metrics
  const calculateMetrics = (): IncidentMetrics => {
    const today = new Date().toDateString();
    
    return {
      total: incidents.length,
      active: incidents.filter(i => i.status === 'active').length,
      openedToday: incidents.filter(i => 
        new Date(i.creation_time).toDateString() === today
      ).length,
      closedToday: incidents.filter(i => 
        i.status === 'closed' && 
        new Date(i.updated_at).toDateString() === today
      ).length,
      nearBreach: incidents.filter(i => 
        i.sla_status === 'in_progress' && 
        i.sla_remaining_seconds < 180 && // Less than 3 minutes
        i.status === 'active'
      ).length
    };
  };

  const metrics = calculateMetrics();
  const today = format(new Date(), 'EEEE, MMMM d, yyyy');
  
  // Get incidents near breach
  const nearBreachIncidents = incidents
    .filter(i => 
      i.sla_status === 'in_progress' && 
      i.sla_remaining_seconds < 180 && // Less than 3 minutes
      i.status === 'active'
    )
    .sort((a, b) => a.sla_remaining_seconds - b.sla_remaining_seconds);

  if (incidentsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analyst Dashboard</h2>
          <p className="text-gray-600">{today}</p>
        </div>
        {analyst && (
          <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
            <div className="bg-blue-100 p-2 rounded-full">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Logged in as</p>
              <p className="font-medium">{analyst.name} ({analyst.code})</p>
            </div>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Incidents</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{metrics.total}</div>
            {userRole === 'L1' ? (
              <p className="text-xs text-blue-600">Assigned to you</p>
            ) : (
              <p className="text-xs text-blue-600">All incidents</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Active Incidents</CardTitle>
            <Activity className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">{metrics.active}</div>
            {userRole === 'L1' ? (
              <p className="text-xs text-amber-600">Currently working on</p>
            ) : (
              <p className="text-xs text-amber-600">All active incidents</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Today's Activity</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{metrics.openedToday}</div>
            <p className="text-xs text-green-600">
              {metrics.openedToday} opened • {metrics.closedToday} closed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Near SLA Breach</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{metrics.nearBreach}</div>
            <p className="text-xs text-red-600">
              {metrics.nearBreach > 0 ? 'Action required' : 'All good'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analysts List with Stats - Only for L2+ */}
      {userRole !== 'L1' && (
        <Card>
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center text-blue-800">
              <Users className="h-5 w-5 mr-2" />
              Analysts Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 mt-7">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Analyst</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Triage</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Warning</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Breached</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Escalated</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Open</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Closed</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analystsWithStats.map((analyst) => (
                    <tr 
                      key={analyst.code}
                      className={`hover:bg-gray-50 cursor-pointer ${selectedAnalyst === analyst.code ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedAnalyst(selectedAnalyst === analyst.code ? null : analyst.code)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                            analyst.availability === 'available' ? 'bg-green-100 text-green-600' :
                            analyst.availability === 'busy' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {analyst.availability === 'available' ? (
                              <UserCheck className="h-4 w-4" />
                            ) : analyst.availability === 'busy' ? (
                              <User className="h-4 w-4" />
                            ) : (
                              <UserX className="h-4 w-4" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{analyst.name}</div>
                            <div className="text-xs text-gray-500">{analyst.code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          analyst.stats.triage > 0 ? 'bg-yellow-100 text-yellow-800' : 'text-gray-500'
                        }`}>
                          {analyst.stats.triage}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          analyst.stats.warning > 0 ? 'bg-orange-100 text-orange-800' : 'text-gray-500'
                        }`}>
                          {analyst.stats.warning}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          analyst.stats.breached > 0 ? 'bg-red-100 text-red-800' : 'text-gray-500'
                        }`}>
                          {analyst.stats.breached}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          analyst.stats.escalated > 0 ? 'bg-purple-100 text-purple-800' : 'text-gray-500'
                        }`}>
                          {analyst.stats.escalated}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          analyst.stats.open > 0 ? 'bg-blue-100 text-blue-800' : 'text-gray-500'
                        }`}>
                          {analyst.stats.open}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-gray-500">
                          {analyst.stats.closed}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Near Breach Incidents */}
      {metrics.nearBreach > 0 && (
        <Card className="border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="flex items-center text-red-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Incidents Near SLA Breach
            </CardTitle>
            <CardDescription>
              These incidents will breach SLA in less than 3 minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nearBreachIncidents.map((incident) => {
                const minutes = Math.floor(incident.sla_remaining_seconds / 60);
                const seconds = incident.sla_remaining_seconds % 60;
                const timeLeft = `${minutes}m ${seconds}s`;
                
                return (
                  <div key={incident.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-100 rounded-full">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{incident.incident_number}</span>
                          <Badge variant="destructive">{incident.priority}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{incident.customer_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-red-600 font-medium">
                        Breach in {timeLeft}
                      </div>
                      <div className="text-xs text-gray-500">
                        Created: {format(new Date(incident.creation_time), 'MMM d, yyyy HH:mm')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Open Incidents */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {userRole === 'L1' ? 'Your Open Incidents' : 'All Open Incidents'}
            </CardTitle>
            {userRole !== 'L1' && selectedAnalyst && (
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">Filtered by:</span>
                <Badge variant="outline" className="flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  {allAnalysts.find(a => a.code === selectedAnalyst)?.name}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAnalyst(null);
                    }}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-3 w-3" />
                  </button>
                </Badge>
              </div>
            )}
          </div>
          <CardDescription>
            {userRole === 'L1' 
              ? 'All your active and in-progress incidents' 
             : 'All active and in-progress incidents across all analysts'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {incidents
              .filter(incident => {
                // Apply status filter
                const statusMatch = ['active', 'in_progress'].includes(incident.status) && 
                  !(incident.status === 'closed' && 
                    new Date(incident.updated_at).toDateString() === new Date().toDateString());
                
                // Apply analyst filter if selected
                const analystMatch = !selectedAnalyst || incident.analyst_code === selectedAnalyst;
                
                return statusMatch && analystMatch;
              })
              .sort((a, b) => 
                (a.sla_remaining_seconds || Number.MAX_SAFE_INTEGER) - 
                (b.sla_remaining_seconds || Number.MAX_SAFE_INTEGER)
              )
              .map((incident) => {
                const isNearBreach = nearBreachIncidents.some(i => i.incident_id === incident.incident_id);
                
                // Calculate real-time SLA remaining
                const calculateSlaRemaining = () => {
                  if (!incident.creation_time || !incident.sla_remaining_seconds) return null;
                  
                  const creationTime = new Date(incident.creation_time);
                  const elapsedSeconds = differenceInSeconds(currentTime, creationTime);
                  const initialRemaining = incident.sla_remaining_seconds || 0;
                  const remainingSeconds = Math.max(0, initialRemaining - elapsedSeconds);
                  
                  return remainingSeconds;
                };
                
                const slaRemaining = calculateSlaRemaining();
                const slaMinutes = slaRemaining !== null ? Math.floor(slaRemaining / 60) : 0;
                const slaSeconds = slaRemaining !== null ? slaRemaining % 60 : 0;
                const slaTime = slaRemaining !== null 
                  ? `${slaMinutes}m ${slaSeconds.toString().padStart(2, '0')}s` 
                  : 'N/A';
                
                return (
                  <div 
                    key={incident.incident_id} 
                    className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 ${
                      isNearBreach ? 'border-red-200 bg-red-50' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {/* Link to incident */}
                        {/* Use SPA route instead of href */}
                        <span className="font-medium"><span onClick={() => navigate(`/incident/${incident.incident_id}`)} className="cursor-pointer hover:underline">{incident.incident_number}</span></span>
                        <Badge 
                          variant={
                            incident.priority === 'High' ? 'destructive' : 
                            incident.priority === 'Medium' ? 'default' : 'secondary'
                          }
                          className={incident.priority === 'Medium' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : ''}
                        >
                          {incident.priority}
                        </Badge>
                        {isNearBreach && (
                          <Badge variant="destructive" className="animate-pulse">
                            Near Breach
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center">
                        <p className="text-sm text-gray-600 mr-2">{incident.customer_name}</p>
                        {userRole !== 'L1' && incident.analyst_name && (
                          <Badge variant="outline" className="text-xs">
                            {incident.analyst_name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className={`font-medium ${
                          isNearBreach ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          SLA: {slaTime}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-500">{incident.status === 'in_progress' ? 'In Progress' : 'Active'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          incident.status === 'active' ? 'bg-green-500' : 
                          incident.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
                        }`}></span>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {incident.status === 'in_progress' ? 'In Progress' : 'Active'}
                          </div>
                          <div className={`text-xs ${
                            isNearBreach ? 'text-red-600 font-medium' : 'text-gray-500'
                          }`}>
                            {isNearBreach ? 'Breaching soon' : 'On track'}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Updated: {format(new Date(incident.updated_at), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  </div>
                );
              })}
            
            {incidents.filter(i => ['active', 'in_progress'].includes(i.status)).length === 0 && (
              <div className="text-center py-8">
                <FileText className="mx-auto h-10 w-10 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No open incidents</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You don't have any active or in-progress incidents.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
