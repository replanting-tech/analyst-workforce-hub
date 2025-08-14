import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIncidentById } from "@/hooks/useIncidents";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertTriangle,
  Clock,
  Building2,
  ExternalLink,
  FileText,
  Send,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RichTextEditor from "./RichTextEditor";
import IncidentDetailsExtraction from "./IncidentDetailsExtraction";
import { StatusWorkflowDropdown } from "./StatusWorkflowDropdown";
import EntitiesSection from "./incident/EntitiesSection"; 
import TagsSection from "./incident/TagsSection";
import CommentsSection from "./incident/CommentsSection";
import AnalystEnrichmentSection from "./incident/AnalystEnrichmentSection";
import { useToast } from "@/components/ui/use-toast"; 
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { useRequestChanges, useUpdateRequestChangeStatus } from "@/hooks/useRequestChanges";
import { useQueryClient } from "@tanstack/react-query";

interface IncidentDetailProps {
  incidentId: string;
}

export function IncidentDetail({ incidentId }: IncidentDetailProps) {
  const { data: incident, isLoading, error } = useIncidentById(incidentId);
  const { data: requestChanges = [], isLoading: isLoadingRequestChanges } = useRequestChanges(incident?.incident_number);
  const updateRequestStatus = useUpdateRequestChangeStatus();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for email functionality
  const [recommendationAnalysis, setRecommendationAnalysis] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // State for incident status and SLA
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [remainingTime, setRemainingTime] = useState<string>('');
  
  // State for request changes
  const [selectedActionBy, setSelectedActionBy] = useState<string>('');
  const [showActionBySelect, setShowActionBySelect] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState<boolean>(false);
  const [requestSubmitted, setRequestSubmitted] = useState<boolean>(false);
  const [requestData, setRequestData] = useState<{id: string | number, status: string} | null>(null);



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
  const handleRequestChangeClick = () => {
    setShowActionBySelect(true);
  };

  const handleActionByChange = (actionBy: string) => {
    setSelectedActionBy(actionBy);
    setShowConfirmation(true);
  };

  const handleConfirmAction = async () => {
    if (!incident) return;
    
    try {
      setTemplatesLoading(true);
      
      // Create the request change record
      const { data: requestChange, error } = await supabase
        .from('request_changes')
        .insert({
          incident_number: incident.incident_number,
          analyst_id: incident.analyst_code,
          status: 'waiting for approval',
          action_required_by: selectedActionBy === 'soc_engineer' ? 'soc' : 'customer'
        })
        .select()
        .single();

      if (error) throw error;

      // Store the request data in state and local storage (convert id to string if it's a number)
      const requestData = { 
        id: typeof requestChange.id === 'number' ? requestChange.id.toString() : requestChange.id, 
        status: 'waiting for approval' 
      };
      setRequestData(requestData);
      setRequestSubmitted(true);
      
      // Invalidate and refetch the request changes query
      await queryClient.invalidateQueries({ 
        queryKey: ['request-changes', incident.incident_number] 
      });
      
      localStorage.setItem(
        `request_${incident.incident_number}`, 
        JSON.stringify(requestData)
      );
      
      toast({
        title: 'Success',
        description: 'Request change has been submitted successfully',
      });
      
    } catch (error) {
      console.error('Error creating request change:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit request change. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setShowConfirmation(false);
      setShowActionBySelect(false);
      setSelectedActionBy('');
      setTemplatesLoading(false);
    }
  };

  const handleCancelAction = () => {
    setShowConfirmation(false);
    setShowActionBySelect(false);
    setSelectedActionBy('');
  };

  // Check for existing request and fetch templates
  useEffect(() => {
    const checkExistingRequest = async () => {
      if (!incident) return;
      
      try {
        setTemplatesLoading(true);
        
        // Check local storage first
        const storedRequest = localStorage.getItem(`request_${incident.incident_number}`);
        if (storedRequest) {
          const parsed = JSON.parse(storedRequest);
          setRequestData(parsed);
          setRequestSubmitted(true);
          return;
        }
        
        // If not in local storage, check the database
        const { data: existingRequest, error } = await supabase
          .from('request_changes')
          .select('id, status')
          .eq('incident_number', incident.incident_number)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (error) throw error;
        
        if (existingRequest) {
          // Store in local storage for future reference
          localStorage.setItem(
            `request_${incident.incident_number}`, 
            JSON.stringify({ id: existingRequest.id, status: existingRequest.status })
          );
          setRequestData(existingRequest);
          setRequestSubmitted(true);
        }
        
      } catch (error) {
        console.error('Error checking existing request:', error);
      } finally {
        setTemplatesLoading(false);
      }
    };
    
    const fetchTemplates = async () => {
      try {
        // Replace this with your actual data fetching logic
        // const response = await fetchTemplatesFromAPI();
        // setTemplates(response.data);
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };

    checkExistingRequest();
    fetchTemplates();
  }, []);

  const sendEmail = async () => {
    if (!incident || !recommendationAnalysis) return;
    
    setIsSendingEmail(true);
    
    const payload = {
      incidentId: incident.id,
      customerName: incident.customer_name,
      recipients: ["harry.sunaryo@compnet.co.id"],
      incidentNumber: incident.incident_number,
      priority: incident.priority,
      analystName: incident.analyst_name,
      recommendation: recommendationAnalysis,
    };

    console.log(payload);


    try {
      const response = await fetch(
        "https://xmozpbewjkeisvpfzeca.supabase.co/functions/v1/send-notification-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhtb3pwYmV3amtlaXN2cGZ6ZWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMDM3MDMsImV4cCI6MjA2Nzc3OTcwM30.goD6H9fLQPljKpifLlLIU6_Oo4jJO7b2-8GlkeqkiKA`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error("Failed to send email:", result.error);
        toast({
          title: "Error",
          description: result.error || "Failed to send email",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Email sent successfully",
        });
        // Update notification status if needed
        await updateCustomerNotificationStatus();
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Error",
        description: "An error occurred while sending the email",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  async function updateCustomerNotificationStatus() {
    if (!incident) return;

    try {
      const { error } = await supabase
        .from('incidents')
        .update({ customer_notification: 'waiting for approval' })
        .eq('incident_id', incident.incident_id);

      if (error) {
        console.error('Error updating notification status:', error);
        throw error;
      }

      console.log('Customer notification status updated to waiting for approval');
    } catch (err) {
      console.error('Error updating customer notification status:', err);
      throw err;
    }
  }

  useEffect(() => {
    if (incident) {
      setCurrentStatus(incident.status);
    }
  }, [incident]);

  // Live countdown timer for SLA
  useEffect(() => {
    if (!incident || incident.status === "incident_closed" || incident.status === "false_positive_closed" || !incident.sla_target_time)
      return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = new Date(incident.sla_target_time).getTime();
      const difference = target - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setRemainingTime(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setRemainingTime("BREACHED");
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [incident]);

  useEffect(() => {
    if (incident) {
      setCurrentStatus(incident.status);
    }
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
      case "Very High":
        return "bg-red-100 text-red-800 border-red-200";
      case "High":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Informational":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSLAStatusColor = (slaStatus: string, remainingSeconds: number) => {
    if (slaStatus === "breach") return "bg-red-100 text-red-800";
    if (remainingSeconds <= 900 && remainingSeconds > 0)
      return "bg-orange-100 text-orange-800";
    if (slaStatus === "met") return "bg-green-100 text-green-800";
    return "bg-blue-100 text-blue-800";
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
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
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Left Column - Main Content (75%) */}
      <div className="col-span-9 space-y-6">
        {/* Customer Report */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Customer Report</span>
              {incident.customer_notification && (
                <Badge 
                  className="ml-2"
                  variant={
                    incident.customer_notification === 'approved' ? 'default' :
                    incident.customer_notification === 'waiting for approval' ? 'destructive' :
                    incident.customer_notification === 'rejected' ? 'secondary' : 'outline'
                  }
                >
                  Notification: {incident.customer_notification}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RichTextEditor 
              incident={incident} 
              value={recommendationAnalysis}
              onChange={setRecommendationAnalysis}
            />
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="investigation" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="investigation">Investigation Result</TabsTrigger>
            <TabsTrigger value="details">Incident Details</TabsTrigger>
            <TabsTrigger value="raw-logs">Raw Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="investigation" className="space-y-6 mt-6">
            <AnalystEnrichmentSection 
              incidentId={incident.incident_id}
              rawLogs={incident.raw_logs}
              comments={incident.comments}
              tags={incident.tags}
            />
          </TabsContent>

          <TabsContent value="details" className="space-y-6 mt-6">
            <IncidentDetailsExtraction 
              rawLogs={incident.raw_logs} 
              creationTime={incident.creation_time}
              priority={incident.priority}
            />
            <EntitiesSection entities={incident.entities} />
          </TabsContent>

          <TabsContent value="raw-logs" className="mt-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Raw Logs</CardTitle>
              </CardHeader>
              <CardContent>
                {incident.raw_logs ? (
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-auto max-h-[600px]">
                    <pre className="whitespace-pre-wrap">
                      {formatRawLogs(incident.raw_logs)}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <FileText className="mx-auto h-12 w-12 mb-4" />
                    <p>No raw logs available for this incident</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

            <CommentsSection 
              comments={incident.comments} 
              incidentId={incident.incident_id}
            />
      </div>

      {/* Right Column - Sidebar (25%) */}
      <div className="col-span-3 space-y-6">
        {/* Basic Information */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 gap-4">

              <StatusWorkflowDropdown 
                currentStatus={incident.status}
                incidentId={incident.incident_id}
                onStatusChange={setCurrentStatus}
              />
              <Button className={"w-full " + getPriorityColor(incident.priority)} variant="outline">
                {incident.priority}
              </Button>
            </div>

            <Button className="w-full" asChild>
              <a
                href={incident.incident_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View in Azure Sentinel
              </a>
            </Button>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Incident Number
                </p>
                <p className="font-mono text-sm">
                  {incident.incident_number}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Assigned Analyst
                </p>
                <p className="text-sm font-medium">
                  {incident.analyst_name || "Unassigned"} ({incident.analyst_code})
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Actions
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                onClick={sendEmail}
                disabled={!recommendationAnalysis || isSendingEmail}
                className="flex items-center gap-2"
              >
                {isSendingEmail ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Notif to Customer
                  </>
                )}
              </Button>
                  <div className="w-full">
                    {requestChanges.length > 0 ? (
                      <div className="w-full">
                        <div className="px-4 py-2 text-sm text-center text-green-600 bg-green-100 rounded-md border border-green-200 flex items-center justify-center">
                          <Check className="w-4 h-4 mr-2" />
                          {requestData?.status === 'waiting for approval' 
                            ? 'Waiting for Approval' 
                            : requestData?.status === 'approved'
                              ? 'Request Approved' 
                              : 'Request Submitted'}
                        </div>
                        {requestData?.status === 'waiting for approval' && (
                          <p className="mt-1 text-xs text-center text-muted-foreground">
                            Action required by: {selectedActionBy === 'soc_engineer' ? 'SOC Engineer' : 'Customer'}
                          </p>
                        )}
                      </div>
                    ) : !showActionBySelect ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full flex items-center justify-center"
                        onClick={handleRequestChangeClick}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Request Change
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 flex items-center justify-center"
                          disabled
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Request Change
                        </Button>
                        <Select
                          value={selectedActionBy}
                          onValueChange={handleActionByChange}
                          disabled={templatesLoading}
                        >
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Action by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="soc_engineer">
                              <div className="flex items-center gap-2">
                                Compnet SOC Engineer
                              </div>
                            </SelectItem>
                            <SelectItem value="customer">
                              <div className="flex items-center gap-2">
                                Customer
                              </div>
                            </SelectItem>
                            {templates?.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                <div className="flex items-center gap-2">
                                  {template.name}
                                  {template.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  
                  <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Action</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to request a change to be handled by {selectedActionBy === 'soc_engineer' ? 'Compnet SOC Engineer' : selectedActionBy === 'customer' ? 'Customer' : 'selected template'}?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={handleCancelAction}>
                          Cancel
                        </Button>
                        <Button onClick={handleConfirmAction}>
                          Confirm
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  {/* <RequestChangeModal
                    incidentId={incident.incident_id}
                    incidentNumber={incident.incident_number}
                    analystCode={incident.analyst_code}
                  /> */}
                </div>
              </div>
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
                <p className="text-sm font-medium text-muted-foreground">
                  SLA Status
                </p>
                <Badge
                  className={getSLAStatusColor(
                    incident.sla_status,
                    incident.sla_remaining_seconds
                  )}
                >
                  {incident.sla_status}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Resolution SLA
                </p>
                <p className="text-sm">
                  {incident.resolution_minutes} minutes
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Created
                </p>
                <p className="text-sm">
                  {formatDateTime(incident.creation_time)}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  SLA Target
                </p>
                <p className="text-sm">
                  {incident.sla_target_time
                    ? formatDateTime(incident.sla_target_time)
                    : "Not set"}
                </p>
              </div>

              {(incident.status === "open" || incident.status === "incident") && incident.sla_target_time && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Time Remaining
                  </p>
                  <p
                    className={`text-lg font-semibold ${
                      remainingTime === "BREACHED"
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {remainingTime}
                  </p>
                </div>
              )}

              {incident.closed_time && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Closed
                  </p>
                  <p className="text-sm">
                    {formatDateTime(incident.closed_time)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>


          {/* Required Actions */}
         {requestChanges.length > 0 && <Card>
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
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-sm font-medium">Assets:</p>
                        <p className="text-sm">{request.assets || 'No assets specified'}</p>
                      </div>
                      
                      <Badge variant="outline">
                          {request.status}
                        </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No pending actions required.
                </p>
              )}
            </CardContent>
          </Card>}


        {/* Tags */}
        <TagsSection tags={incident.tags} />

        {/* Customer Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Customer
              </p>
              <p className="text-sm font-medium">
                {incident.customer_name}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Workspace
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {incident.workspace_name}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default IncidentDetail;
