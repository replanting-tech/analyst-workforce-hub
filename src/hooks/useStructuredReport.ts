import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define the field keys we want to display outside the component to prevent recreation
// This is now moved to the StructuredReport component
/*
const DISPLAY_FIELDS = [
  'ticket_id',
  'ticket_name',
  'log_source',
  'alert_date',
  'incident_severity',
  'entity',
  'description',
  'threat_indicators',
  'technical_recommendation',
  'analyst_notes' // Added analyst_notes to DISPLAY_FIELDS
] as const;
*/

// Define the incident type based on your database schema
interface Incident {
  incident_id: string;
  incident_number?: string;
  title?: string;
  source?: string;
  priority?: string;
  status?: string;
  description?: string;
  recommendation?: string;
  analysis?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // For any additional fields
}

export interface ReportField {
  id: string;
  key: string;
  value: string;
  isEditable: boolean;
  required: boolean;
  isEditing?: boolean; // Add optional isEditing flag for UI state
}

interface StructuredReport {
  incident_id: string;
  fields: ReportField[];
}

interface UseStructuredReportReturn {
  fields: ReportField[];
  isLoading: boolean;
  error: Error | null;
  saveReport: (fields: ReportField[]) => Promise<IncidentReportVersion>;
  refetch: () => Promise<void>;
  lookupOriginalFieldValue: (fieldId: string) => Promise<string | undefined>;
}

interface IncidentReportVersion {
  id: string;
  incident_id: string;
  version_number: number;
  content: string; // HTML content of the report
  template_id: string | null;
  created_by: string | null;
  created_at: string;
  is_current: boolean;
  change_summary: string | null;
}

// Default fields for a new report based on the template
const DEFAULT_FIELDS: ReportField[] = [
  { id: 'ticket_id', key: 'Ticket ID', value: '{{ticket_id}}', isEditable: true, required: true },
  { id: 'ticket_name', key: 'Ticket Name', value: '{{ticket_name}}', isEditable: true, required: true },
  { id: 'log_source', key: 'Log Source', value: '{{log_source}}', isEditable: true, required: true },
  { id: 'alert_date', key: 'Alert Date', value: '{{alert_date}}', isEditable: true, required: true },
  { id: 'incident_severity', key: 'Incident Severity', value: '{{incident_severity}}', isEditable: true, required: true },
  { id: 'entity', key: 'Entity', value: '{{entity}}', isEditable: true, required: true },
  { id: 'description', key: 'Description', value: '{{description}}', isEditable: true, required: true },
  { id: 'threat_indicators', key: 'Threat Indicators', value: '{{threat_indicators}}', isEditable: true, required: false },
  { id: 'technical_recommendation', key: 'Technical Recommendation', value: '{{technical_recommendation}}', isEditable: true, required: false },
  // { id: 'analyst_notes', key: 'Analyst Notes', value: '', isEditable: true, required: false },
];

