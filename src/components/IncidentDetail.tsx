import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
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
  User,
  Building2,
  ExternalLink,
  Calendar,
  Target,
  FileText,
  AlertCircle,
  Database,
  Mail,
  Send,
  Upload,
  ChevronRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RichTextEditor from "./RichTextEditor";
import IncidentDetailsExtraction from "./IncidentDetailsExtraction";
import { StatusWorkflowDropdown } from "./StatusWorkflowDropdown";

interface IncidentDetailProps {
  incidentId: string;
}

export function IncidentDetail({ incidentId }: IncidentDetailProps) {
  const { data: incident, isLoading, error } = useIncidentById(incidentId);
  const [remainingTime, setRemainingTime] = useState<string>("");
  const [recommendationAnalysis, setRecommendationAnalysis] =
    useState<string>("");
  const [currentStatus, setCurrentStatus] = useState<string>("");

  async function sendEmail() {
    if (!incident) return;

    const payload = {
      incidentId: incident.id,
      customerName: incident.customer_name,
      customerEmail: "harrysunaryo03@gmail.com", // fallback handled by backend
      incidentNumber: incident.incident_number,
      priority: incident.priority,
      analystName: incident.analyst_name,
      recommendation: recommendationAnalysis || undefined,
    };

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
        alert("Failed to send email.");
      } else {
        console.log("Email sent successfully:", result);
        // Update the customer_notification field to 'waiting for approval'
        await updateCustomerNotificationStatus();
        alert("Email sent and notification status updated!");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("An unexpected error occurred.");
    }
  }

  // New function to update customer notification status
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

  // Function to submit request change to OpenTaxii
  async function submitRequestChange() {
    if (!incident) return;

    try {
      const payload = {
        p_incident_id: incident.incident_number,
        p_analyst_name: incident.analyst_name || "Unassigned",
        p_jira_ticket_id: "TEST-123",
        p_assets: "test",
      };

      const response = await fetch(
        "https://xmozpbewjkeisvpfzeca.supabase.co/rest/v1/rpc/create_request_change",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhtb3pwYmV3amtlaXN2cGZ6ZWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMDM3MDMsImV4cCI6MjA2Nzc3OTcwM30.goD6H9fLQPljKpifLlLIU6_Oo4jJO7b2-8GlkeqkiKA",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Failed to submit request: ${
            errorData.message || response.statusText
          }`
        );
      }

      alert("Change request submitted successfully!");
      // Close the dialog by finding the close button and triggering it
      const closeButton = document.querySelector('[data-state="open"] [data-dialog-close]') as HTMLElement;
      if (closeButton) {
        closeButton.click();
      }
    } catch (err) {
      console.error("Error submitting request change:", err);
      alert(
        `Failed to submit request change: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  }

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

  // Set initial status when incident data is loaded
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
    <div className="row">
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* Left Column - Main Content */}
        <div className="col-span-9 space-y-6">
          {/* Recommendation Analysis */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Customer Report
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
                )}</CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor />
            </CardContent>
          </Card>

          {/* Incident Details Extraction */}
          <IncidentDetailsExtraction 
            rawLogs={incident.raw_logs} 
            creationTime={incident.creation_time}
            priority={incident.priority}
          />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Raw Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {incident.raw_logs ? (
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-auto">
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
        </div>

        {/* Right Column - Sidebar */}
        <div className="col-span-3 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <Button className={"w-full " + getPriorityColor(incident.priority)}>
                    {incident.priority}
                  </Button>
                </div>

                <StatusWorkflowDropdown 
                  currentStatus={incident.status}
                  incidentId={incident.incident_id}
                  onStatusChange={setCurrentStatus}
                />
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
              <div className="grid grid-cols-2 gap-2">
                  <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Assigned Analyst
                </p>
                <p className="text-sm font-medium">
                  {incident.analyst_name || "Unassigned"} (
                  {incident.analyst_code})
                </p>
                {incident.analyst_email && (
                  <div className="flex items-center gap-1 mt-1">
                    <Mail className="w-3 h-3" />
                    <p className="text-xs text-muted-foreground">
                      {incident.analyst_email}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Incident Number
                </p>
                <p className="font-mono text-sm">
                  {incident.incident_number}
                </p>
              </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Actions
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={sendEmail}
                    className="flex items-center"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Notif to Customer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={submitRequestChange}
                    className="flex items-center"
                  >
                    <Send className="w-4 h-4 mr-2" />
                   Request Change
                  </Button>
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
              </div>

              <div className="grid grid-cols-2 gap-2">
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
                {incident.status === "open" || incident.status === "incident" && incident.sla_target_time && (
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
              </div>

              <div className="grid grid-cols-2 gap-4">
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default IncidentDetail;
