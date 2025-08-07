import React, { useState, useEffect } from 'react';
import { useIncidentById } from '@/hooks/useIncidents';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Download, ExternalLink, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface IncidentDetailProps {
  incidentId: string;
}

const IncidentDetail: React.FC<IncidentDetailProps> = ({ incidentId }) => {
  const { data: incident, isLoading, isError } = useIncidentById(incidentId);
  const { toast } = useToast()
  const [isCopied, setIsCopied] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [recommendation, setRecommendation] = useState('');

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  if (isLoading) {
    return <div>Loading incident details...</div>;
  }

  if (isError || !incident) {
    return <div>Error loading incident details.</div>;
  }

  const handleCopyLogs = () => {
    if (incident?.raw_logs) {
      navigator.clipboard.writeText(incident.raw_logs);
      setIsCopied(true);
      toast({
        title: "Copied!",
        description: "Raw logs copied to clipboard.",
      })
    }
  };

  const handleExportLogs = () => {
    if (!incident?.raw_logs) return;
    
    const element = document.createElement('a');
    const file = new Blob([incident.raw_logs], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `incident-${incident.incident_number}-logs.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
      case 'Very High':
        return 'bg-red-500 text-white';
      case 'Medium':
        return 'bg-yellow-500 text-black';
      case 'Low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const sendNotificationEmail = async () => {
    setIsDialogOpen(false);
    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incidentId: incident.incident_id,
          customerName: incident.customer_name,
          customerEmail: 'customer@example.com', // Replace with actual email if available
          incidentNumber: incident.incident_number,
          priority: incident.priority,
          analystName: incident.analyst_name,
          recommendation: recommendation,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to send email:', errorData);
        toast({
          title: "Failed to send email",
          description: errorData.error || 'Failed to send notification email.',
          variant: "destructive",
        })
        return;
      }
  
      const result = await response.json();
      console.log('Email sent successfully:', result);
      toast({
        title: "Success",
        description: "Notification email sent successfully!",
      })
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: error.message || 'An unexpected error occurred.',
        variant: "destructive",
      })
    }
  };

  const exportToPDF = async () => {
    const pdf = new jsPDF();

    // Set document properties
    pdf.setProperties({
      title: `Incident ${incident.incident_number} Details`,
      author: 'Your Organization',
    });

    // Add title
    pdf.setFontSize(20);
    pdf.text(`Incident ${incident.incident_number} Details`, 10, 10);

    // Define the data for the autoTable
    const data = [
      { label: 'Incident ID', value: incident.incident_id },
      { label: 'Incident Number', value: incident.incident_number },
      { label: 'Customer', value: incident.customer_name },
      { label: 'Priority', value: incident.priority },
      { label: 'Creation Time', value: formatDate(incident.creation_time) },
      { label: 'SLA Status', value: incident.sla_status },
      { label: 'SLA Remaining', value: incident.sla_remaining_formatted },
      { label: 'Analyst', value: incident.analyst_name || 'N/A' },
      { label: 'Status', value: incident.status },
      { label: 'Closed Time', value: formatDate(incident.closed_time) },
      { label: 'Jira Ticket ID', value: incident.jira_ticket_id || 'N/A' },
      { label: 'Customer Notification', value: incident.customer_notification },
      { label: 'Resolution Minutes', value: incident.resolution_minutes },
    ];

    // Convert data to the format autoTable expects
    const body = data.map(item => [item.label, item.value]);

    // Style options
    const options = {
      startY: 30,
      headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255] },
      bodyStyles: { textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    };

    // Add the table to the PDF
    (pdf as any).autoTable({
      head: [['Detail', 'Value']],
      body: body,
      ...options,
    });

    // Save the PDF
    pdf.save(`incident-${incident.incident_number}-details.pdf`);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Incident: {incident.incident_number}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong>Incident ID:</strong> {incident.incident_id}
            </div>
            <div>
              <strong>Customer:</strong> {incident.customer_name}
            </div>
            <div>
              <strong>Priority:</strong>
              <Badge className={getPriorityColor(incident.priority)}>
                {incident.priority}
              </Badge>
            </div>
            <div>
              <strong>Creation Time:</strong> {formatDate(incident.creation_time)}
            </div>
            <div>
              <strong>SLA Status:</strong> {incident.sla_status}
            </div>
            <div>
              <strong>SLA Remaining:</strong> {incident.sla_remaining_formatted}
            </div>
            <div>
              <strong>Analyst:</strong> {incident.analyst_name || 'N/A'}
            </div>
            <div>
              <strong>Status:</strong> {incident.status}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong>Closed Time:</strong> {formatDate(incident.closed_time)}
            </div>
            <div>
              <strong>Jira Ticket ID:</strong> {incident.jira_ticket_id || 'N/A'}
              {incident.jira_ticket_id && (
                <a
                  href={`https://your-jira-instance.com/browse/${incident.jira_ticket_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-500 hover:underline"
                >
                  <ExternalLink className="inline-block w-4 h-4 mr-1 align-text-top" />
                  View in Jira
                </a>
              )}
            </div>
            <div>
              <strong>Customer Notification:</strong> {incident.customer_notification}
            </div>
            <div>
              <strong>Resolution Minutes:</strong> {incident.resolution_minutes}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raw Logs</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-muted-foreground">
              Use these logs for detailed analysis and troubleshooting.
            </div>
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={handleCopyLogs} disabled={isCopied}>
                <Copy className="w-4 h-4 mr-2" />
                {isCopied ? 'Copied!' : 'Copy Logs'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportLogs}>
                <Download className="w-4 h-4 mr-2" />
                Export Logs
              </Button>
            </div>
          </div>
          <pre className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 font-mono text-sm whitespace-pre-wrap">
            {incident.raw_logs}
          </pre>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button variant="secondary" onClick={exportToPDF}>
          <Download className="w-4 h-4 mr-2" />
          Export to PDF
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>
              <Mail className="w-4 h-4 mr-2" />
              Notify Customer
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Notify Customer</AlertDialogTitle>
              <AlertDialogDescription>
                Do you want to send a notification email to the customer about this incident?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="recommendation" className="text-right">
                  Recommendation
                </label>
                <textarea
                  id="recommendation"
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Recommendation for customer"
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={sendNotificationEmail}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default IncidentDetail;
