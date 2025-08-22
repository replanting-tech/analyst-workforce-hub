/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useRef } from "react";
import HtmlVariableDisplay from "./HtmlVariableDisplay";

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
import IncidentDetailsExtraction from "./IncidentDetailsExtraction";
import { StatusWorkflowDropdown } from "./StatusWorkflowDropdown";
import EntitiesSection from "./incident/EntitiesSection";
import TagsSection from "./incident/TagsSection";
import CommentsSection from "./incident/CommentsSection";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Shield, Save, Edit3 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { useRequestChanges, useUpdateRequestChangeStatus } from "@/hooks/useRequestChanges";
import { useQueryClient } from "@tanstack/react-query";
import { Editor } from '@tinymce/tinymce-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"; // Import Switch
import { IncidentReportVersion, useCurrentIncidentReportVersion, useSaveIncidentReportVersion } from "@/hooks/useIncidentReportVersions";

interface IncidentDetailProps {
  incidentId: string;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  template_content: string;
  variables?: string[]; // Make variables optional
  is_default: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function IncidentDetail({ incidentId }: IncidentDetailProps) {
  const { data: incident, isLoading, error } = useIncidentById(incidentId);
  const { data: requestChanges = [], isLoading: isLoadingRequestChanges } = useRequestChanges(incident?.incident_number);

  const updateRequestStatus = useUpdateRequestChangeStatus();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: currentReportVersion, isLoading: isLoadingReportVersion } = useCurrentIncidentReportVersion(incidentId);
  const { mutate: saveReportVersion } = useSaveIncidentReportVersion();

