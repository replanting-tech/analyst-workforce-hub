
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Plus, Eye, CheckCircle, XCircle, Clock, Bell, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIncidents } from '@/hooks/useIncidents';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  full_name: string;
  customer_id: string;
  role: string;
}

interface CustomerPortalCaseManagementProps {
  user: User;
  onIncidentSelect: (incidentId: string) => void;
}

const ITEMS_PER_PAGE = 10;

export function CustomerPortalCaseManagement({ user }: CustomerPortalCaseManagementProps) {
  const { data: incidents = [], isLoading } = useIncidents();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [newCaseData, setNewCaseData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    category: 'security_incident'
  });
  const [recommendationContent, setRecommendationContent] = useState<string>('');
  // onIncidentSelect
  const onIncidentSelect = (incidentId: string) => {
    console.log(incidentId);
    setSelectedIncidentId(incidentId);
    // setSelectedIncident(incident);
    navigate(`/portal/cases/${incidentId}`);
  };
  
  // Fetch recommendation when incident is selected
  useEffect(() => {
    const fetchRecommendation = async () => {
      if (!selectedIncident) return;
      
      try {
        const { data, error } = await supabase
          .from('incident_report_versions')
          .select('content')
          .eq('incident_id', selectedIncident.incident_id)
          .eq('is_current', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;
        setRecommendationContent(data?.content || 'No recommendations available');
      } catch (error) {
        console.error('Error fetching recommendation:', error);
        setRecommendationContent('Error loading recommendations');
      }
    };

    fetchRecommendation();
  }, [selectedIncident]);

  // Filter incidents for this customer and pending notifications
  const customerIncidents = React.useMemo(() => 
    (incidents || []).filter(incident => 
      incident.customer_name && 
      incident.customer_notification === 'waiting for approval'
    ),
    [incidents]
  );
  
  // Pagination logic
  const totalPages = Math.ceil(customerIncidents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedIncidents = customerIncidents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleApproveNotification = async (incidentId: string) => {
    try {
      const { error } = await supabase
        .from('incidents')
        .update({ customer_notification: 'approved' })
        .eq('incident_id', incidentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification approved successfully",
      });
      setSelectedIncidentId(null);
    } catch (error) {
      console.error('Error approving notification:', error);
      toast({
        title: "Error",
        description: "Failed to approve notification",
        variant: "destructive",
      });
    }
  };

  const handleRejectNotification = async (incidentId: string) => {
    try {
      const { error } = await supabase
        .from('incidents')
        .update({ customer_notification: 'rejected' })
        .eq('incident_id', incidentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification rejected successfully",
      });
      //close modal
      setSelectedIncidentId(null);
      

    } catch (error) {
      console.error('Error rejecting notification:', error);
      toast({
        title: "Error",
        description: "Failed to reject notification",
        variant: "destructive",
      });
    }
  };

  const handleCreateCase = async () => {
    try {
      // This would typically create a new incident or case
      // For now, we'll just show a success message
      toast({
        title: "Success",
        description: "Case created successfully",
      });
      
      setNewCaseData({
        title: '',
        description: '',
        priority: 'Medium',
        category: 'security_incident'
      });
    } catch (error) {
      console.error('Error creating case:', error);
      toast({
        title: "Error",
        description: "Failed to create case",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Very High': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 p-4 sm:p-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Urgent Notifications Alert */}
      {customerIncidents.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Bell className="w-5 h-5" />
              Urgent Action Required
              <Badge variant="destructive">{customerIncidents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 mb-4">
              You have {customerIncidents.length} incident notification(s) requiring your approval.
            </p>
            <div className="space-y-3">
              {paginatedIncidents.map((incident) => (
                <div key={incident.incident_id} className="bg-white p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">Incident #{incident.incident_number}</h4>
                      <p className="text-sm text-gray-600">
                        Priority: <Badge className={getPriorityColor(incident.priority)}>{incident.priority}</Badge>
                      </p>
                      <p className="text-sm text-gray-600">
                        Created: {formatDateTime(incident.creation_time)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedIncident(incident)}>
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl ">
                          <DialogHeader>
                            <DialogTitle>Incident #{incident.incident_number} Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className='space-x-2'>
                                <Label>Priority</Label>
                                <Badge className={getPriorityColor(incident.priority)}>{incident.priority}</Badge>
                              </div>
                              <div className='space-x-2'>
                                <Label>Status</Label>
                                <Badge>{incident.status}</Badge>
                              </div>
                              <div>
                                <Label>Created</Label>
                                <p className="text-sm">{formatDateTime(incident.creation_time)}</p>
                              </div>
                              <div>
                                <Label>Analyst</Label>
                                <p className="text-sm">{incident.analyst_name || 'Unassigned'}</p>
                              </div>
                            </div>
                              <div>
                                <Label>Recommendation</Label>
                                <div className="max-h-80 overflow-y-auto p-2 border rounded" dangerouslySetInnerHTML={{ __html: recommendationContent }}></div>
                              </div>
                            {/* {incident.raw_logs && (
                              <div>
                                <Label>Raw Logs</Label>
                                <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono max-h-40 overflow-auto">
                                  {JSON.stringify(JSON.parse(incident.raw_logs), null, 2)}
                                </div>
                              </div>
                            )} */}
                            <div className="flex gap-2 pt-4">
                              <Button 
                                onClick={() => handleApproveNotification(incident.incident_id)}
                                className="flex-1"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve 
                              </Button>
                              <Button 
                                variant="destructive" 
                                onClick={() => handleRejectNotification(incident.incident_id)}
                                className="flex-1"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="incidents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="create">Create New Case</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle> Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Incident #</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Analyst</TableHead>
                    <TableHead>Notification Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incidents.slice(startIndex, startIndex + ITEMS_PER_PAGE).map((incident) => (
                    <TableRow key={incident.incident_id}>
                      <TableCell className="font-mono">{incident.incident_number}</TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(incident.priority)}>
                          {incident.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{incident.status}</Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(incident.creation_time)}</TableCell>
                      <TableCell>{incident.analyst_name || 'Unassigned'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            incident.customer_notification === 'approved' ? 'default' :
                            incident.customer_notification === 'waiting for approval' ? 'destructive' :
                            incident.customer_notification === 'rejected' ? 'secondary' : 'outline'
                          }
                        >
                          {incident.customer_notification || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onIncidentSelect(incident.incident_id)}
                        >
                          View Case
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination Controls */}
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, incidents.length)} of {incidents.length} incidents
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Show pages around current page
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === currentPage ? "default" : "ghost"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <span className="px-2">...</span>
                    )}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create New Case
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Case Title</Label>
                <Input
                  id="title"
                  value={newCaseData.title}
                  onChange={(e) => setNewCaseData({...newCaseData, title: e.target.value})}
                  placeholder="Enter case title"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCaseData.description}
                  onChange={(e) => setNewCaseData({...newCaseData, description: e.target.value})}
                  placeholder="Describe the issue in detail"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newCaseData.priority} onValueChange={(value) => setNewCaseData({...newCaseData, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Very High">Very High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newCaseData.category} onValueChange={(value) => setNewCaseData({...newCaseData, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="security_incident">Security Incident</SelectItem>
                      <SelectItem value="access_request">Access Request</SelectItem>
                      <SelectItem value="policy_violation">Policy Violation</SelectItem>
                      <SelectItem value="technical_issue">Technical Issue</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleCreateCase} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Case
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