export function useStructuredReport(incidentId: string): UseStructuredReportReturn {
  
  const queryClient = useQueryClient();

  const { data: report, refetch: refetchReport, isLoading: isQueryLoading, error: queryError } = 
    useQuery<StructuredReport, Error>({
      queryKey: ['incidentReport', incidentId],
      queryFn: async () => {
        // Fetch the current incident report version
        const { data, error } = await supabase
          .from('incident_report_versions')
          .select('*')
          .eq('incident_id', incidentId)
          .eq('is_current', true)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
          throw new Error(error.message || 'Failed to fetch incident report');
        }

        let fields: ReportField[] = [];
        if (data && data.content) {
          try {
            // Parse JSON content back into fields
            fields = JSON.parse(data.content);
          } catch (e) {
            console.error('Failed to parse report content:', e);
            fields = DEFAULT_FIELDS;
          }
        } else {
          fields = DEFAULT_FIELDS;
        }

        return { incident_id: incidentId, fields };
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      enabled: !!incidentId,
    });

  // New query to fetch the original incident data
  const { data: originalIncident, isLoading: isOriginalIncidentLoading, error: originalIncidentError } = 
    useQuery<Incident, Error>({
      queryKey: ['originalIncident', incidentId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('incidents')
          .select('*, comments, tags') // Include comments and tags
          .eq('incident_id', incidentId)
          .single();
        
        if (error && error.code !== 'PGRST116') { // Ignore 'not found' error
          throw new Error(error.message || 'Failed to fetch original incident');
        }
        return data || { incident_id: incidentId }; // Return a minimal incident object if not found
      },
      staleTime: 1000 * 60 * 60, // Cache original incident for 1 hour
      enabled: !!incidentId,
    });

  // Function to transform incident data to a single report field
  const transformIncidentToReportField = useCallback((incident: Incident, fieldId: string): string | undefined => {
    // Helper to safely extract values from raw logs
    const extractFromRawLogs = (raw: any): { log_source?: string; alert_date?: string } => {
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

        const firstRecord = Array.isArray(parsed)
          ? parsed[0]
          : Array.isArray(parsed?.records)
            ? parsed.records[0]
            : parsed && typeof parsed === 'object'
              ? parsed
              : undefined;

        if (!firstRecord || typeof firstRecord !== 'object') return {};

        // Log Source: combine vendor + product when available
        const vendor = firstRecord.device_vendor || firstRecord.vendor || firstRecord.vendor_name;
        const product = firstRecord.device_product || firstRecord.product || firstRecord.product_name;
        const log_source = [vendor, product].filter(Boolean).join(' ').trim();

        // Alert Date: prefer ISO fields, then epoch millis (rt)
        let alert_date: string | undefined = firstRecord.TimeGenerated || firstRecord.event_timestamp || firstRecord.timestamp;
        if (!alert_date && firstRecord.rt) {
          const millis = Number(firstRecord.rt);
          if (!Number.isNaN(millis)) {
            alert_date = new Date(millis).toISOString();
          }
        }

        return {
          log_source: log_source || undefined,
          alert_date,
        };
      } catch {
        return {};
      }
    };

    // Function to extract HTML content for a given keyword from comments
    const extractHtmlContent = (html: string, keyword: string) => {
      const regex = new RegExp(`(<p>)?#${keyword}\s*:?\s*(.*?)(?=<p>#|$)`, 'gis');
      const matches = Array.from(html.matchAll(regex));
      const last = matches.length ? matches[matches.length - 1] : null;
      return last ? (last[2]?.trim() ?? '') : '';
    };

    // Map incident properties to field IDs
    const incidentFieldMap: { [key: string]: keyof Incident } = {
      ticket_id: 'incident_number',
      ticket_name: 'title',
      incident_severity: 'priority',
      description: 'description',
      technical_recommendation: 'recommendation',
      analyst_notes: 'analysis',
      // Fields to be extracted from JSON are handled separately
      entity: 'entities',
      log_source: 'raw_logs',
      alert_date: 'raw_logs',
      threat_indicators: 'threat_indicators',
    };

    let value: any = undefined;

    // Function to parse entities from the string[] format
    const parseEntities = (entitiesArray?: string[]): { name: string, kind: string, properties: any }[] => {
      if (!entitiesArray || entitiesArray.length === 0) return [];
      
      return entitiesArray.map(entityStr => {
        try {
          return JSON.parse(entityStr);
        } catch (error) {
          console.error('Error parsing entity:', error);
          return null;
        }
      }).filter(Boolean);
    };

    // Function to get display value for an entity, mirroring EntitiesSection.tsx
    const getDisplayValue = (entity: { name: string, kind: string, properties: any }) => {
      const props = entity.properties;
      
      switch (entity.kind.toLowerCase()) {
        case 'account':
          return props.displayName || props.accountName || 'Unknown Account';
        case 'file':
        case 'filehash':
          return props.fileName || 'Unknown File';
        case 'host':
          return props.hostName || 'Unknown Host';
        case 'ip':
          return props.address || 'Unknown IP';
        default:
          return props.friendlyName || entity.name || 'Unknown Entity';
      }
    };

    if (fieldId === 'description' && incident.comments && Array.isArray(incident.comments)) {
      const allMessages = incident.comments
        .map((c) => {
          try {
            const parsed = JSON.parse(c);
            return parsed?.properties?.message || '';
          } catch (error) {
            console.error('Error parsing comment:', error);
            return '';
          }
        })
        .join('');
      value = extractHtmlContent(allMessages, 'description');
    } else if (fieldId === 'threat_indicators' && incident.comments && Array.isArray(incident.comments)) {
      const allMessages = incident.comments
        .map((c) => {
          try {
            const parsed = JSON.parse(c);
            return parsed?.properties?.message || '';
          } catch (error) {
            console.error('Error parsing comment:', error);
            return '';
          }
        })
        .join('');
      value = extractHtmlContent(allMessages, 'threat_indicators');
    } else if (fieldId === 'technical_recommendation' && incident.comments && Array.isArray(incident.comments)) {
      const allMessages = incident.comments
        .map((c) => {
          try {
            const parsed = JSON.parse(c);
            return parsed?.properties?.message || '';
          } catch (error) {
            console.error('Error parsing comment:', error);
            return '';
          }
        })
        .join('');
      value = extractHtmlContent(allMessages, 'recommendation');
    } else if (fieldId === 'entity' && incident.entities) {
      const parsedEntities = parseEntities(incident.entities as string[]);
      value = parsedEntities.map(entity => getDisplayValue(entity)).join(', ');
    } 
    else {
      const incidentKey = incidentFieldMap[fieldId];
      value = incidentKey ? (incident as any)[incidentKey] : undefined;

      // Special handling for fields needing extraction from JSON
      if (fieldId === 'entity' && incident.entities) {
        try {
          const entities = Array.isArray(incident.entities) ? incident.entities : JSON.parse(incident.entities);
          value = entities.map((e: any) => e.name).join(', ');
        } catch (e) { value = 'Invalid entity format'; }
      }

      if (fieldId === 'log_source' && incident.raw_logs) {
        value = extractFromRawLogs(incident.raw_logs).log_source;
      }
      if (fieldId === 'alert_date' && incident.raw_logs) {
        value = extractFromRawLogs(incident.raw_logs).alert_date;
      }
      if (fieldId === 'threat_indicators' && incident.threat_indicators) {
        try {
          value = JSON.parse(incident.threat_indicators).join(', ');
        } catch (e) {
          console.error("Error parsing threat_indicators:", e);
          value = incident.threat_indicators;
        }
      }
    }

    console.log(`transformIncidentToReportField: fieldId=${fieldId}, value=${value}`);
    return typeof value === 'string' ? value : undefined;
  }, []);

  const lookupOriginalFieldValue = useCallback(async (fieldId: string) => {
    if (!originalIncident) return undefined;
    return transformIncidentToReportField(originalIncident, fieldId);
  }, [originalIncident, transformIncidentToReportField]);

  // Update report in the incidents table
  const { mutateAsync: saveMutation, isPending: isMutationPending, error: mutationError } = useMutation<IncidentReportVersion, Error, ReportField[]>({
    mutationFn: async (fields) => {
      // First, set the current version to false
      await supabase
        .from('incident_report_versions')
        .update({ is_current: false })
        .eq('incident_id', incidentId)
        .eq('is_current', true);

      // Convert fields to JSON content
      const jsonContent = JSON.stringify(fields);
      
      // Get the latest version number
      const { data: latestVersionData } = await supabase
        .from('incident_report_versions')
        .select('version_number')
        .eq('incident_id', incidentId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();
      
      const newVersionNumber = latestVersionData ? latestVersionData.version_number + 1 : 1;

      const { data, error } = await supabase
        .from('incident_report_versions')
        .insert({
          incident_id: incidentId,
          version_number: newVersionNumber,
          content: jsonContent,
          is_current: true,
          // TODO: Add created_by and change_summary if available
        })
        .select()
        .single<IncidentReportVersion>();
      
      if (error) throw new Error(error.message || 'Failed to update incident report');
      if (!data) throw new Error('No data returned from update');

      return data;
    },
    onSuccess: () => {
      toast.success('Report updated successfully');
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ['incidentReport', incidentId] }),
        queryClient.invalidateQueries({ queryKey: ['incident', incidentId] }),
      ]);
    },
    onError: (error) => {
      toast.error(`Failed to update report: ${error.message}`);
    },
  });

  const updateFields = useCallback(async (updatedFields: ReportField[]): Promise<IncidentReportVersion> => {
    // Ensure isEditing is not included when saving to the database
    const fieldsToSave = updatedFields.map(({ isEditing, ...rest }) => rest);
    return saveMutation(fieldsToSave);
  }, [saveMutation]);

  const stableRefetch = useCallback(async () => {
    await refetchReport();
  }, [refetchReport]);

  const fields = useMemo(() => report?.fields || DEFAULT_FIELDS, [report]);

  return {
    fields,
    isLoading: isQueryLoading || isMutationPending || isOriginalIncidentLoading,
    error: queryError || mutationError || originalIncidentError || null,
    saveReport: updateFields,
    refetch: stableRefetch,
    lookupOriginalFieldValue,
  };
}

/*
declare const DOMParser: {
  new(): DOMParser;
  prototype: DOMParser;
};
*/