  const [recommendationAnalysis, setRecommendationAnalysis] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [remainingTime, setRemainingTime] = useState<string>('');
  const [selectedActionBy, setSelectedActionBy] = useState<string>('');
  const [showActionBySelect, setShowActionBySelect] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState(false); // New state for edit mode
  const [isCustomerPortal, setIsCustomerPortal] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState<boolean>(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [requestSubmitted, setRequestSubmitted] = useState<boolean>(false);
  const [requestData, setRequestData] = useState<{id: string | number, status: string} | null>(null);

  // Define a type for the raw template from Supabase
  type RawTemplate = Omit<Template, 'variables'> & {
    variables: any; // This will be parsed from JSONB
  };

  // Fetch templates from Supabase
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setTemplatesLoading(true);
        const { data, error } = await supabase
          .from('incident_report_templates')
          .select('*')
          .eq('is_active', true)
          .order('is_default', { ascending: false })
          .order('name');

        if (error) throw error;

        // Parse the variables from JSONB to string[]
        const parsedTemplates: Template[] = (data || []).map((template: any) => ({
          ...template,
          variables: Array.isArray(template.variables) 
            ? template.variables 
            : (typeof template.variables === 'string' 
                ? JSON.parse(template.variables) 
                : [])
        }));

        setTemplates(parsedTemplates);
        
        // Set the default template if available
        if (parsedTemplates.length > 0) {
          const defaultTemplate = parsedTemplates.find(t => t.is_default) || parsedTemplates[0];
          setSelectedTemplateId(defaultTemplate.id);
          // Apply the default template
          applyTemplate(defaultTemplate);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast({
          title: 'Error',
          description: 'Failed to load templates',
          variant: 'destructive',
        });
      } finally {
        setTemplatesLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Apply template to form
  const applyTemplate = (template: Template) => {
    if (!template) return;

    // Create a copy of the current report data
    const updatedReport = { ...reportDisplayData };

    // Ensure variables is an array
    const templateVariables = Array.isArray(template.variables) ? template.variables : [];

    // Update fields based on template variables
    templateVariables.forEach(variable => {
      // Only process string variables
      if (typeof variable === 'string') {
        // Only update if the variable exists in reportDisplayData and is a string field
        if (variable in updatedReport && 
            (typeof updatedReport[variable] === 'string' || updatedReport[variable] === undefined)) {
          // Preserve existing values if they exist
          if (!updatedReport[variable]) {
            updatedReport[variable] = `[${variable.toUpperCase()}_VALUE]`;
          }
        }
      }
    });

    // For the description, use the template content if it's not empty
    if (template.template_content) {
      updatedReport.incident_description = template.template_content;
    }

    // Update the state
    setReportDisplayData(updatedReport);
  };

  const handleTemplateChange = (value: string) => {
    setSelectedTemplateId(value);
    const selectedTemplate = templates.find(t => t.id === value);
    if (selectedTemplate) {
      applyTemplate(selectedTemplate);
    }
  };

  interface ReportDisplayData {
    [key: string]: string | string[] | undefined; // Index signature for dynamic access
    ticket_key: string;
    ticket_name: string;
    log_source: string;
    date_of_incident: string;
    priority: string;
    src_ip: string;
    device_hostname: string;
    username: string;
    threat_category: string;
    threat_name?: string;
    incident_description: string;
    action_taken: string;
    ip_analysis: string;
    domain_analysis: string;
    filehash_analysis: string;
    description?: string;
    recommendation_action: string;
    raw_logs?: string;
    incident_number?: string;
    tags?: string[];
    severity?: string;
  }

  const [reportDisplayData, setReportDisplayData] = useState<ReportDisplayData>({
    ticket_key: '',
    ticket_name: '',
    log_source: '',
    date_of_incident: '',
    priority: '',
    src_ip: '',
    device_hostname: '',
    username: '',
    threat_category: '',
    threat_name: '',
    incident_description: '',
    action_taken: '',
    ip_analysis: '',
    domain_analysis: '',
    filehash_analysis: '',
    description: '',
    recommendation_action: '',
  });

  // ReportDisplay states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const [editingFieldValue, setEditingFieldValue] = useState<string>('');
  const editorRef = useRef<Editor | null>(null);
  const [extractedValues, setExtractedValues] = useState({
    src_ip: '',
    device_hostname: '',
    username: '',
    ticket_id: '',
    threat_category: '',
    ticket_name: '',
    action_taken: ''
  });

  // AnalystEnrichmentSection states
  interface AnalystEnrichment {
    threatIndicatorIP: string;
    threatIndicatorHash: string;
    threatIndicatorDomain: string;
    threatName: string;
    threatCategory: string;
    description: string;
    recommendation: string;
  }
  const [isEnrichmentEditing, setIsEnrichmentEditing] = useState(true);
  const [enrichmentData, setEnrichmentData] = useState<AnalystEnrichment>({
    threatIndicatorIP: '',
    threatIndicatorHash: '',
    threatIndicatorDomain: '',
    threatName: '',
    threatCategory: '',
    description: '',
    recommendation: 'Please refer to security playbook for remediation steps'
  });
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const lastSentIndicatorsRef = useRef<{ ip: string; domain: string; hash: string }>({ ip: '', domain: '', hash: '' });

  const extractFromRawLogs = (raw: unknown): { log_source?: string; alert_date?: string } => {
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const firstRecord = Array.isArray(parsed)
        ? parsed[0]
        : Array.isArray((parsed as { records?: unknown[] })?.records)
          ? (parsed as { records: unknown[] }).records[0]
          : parsed && typeof parsed === 'object'
            ? parsed
            : undefined;

      if (!firstRecord || typeof firstRecord !== 'object') return {};

      const vendor = (firstRecord as { device_vendor?: string }).device_vendor || (firstRecord as { vendor?: string }).vendor || (firstRecord as { vendor_name?: string }).vendor_name;
      const product = (firstRecord as { device_product?: string }).device_product || (firstRecord as { product?: string }).product || (firstRecord as { product_name?: string }).product_name;
      const log_source = [vendor, product].filter(Boolean).join(' ').trim();

      let alert_date: string | undefined = (firstRecord as { TimeGenerated?: string }).TimeGenerated || (firstRecord as { event_timestamp?: string }).event_timestamp || (firstRecord as { timestamp?: string }).timestamp;
      if (!alert_date && (firstRecord as { rt?: string }).rt) {
        const millis = Number((firstRecord as { rt: string }).rt);
        if (!Number.isNaN(millis)) {
          alert_date = new Date(millis).toISOString();
        }
      }
      return { log_source: log_source || undefined, alert_date };
    } catch {
      return {};
    }
  };

  const extractHtmlContent = (html: string, keyword: string) => {
    const regex = new RegExp(`(<p>)?#${keyword}\\s*:\\s*(.*?)(?=<p>#|$)`, 'gis');
    const matches = Array.from(html.matchAll(regex));
    const last = matches.length ? matches[matches.length - 1] : null;
    return last ? (last[2]?.trim() ?? '') : '';
  };

  // ReportDisplay functions
  const extractValuesFromRawLogs = (rawLogsString: string) => {
    const result = {
      src_ip: '',
      device_hostname: '',
      username: '',
      ticket_id: incident?.incident_number || '',
      ticket_name: '',
      action_taken: ''
    };

    try {
      const parsed = JSON.parse(rawLogsString);
      const logs = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { records?: unknown[] })?.records)
          ? (parsed as { records: unknown[] }).records
          : [parsed];
      if (Array.isArray(logs) && logs.length > 0) {
        const firstLog: Record<string, unknown> = logs[0] || {};

        // Extract Source IP with multiple fallbacks
        result.src_ip = (firstLog.extracted_ip as string || '')
          || (firstLog.src as string || '')
          || (firstLog.source_ip as string || '')
          || (firstLog.SourceIP as string || '')
          || (firstLog.sourceAddress as string || '')
          || (firstLog.client_ip as string || '')
          || (firstLog.ip as string || '')
          || (firstLog.src_ip as string || '')
          || '';

        // Extract Hostname with multiple fallbacks and nested JSON support
        let hostname: string | object = (firstLog.extracted_hostname as string || '')
          || (firstLog.hostname as string || '')
          || (firstLog.dhost as string || '')
          || (firstLog.device_hostname as string || '')
          || (firstLog.deviceHostName as string || '')
          || (firstLog.device_name as string || '')
          || (firstLog.host_name as string || '')
          || (firstLog.host as string || '')
          || '';

        if (typeof hostname === 'string') {
          const trimmed = hostname.trim();
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
              const parsedHost = JSON.parse(trimmed.replace(/'/g, '"'));
              hostname = parsedHost?.name || parsedHost?.hostName || parsedHost?.hostname || hostname;
            } catch {
              // keep as is if not parseable
            }
          }
        } else if (hostname && typeof hostname === 'object') {
          hostname = (hostname as { name?: string; hostName?: string; hostname?: string }).name || (hostname as { name?: string; hostName?: string; hostname?: string }).hostName || (hostname as { name?: string; hostName?: string; hostname?: string }).hostname || '';
        }
        result.device_hostname = typeof hostname === 'string' ? hostname : String(hostname || '');

        // Extract Username with multiple fallbacks and basic nested JSON handling
        let user: string | object = (firstLog.extracted_username as string || '')
          || (firstLog.username as string || '')
          || (firstLog.user as string || '')
          || (firstLog.suser as string || '')
          || (firstLog.account as string || '')
          || (firstLog.account_name as string || '')
          || (firstLog.accountName as string || '')
          || (firstLog.user_name as string || '')
          || (firstLog.src_user as string || '')
          || '';
        if (typeof user === 'string') {
          const uTrim = user.trim();
          if (uTrim.startsWith('{') || uTrim.startsWith('[')) {
            try {
              const parsedUser = JSON.parse(uTrim.replace(/'/g, '"'));
              user = parsedUser?.name || parsedUser?.accountName || parsedUser?.username || user;
            } catch {
              // keep as-is
            }
          } else if (user && typeof user === 'object') {
            user = (user as { name?: string; accountName?: string; username?: string }).name || (user as { name?: string; accountName?: string; username?: string }).accountName || (user as { name?: string; accountName?: string; username?: string }).username || '';
          }
          result.username = typeof user === 'string' ? user : String(user || '');

          // Extract action taken with fallbacks
          result.action_taken = (firstLog.action as string || '')
            || (firstLog.act as string || '')
            || (firstLog.action_taken as string || '')
            || (firstLog.disposition as string || '')
            || (firstLog.speroDisposition as string || '')
            || '';

          // Build ticket name from log_source, src_ip, and severity
          const logSource = incident?.log_source || firstLog.leef_vendor || firstLog.device_vendor || firstLog.vendor || 'Unknown';
          const severity = incident?.severity || firstLog.LogSeverity || firstLog.SeverityDescription || firstLog.severity || 'Unknown';
          result.ticket_name = `${logSource}/${result.src_ip || 'unknown'}/${severity}`;
        }
      }
    } catch (error) {
      console.error('Error parsing raw logs:', error);
    }

    return result;
  };

  const handleReportClick = (fieldKey: string, value: string | string[] | undefined) => {
    // Ensure the field key is a valid key of ReportDisplayData
    if (!(fieldKey in reportDisplayData)) {
      console.warn(`Invalid field key: ${fieldKey}`);
      return;
    }
    
    // Set the field key as string (since editingFieldKey is now string | null)
    setEditingFieldKey(fieldKey);
    
    // Convert value to string if it's an array or undefined
    const stringValue = Array.isArray(value) 
      ? value.join(', ')
      : value || '';
      
    setEditingFieldValue(stringValue);
    setIsReportModalOpen(true);
  };

  const handleReportSave = async () => {
    if (!editingFieldKey || !incident) {
      setIsReportModalOpen(false);
      setEditingFieldKey(null);
      setEditingFieldValue('');
      return;
    }

    // Ensure the field key is a valid key of ReportDisplayData
    if (!(editingFieldKey in reportDisplayData)) {
      console.warn(`Invalid field key: ${editingFieldKey}`);
      setIsReportModalOpen(false);
      setEditingFieldKey(null);
      setEditingFieldValue('');
      return;
    }

    // Type assertion to ensure the key is valid for ReportDisplayData
    const validFieldKey = editingFieldKey as keyof ReportDisplayData;
    
    // Only update if the field is a string field
    const currentValue = reportDisplayData[validFieldKey as keyof typeof reportDisplayData];
    if (currentValue !== undefined && typeof currentValue !== 'string') {
      console.warn(`Cannot update non-string field: ${editingFieldKey}`);
      setIsReportModalOpen(false);
      setEditingFieldKey(null);
      setEditingFieldValue('');
      return;
    }

    const prevReportData = { ...reportDisplayData };
    const updatedReportData: ReportDisplayData = {
      ...prevReportData,
      [validFieldKey]: editingFieldValue,
    };

    // Sync changes to enrichmentData if they are threat indicators
    if (editingFieldKey === 'ip_analysis') {
      setEnrichmentData(prevEnrichment => ({
        ...prevEnrichment,
        threatIndicatorIP: editingFieldValue,
      }));
    } else if (editingFieldKey === 'domain_analysis') {
      setEnrichmentData(prevEnrichment => ({
        ...prevEnrichment,
        threatIndicatorDomain: editingFieldValue,
      }));
    } else if (editingFieldKey === 'filehash_analysis') {
      setEnrichmentData(prevEnrichment => ({
        ...prevEnrichment,
        threatIndicatorHash: editingFieldValue,
      }));
    } else if (editingFieldKey === 'incident_description') {
      setEnrichmentData(prevEnrichment => ({
        ...prevEnrichment,
        description: editingFieldValue,
      }));
    } else if (editingFieldKey === 'recommendation_action') {
      setEnrichmentData(prevEnrichment => ({
        ...prevEnrichment,
        recommendation: editingFieldValue,
      }));
    }

    setReportDisplayData(updatedReportData);

    // Save to incident_report_versions table
    try {
      const changeSummary = `Updated ${getFieldLabel(editingFieldKey)}: ${editingFieldValue.substring(0, 100)}...`;
      
      const generateReportHtml = (reportData: ReportDisplayData, enrichment: AnalystEnrichment) => {
        return `
<table border="1" cellspacing="0" cellpadding="6">
  <tbody>
    <tr>
      <td><b>Ticket ID</b></td>
      <td><span>${reportData.ticket_key}</span></td>
    </tr>
    <tr>
      <td><b>Ticket Name</b></td>
      <td><span>${reportData.ticket_name}</span></td>
    </tr>
    <tr>
      <td><b>Log Source</b></td>
      <td><span>${reportData.log_source}</span></td>
    </tr>
    <tr>
      <td><b>Alert Date</b></td>
      <td><span>${reportData.date_of_incident}</span></td>
    </tr>
    <tr>
      <td><b>Severity Level</b></td>
      <td><span>${reportData.priority}</span></td>
    </tr>
    <tr>
      <td><b>Entity</b></td>
      <td>
        <div>Source IP: <span>${reportData.src_ip}</span></div>
        <div>Asset Hostname: <span>${reportData.device_hostname}</span></div>
        <div>Username: <span>${reportData.username}</span></div>
      </td>
    </tr>
    <tr>
      <td><b>Description</b></td>
      <td>
        <div>Threat Category: <span>${enrichment.threatCategory ?? reportData.threat_category}</span></div>
        <div>${enrichment.description}</div>
        <div>
          Saat ini, <span>${reportData.log_source}</span> telah melakukan tindakan
          ${reportData.action_taken} terhadap file trojan berikut.
        </div>
      </td>
    </tr>
    <tr>
      <td><b>Threat Indicators</b></td>
      <td>
        <div>1. IP analysis: ${enrichment.threatIndicatorIP}</div>
        <div>2. Domain analysis: ${enrichment.threatIndicatorDomain}</div>
        <div>3. Filehash analysis: ${enrichment.threatIndicatorHash}</div>
      </td>
    </tr>
    <tr>
      <td><b>Technical Recommendation</b></td>
      <td>${enrichment.recommendation}</td>
    </tr>
  </tbody>
</table>
        `;
      };

      const reportHtmlContent = generateReportHtml(updatedReportData, enrichmentData);

      await saveReportVersion({
        incidentId: incident.incident_id,
        content: JSON.stringify(updatedReportData),
        content_html: reportHtmlContent,
        createdBy: incident.analyst_code || 'unknown_analyst',
        changeSummary: changeSummary,
      });
    } catch (error) {
      console.error("Failed to save report version:", error);
      toast({
        title: "Error",
        description: "Failed to save report version. Please try again.",
        variant: "destructive",
      });
    }

    setIsReportModalOpen(false);
    setEditingFieldKey(null);
    setEditingFieldValue('');
  };

  const handleReportCancel = () => {
    setIsReportModalOpen(false);
    setEditingFieldKey(null);
    setEditingFieldValue('');
  };

  const getFieldLabel = (key: keyof ReportDisplayData) => {
    switch (key) {
      case 'ticket_key': return 'Ticket ID';
      case 'ticket_name': return 'Ticket Name';
      case 'log_source': return 'Log Source';
      case 'date_of_incident': return 'Alert Date';
      case 'priority': return 'Severity Level';
      case 'src_ip': return 'Source IP';
      case 'device_hostname': return 'Asset Hostname';
      case 'username': return 'Username';
      case 'threat_name': return 'Threat Name';
      case 'threat_category': return 'Threat Category';
      case 'incident_description': return 'Incident Description';
      case 'action_taken': return 'Action Taken';
      case 'ip_analysis': return 'IP Analysis';
      case 'domain_analysis': return 'Domain Analysis';
      case 'filehash_analysis': return 'Filehash Analysis';
      case 'description': return 'Description';
      case 'recommendation_action': return 'Recommendation';
      default: return '';
    }
  };

  // AnalystEnrichmentSection functions
  const isHtml = (str: string) => /<[a-z][\s\S]*>/i.test(str);

  const ensureHtml = (content: string | null | undefined) => {
    if (!content) return '';
    if (isHtml(content)) {
      return content;
    }
    return `<p>${content}</p>`;
  };

  const formatThreatIndicator = (indicator: string | object | null) => {
    if (!indicator) return '';

    if (typeof indicator === 'string') {
      try {
        // If it's a stringified JSON, parse it
        const parsed = JSON.parse(indicator);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return indicator; // Return as is if not JSON
      }
    }

    // If it's already an object, stringify it with pretty print
    return JSON.stringify(indicator, null, 2);
  };

  const parseDescription = (description: string | object | null) => {
    if (!description) return '';
    try {
      if (typeof description === 'string') {
        const parsed = JSON.parse(description);
        return parsed.description || parsed.alert || '';
      }
      return (description as { description?: string; alert?: string }).description || (description as { description?: string; alert?: string }).alert || '';
    } catch (e) {
      return description as string;
    }
  };

  const parseRecommendations = (recommendation: string | string[] | null) => {
    if (!recommendation) return '';
    try {
      if (Array.isArray(recommendation)) {
        return recommendation.join('\n\n');
      } else if (typeof recommendation === 'string') {
        try {
          const parsed = JSON.parse(recommendation);
          return Array.isArray(parsed) ? parsed.join('\n\n') : parsed;
        } catch {
          return recommendation;
        }
      }
      return recommendation;
    } catch (e) {
      return recommendation as string;
    }
  };

  const handleEnrichmentInputChange = (field: keyof AnalystEnrichment, value: string) => {
    setEnrichmentData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // Sync changes to reportDisplayData if they are threat indicators or description/recommendation
      if (field === 'threatIndicatorIP') {
        setReportDisplayData(prevReport => ({
          ...prevReport,
          ip_analysis: value,
        }));
      } else if (field === 'threatIndicatorDomain') {
        setReportDisplayData(prevReport => ({
          ...prevReport,
          domain_analysis: value,
        }));
      } else if (field === 'threatIndicatorHash') {
        setReportDisplayData(prevReport => ({
          ...prevReport,
          filehash_analysis: value,
        }));
      } else if (field === 'description') {
        setReportDisplayData(prevReport => ({
          ...prevReport,
          incident_description: value,
        }));
      } else if (field === 'recommendation') {
        setReportDisplayData(prevReport => ({
          ...prevReport,
          recommendation_action: value,
        }));
      }
      return newData;
    });
  };

  const initializeReportDataFromIncident = useCallback(() => {
    if (!incident) return;

    const { log_source, alert_date } = extractFromRawLogs(incident.raw_logs);

    let allCommentsMessage = '';
    if (incident.comments && Array.isArray(incident.comments)) {
      allCommentsMessage = incident.comments
        .map((c: unknown) => {
          try {
            const parsed = JSON.parse(c as string);
            return parsed?.properties?.message || '';
          } catch (error) {
            console.error('Error parsing comment:', error);
            return '';
          }
        })
        .join('');
    }

    const extractedValuesFromRawLogs = extractValuesFromRawLogs(incident.raw_logs || ''); // Ensure raw_logs is a string

    setReportDisplayData({
      ticket_key: incident.incident_number || 'NOT_FOUND',
      ticket_name: incident.log_source + "/" + extractedValuesFromRawLogs.src_ip + "/" + incident.priority + "/" + (extractedValuesFromRawLogs.action_taken || "NA")  || 'NOT_FOUND',
      log_source: incident.log_source || log_source || 'NOT_FOUND',
      date_of_incident: alert_date ? new Date(alert_date).toLocaleString() : 'NOT_FOUND',
      priority: incident.priority || 'NOT_FOUND',
      src_ip: extractedValuesFromRawLogs.src_ip || 'NOT_FOUND',
      device_hostname: extractedValuesFromRawLogs.device_hostname || 'NOT_FOUND',
      username: extractedValuesFromRawLogs.username || 'NOT_FOUND',
      threat_category: enrichmentData.threatCategory || 'NOT_FOUND',
      incident_description: extractHtmlContent(allCommentsMessage, 'description') || incident.description || 'NOT_FOUND',
      action_taken: extractedValuesFromRawLogs.action_taken || 'NOT_FOUND',
      ip_analysis: extractHtmlContent(allCommentsMessage, 'threat_indicators') || '',
      domain_analysis: extractHtmlContent(allCommentsMessage, 'threat_indicators') || '',
      filehash_analysis: extractHtmlContent(allCommentsMessage, 'threat_indicators') || '',
      description: extractHtmlContent(allCommentsMessage, 'description') || incident.description || 'NOT_FOUND',
      recommendation_action: extractHtmlContent(allCommentsMessage, 'recommendation') || incident.recommendation || 'NOT_FOUND',
    });

    // Initialize enrichmentData from incident.threat_indicator
    const { ip, hash, domain } = incident.threat_indicator || {};


    setEnrichmentData(prev => ({
      ...prev,
      threatIndicatorIP: ensureHtml(formatThreatIndicator(ip)),
      threatIndicatorHash: ensureHtml(formatThreatIndicator(hash)),
      threatIndicatorDomain: ensureHtml(formatThreatIndicator(domain)),
      threatCategory: incident.tags?.find(tag => {
        try {
          const parsedTag = JSON.parse(tag);
          return typeof parsedTag.labelName === 'string' && parsedTag.labelName.includes('*');
        } catch {
          return false;
        }
      }) ? JSON.parse(incident.tags.find(tag => {
        try {
          const parsedTag = JSON.parse(tag);
          return typeof parsedTag.labelName === 'string' && parsedTag.labelName.includes('*');
        } catch {
          return false;
        }
      }) || '{}').labelName : prev.threatCategory,
      description: ensureHtml(parseDescription(incident.description) || prev.description),
      recommendation: ensureHtml(parseRecommendations(incident.recommendation) || prev.recommendation)
    }));
  }, [incident, formatThreatIndicator, parseDescription, parseRecommendations, ensureHtml, extractValuesFromRawLogs]);

  useEffect(() => {
    if (!incident || isLoadingReportVersion) return;

    if (currentReportVersion) {
      try {
        const reportData = currentReportVersion as IncidentReportVersion; // Explicitly cast
        // Prioritize content_html if available, otherwise use content
        const parsedContent = JSON.parse(reportData.content);
        const extractedFromRawLogs = extractValuesFromRawLogs(incident.raw_logs || '');

        const mergedReportData: ReportDisplayData = {
          ...extractedFromRawLogs,
          ...parsedContent,
          src_ip: parsedContent.src_ip || extractedFromRawLogs.src_ip || '',
          device_hostname: parsedContent.device_hostname || extractedFromRawLogs.device_hostname || '',
          username: parsedContent.username || extractedFromRawLogs.username || '',
          action_taken: ensureHtml(parsedContent.action_taken || extractedFromRawLogs.action_taken || ''),
          ticket_name: parsedContent.ticket_name || extractedFromRawLogs.ticket_name || '',
          ticket_key: parsedContent.ticket_key || extractedFromRawLogs.ticket_id || incident.incident_number || '',
        };

        if (JSON.stringify(mergedReportData) !== JSON.stringify(reportDisplayData)) {
          setReportDisplayData(mergedReportData);
        }

        const { ip, hash, domain } = incident.threat_indicator || {};

        const newEnrichmentData = {
          ...enrichmentData,
          threatIndicatorIP: ensureHtml(mergedReportData.ip_analysis || formatThreatIndicator(ip)),
          threatIndicatorDomain: ensureHtml(mergedReportData.domain_analysis || formatThreatIndicator(domain)),
          threatIndicatorHash: ensureHtml(mergedReportData.filehash_analysis || formatThreatIndicator(hash)),
          description: ensureHtml(mergedReportData.incident_description || parseDescription(incident.description) || ''),
          recommendation: ensureHtml(mergedReportData.recommendation_action || parseRecommendations(incident.recommendation) || ''),
          threatCategory: incident.threat_type || enrichmentData.threatCategory,
        };

        if (JSON.stringify(newEnrichmentData) !== JSON.stringify(enrichmentData)) {
          setEnrichmentData(newEnrichmentData);
        }

      } catch (e) {
        console.error("Error parsing current report version content:", e);
        initializeReportDataFromIncident();
      }
    } else {
      initializeReportDataFromIncident();
    }
  }, [incident, currentReportVersion, isLoadingReportVersion, initializeReportDataFromIncident, formatThreatIndicator, parseDescription, parseRecommendations, reportDisplayData, enrichmentData, ensureHtml]);

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

      const requestData = {
        id: typeof requestChange.id === 'number' ? requestChange.id.toString() : requestChange.id,
        status: 'waiting for approval'
      };
      setRequestData(requestData);
      setRequestSubmitted(true);
      
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

  useEffect(() => {
    const checkExistingRequest = async () => {
      if (!incident) return;
      
      try {
        setTemplatesLoading(true);
        
        const storedRequest = localStorage.getItem(`request_${incident.incident_number}`);
        if (storedRequest) {
          const parsed = JSON.parse(storedRequest);
          setRequestData(parsed);
          setRequestSubmitted(true);
          return;
        }
        
        const { data: existingRequest, error } = await supabase
          .from('request_changes')
          .select('id, status')
          .eq('incident_number', incident.incident_number)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (error) throw error;
        
        if (existingRequest) {
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
  }, [incident]);

  const sendEmail = async () => {
    if (!incident || !reportDisplayData.recommendation_action) return;
    
    setIsSendingEmail(true);
    
    const payload = {
      incidentId: incident.id,
      customerName: incident.customer_name,
      recipients: ["harry.sunaryo@compnet.co.id"],
      incidentNumber: incident.incident_number,
      priority: incident.priority,
      analystName: incident.analyst_name,
      recommendation: reportDisplayData.recommendation_action,
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
    if (incident && incident.status !== currentStatus) {
      setCurrentStatus(incident.status);
    }
  }, [incident, currentStatus]);

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
              <span>Customer Report
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
                )}</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-mode"
                    checked={isEditMode}
                    onCheckedChange={setIsEditMode}
                  />
                  <Label htmlFor="edit-mode" className="text-sm">
                    Edit Mode
                  </Label>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-2">
            {!isCustomerPortal && <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <Label>Template:</Label>
                  </div>
                  <Select
                    value={selectedTemplateId}
                    onValueChange={handleTemplateChange}
                    disabled={templatesLoading}
                  >
                    <SelectTrigger className="w-100">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates?.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            {template.name}
                            {template.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                            {/* <Badge variant="default" className="text-xs">Edit</Badge> */}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    Edit 
                  </Button>
                </div>
              </div>}
            </div>

              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-bold w-1/3">Ticket ID</td>
                    <td className="px-4 py-2">
                      <div className={`inline-block ${isEditMode ? 'cursor-pointer' : ''}`} onClick={() => isEditMode && handleReportClick('ticket_key', reportDisplayData.ticket_key)}>
                        <span className="bg-pink-200">
                          {isEditMode ? `{{ticket_key}}` : reportDisplayData.ticket_key}
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-bold">Ticket Name</td>
                    <td className="px-4 py-2">
                      <div className={`inline-block ${isEditMode ? 'cursor-pointer' : ''}`} onClick={() => isEditMode && handleReportClick('ticket_name', reportDisplayData.ticket_name)}>
                        <span className="bg-pink-200">
                          {isEditMode ? `{{ticket_name}}` : reportDisplayData.ticket_name}
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-bold">Log Source</td>
                    <td className="px-4 py-2">
                      <div className={`inline-block ${isEditMode ? 'cursor-pointer' : ''}`} onClick={() => isEditMode && handleReportClick('log_source', reportDisplayData.log_source)}>
                        <span className="bg-pink-200">
                          {isEditMode ? `{{log_source}}` : reportDisplayData.log_source}
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-bold">Alert Date</td>
                    <td className="px-4 py-2">
                      <div className={`inline-block ${isEditMode ? 'cursor-pointer' : ''}`} onClick={() => isEditMode && handleReportClick('date_of_incident', reportDisplayData.date_of_incident)}>
                        <span className="bg-pink-200">
                          {isEditMode ? `{{date_of_incident}}` : reportDisplayData.date_of_incident}
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-bold">Severity Level</td>
                    <td className="px-4 py-2">
                      <div className={`inline-block ${isEditMode ? 'cursor-pointer' : ''}`} onClick={() => isEditMode && handleReportClick('priority', reportDisplayData.priority)}>
                        <span className="bg-pink-200">
                          {isEditMode ? `{{priority}}` : reportDisplayData.priority}
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-bold">Entity</td>
                    <td className="px-4 py-2">
                      <div>Source IP: <div className={`inline-block ${isEditMode ? 'cursor-pointer' : ''}`} onClick={() => isEditMode && handleReportClick('src_ip', reportDisplayData.src_ip)}><span className="bg-pink-200">{isEditMode ? `{{src_ip}}` : reportDisplayData.src_ip}</span></div></div>
                      <div>Asset Hostname: <div className={`inline-block ${isEditMode ? 'cursor-pointer' : ''}`} onClick={() => isEditMode && handleReportClick('device_hostname', reportDisplayData.device_hostname)}><span className="bg-pink-200">{isEditMode ? `{{device_hostname}}` : reportDisplayData.device_hostname}</span></div></div>
                      <div>Username: <div className={`inline-block ${isEditMode ? 'cursor-pointer' : ''}`} onClick={() => isEditMode && handleReportClick('username', reportDisplayData.username)}><span className="bg-pink-200">{isEditMode ? `{{username}}` : reportDisplayData.username}</span></div></div>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-bold">Description</td>
                    <td className="px-4 py-2">
                      <div>Threat Category: <div className={`inline-block ${isEditMode ? 'cursor-pointer' : ''}`} onClick={() => isEditMode && handleReportClick('threat_category', enrichmentData.threatCategory)}><span className="bg-pink-200">{isEditMode ? `{{threat_category}}` : (enrichmentData.threatCategory ?? reportDisplayData.threat_category)}</span></div></div>
                      <div><div className={`inline-block ${isEditMode ? 'cursor-pointer' : ''}`} onClick={() => isEditMode && handleReportClick('incident_description', reportDisplayData.incident_description)}><HtmlVariableDisplay content={enrichmentData.description} isEditMode={isEditMode} variableName="incident_description" /></div></div>
                      <div>
                        Saat ini, <div className={`inline-block ${isEditMode ? 'cursor-pointer' : ''}`} onClick={() => isEditMode && handleReportClick('log_source', reportDisplayData.log_source)}><span className="bg-pink-200">{isEditMode ? `{{log_source}}` : reportDisplayData.log_source}</span></div> telah melukan tindakan <div className={`inline-block ${isEditMode ? 'cursor-pointer' : ''}`} onClick={() => isEditMode && handleReportClick('action_taken', reportDisplayData.action_taken)}><HtmlVariableDisplay content={reportDisplayData.action_taken} isEditMode={isEditMode} variableName="action_taken" /></div> terhadap file trojan berikut.
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-bold">Threat Indicators</td>
                    <td className="px-4 py-2">
                      <div>1. IP analysis: <div className={`inline-block ${isEditMode ? 'cursor-pointer' : ''}`} onClick={() => isEditMode && handleReportClick('ip_analysis', enrichmentData.threatIndicatorIP)}><HtmlVariableDisplay content={enrichmentData.threatIndicatorIP} isEditMode={isEditMode} variableName="ip_analysis" /></div></div>
                      <div>2. Domain analysis: <div className={`inline-block ${isEditMode ? 'cursor-pointer' : ''}`} onClick={() => isEditMode && handleReportClick('domain_analysis', enrichmentData.threatIndicatorDomain)}><HtmlVariableDisplay content={enrichmentData.threatIndicatorDomain} isEditMode={isEditMode} variableName="domain_analysis" /></div></div>
                      <div>3. Filehash analysis: <div className={`inline-block ${isEditMode ? 'cursor-pointer' : ''}`} onClick={() => isEditMode && handleReportClick('filehash_analysis', enrichmentData.threatIndicatorHash)}><HtmlVariableDisplay content={enrichmentData.threatIndicatorHash} isEditMode={isEditMode} variableName="filehash_analysis" /></div></div>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-bold">Technical Recommendation</td>
                    <td className="px-4 py-2">
                      <div className={`inline-block ${isEditMode ? 'cursor-pointer' : ''}`} onClick={() => isEditMode && handleReportClick('recommendation_action', reportDisplayData.recommendation_action)}>
                        <HtmlVariableDisplay content={enrichmentData.recommendation} isEditMode={isEditMode} variableName="recommendation_action" />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Edit {editingFieldKey ? getFieldLabel(editingFieldKey) : 'Value'}</DialogTitle>
                    <DialogDescription>
                      Update the value for {editingFieldKey ? getFieldLabel(editingFieldKey) : 'this field'}.
                    </DialogDescription>
                  </DialogHeader>

                  {editingFieldKey && ['incident_description', 'action_taken', 'ip_analysis', 'domain_analysis', 'filehash_analysis', 'description', 'recommendation_action'].includes(editingFieldKey) ? (
                    <div className="mt-4">
                      <Editor
                        apiKey='9pxbmembo1uetj3qto7w4t0ce6vi14e321zvnvyip544v0yi'
                        onInit={(evt, editor) => (editorRef.current = editor)}
                        value={editingFieldValue}
                        init={{
                          height: 300,
                          menubar: false,
                          plugins: [
                            'advlist autolink lists link image charmap print preview anchor',
                            'searchreplace visualblocks code fullscreen',
                            'insertdatetime media table paste code help wordcount'
                          ],
                          toolbar: 'undo redo | formatselect | ' +
                            'bold italic backcolor | alignleft aligncenter ' +
                            'alignright alignjustify | bullist numlist outdent indent | ' +
                            'removeformat | help',
                          content_style: 'body { font-family:Inter,sans-serif; font-size:14px }',
                        }}
                        onEditorChange={(content) => setEditingFieldValue(content)}
                      />
                    </div>
                  ) : (
                    <Input
                      value={editingFieldValue}
                      onChange={(e) => setEditingFieldValue(e.target.value)}
                      className="mt-4"
                    />
                  )}

                  <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={handleReportCancel}>Cancel</Button>
                    <Button onClick={handleReportSave}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="investigation" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="investigation">Investigation Result</TabsTrigger>
            <TabsTrigger value="details">Incident Details</TabsTrigger>
            <TabsTrigger value="entities">Entities</TabsTrigger>
            <TabsTrigger value="raw-logs">Raw Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="investigation" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Investigation Result
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {autoSaveStatus === 'saving' && (
                      <Badge variant="secondary" className="text-xs">Saving...</Badge>
                    )}
                    {autoSaveStatus === 'saved' && (
                      <Badge variant="outline" className="text-xs">Saved</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6">
                  {/* Left Column - Threat Indicators */}
                  <div className="space-y-4">

                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="threatCategory" className="text-xs font-medium">
                          Alert Name
                        </Label>
                       <Card className="p-2 rounded text-xs flex items-center justify-between">
                          <span>{enrichmentData.threatName || ''}</span>
                          {/* //button edit */}
                          <button
                            className="text-blue-500 hover:underline"
                            onClick={() => handleReportClick('threat_name', reportDisplayData.threat_name)}
                          >
                            Edit
                          </button>
                        </Card>
                      </div>
                      <div>
                        <Label htmlFor="threatCategory" className="text-xs font-medium">
                          Threat Category
                        </Label>
                       <Card className="p-2 rounded text-xs flex items-center justify-between">
                          <span>{enrichmentData.threatCategory || ''}</span>
                          {/* //button edit */}
                          <button
                            className="text-blue-500 hover:underline"
                            onClick={() => handleReportClick('threat_category', reportDisplayData.threat_category || enrichmentData.threatCategory)}
                          >
                            Edit
                          </button>
                        </Card>
                      </div>
                      <div>
                        <Label htmlFor="threatIP" className="text-xs font-medium">
                          Threat Indicator - IP
                        </Label>
                        <Card className="p-2 rounded text-xs flex items-center justify-between">
                            <span dangerouslySetInnerHTML={{ __html: enrichmentData.threatIndicatorIP || 'N/A' }}></span>
                            {/* //button edit */}
                            <button
                              className="text-blue-500 hover:underline"
                              onClick={() => handleReportClick('ip_analysis', reportDisplayData.ip_analysis)}
                            >
                              Edit
                            </button>
                          </Card>
                      </div>

                      <div>
                        <Label htmlFor="threatHash" className="text-xs font-medium">
                          Threat Indicator - Hash
                        </Label>
                       <Card className="p-2 rounded text-xs flex items-center justify-between">
                          <span dangerouslySetInnerHTML={{ __html: enrichmentData.threatIndicatorHash || 'N/A' }}></span>
                          {/* //button edit */}
                          <button
                            className="text-blue-500 hover:underline"
                            onClick={() => handleReportClick('filehash_analysis', reportDisplayData.filehash_analysis)}
                          >
                            Edit
                          </button>
                        </Card>
                      </div>

                      <div>
                        <Label htmlFor="threatDomain" className="text-xs font-medium">
                          Threat Indicator - Domain
                        </Label>
                       <Card className="p-2 rounded text-xs flex items-center justify-between">
                          <span dangerouslySetInnerHTML={{ __html: enrichmentData.threatIndicatorDomain || 'N/A' }}></span>
                          {/* //button edit */}
                          <button
                            className="text-blue-500 hover:underline"
                            onClick={() => handleReportClick('domain_analysis', reportDisplayData.domain_analysis)}
                          >
                            Edit
                          </button>
                        </Card>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="description" className="text-xs font-medium">
                          Description
                        </Label>
                       <Card className="p-2 rounded text-xs flex items-center justify-between">
                          <span dangerouslySetInnerHTML={{ __html: enrichmentData.description || 'N/A' }}></span>
                          {/* //button edit */}
                          <button
                            className="text-blue-500 hover:underline"
                            onClick={() => handleReportClick('description', reportDisplayData.description)}
                          >
                            Edit
                          </button>
                        </Card>
                      </div>
                      <div>
                        <Label htmlFor="recommendation" className="text-xs font-medium flex items-center gap-2">
                          Recommendation
                        </Label>
                       <Card className="p-2 rounded text-xs flex items-center justify-between">
                          <span dangerouslySetInnerHTML={{ __html: enrichmentData.recommendation || 'N/A' }}></span>
                          {/* //button edit */}
                          <button
                            className="text-blue-500 hover:underline"
                            onClick={() => handleReportClick('recommendation_action', reportDisplayData.recommendation_action)}
                          >
                            Edit
                          </button>
                        </Card>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-6 mt-6">
            <IncidentDetailsExtraction 
              rawLogs={incident.raw_logs} 
              creationTime={incident.creation_time}
              priority={incident.priority}
            />
          </TabsContent>

          <TabsContent value="entities" className="space-y-6 mt-6"> 
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
          incident={incident} // Pass the entire incident object
          onSendEmail={sendEmail} // Pass the sendEmail function
          isSendingEmail={isSendingEmail} // Pass the isSendingEmail state
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
                        Need Change
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
                          Need Change
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
                  {requestChanges.length > 0 && (
                    <div key={requestChanges[0].id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Change Request</p>
                          <p className="text-sm text-muted-foreground">
                          Requested by: {requestChanges[0].analyst_name || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-sm font-medium">Assets:</p>
                        <p className="text-sm">{requestChanges[0].assets || 'No assets specified'}</p>
                      </div>
                      
                      <Badge variant="outline">
                          {requestChanges[0].status}
                        </Badge>
                    </div>
                  )}
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

