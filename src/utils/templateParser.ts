
import type { Incident } from '@/hooks/useIncidents';

export const parseTemplateVariables = (template: string, incident: Incident): string => {
  let parsedContent = template;

  // Parse raw logs for additional information
  let rawLogData: any = {};
  try {
    if (incident.raw_logs) {
      rawLogData = JSON.parse(incident.raw_logs);
    }
  } catch (error) {
    console.warn('Could not parse raw logs:', error);
  }

  // Define variable mappings
  const variables: Record<string, string> = {
    ticket_id: incident.incident_number || incident.incident_id,
    ticket_name: rawLogData.DisplayName || rawLogData.Title || `Incident ${incident.incident_number}`,
    log_source: rawLogData.SourceName || rawLogData.Source || 'Unknown',
    alert_date: incident.creation_time ? new Date(incident.creation_time).toISOString() : '',
    severity: incident.priority || 'Unknown',
    entity_info: formatEntityInfo(incident),
    description: extractDescription(rawLogData),
    threat_indicators: extractThreatIndicators(rawLogData),
    technical_recommendation: extractRecommendation(rawLogData),
    customer_name: incident.customer_name || 'Unknown',
    analyst_name: incident.analyst_name || 'Unassigned',
    status: incident.status || 'Active'
  };

  // Replace variables in template
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    parsedContent = parsedContent.replace(regex, value || '');
  });

  return parsedContent;
};

const formatEntityInfo = (incident: Incident): string => {
  const entities = incident.entities || [];
  if (entities.length === 0) return 'No entities found';
  
  return entities.join('<br />');
};

const extractDescription = (rawLogData: any): string => {
  return rawLogData.Description || 
         rawLogData.AlertDisplayName || 
         rawLogData.Title || 
         'No description available';
};

const extractThreatIndicators = (rawLogData: any): string => {
  const indicators = [];
  
  if (rawLogData.FileHash) {
    indicators.push(`File Hash: ${rawLogData.FileHash}`);
  }
  
  if (rawLogData.FileName) {
    indicators.push(`File Name: ${rawLogData.FileName}`);
  }
  
  if (rawLogData.SourceIP) {
    indicators.push(`Source IP: ${rawLogData.SourceIP}`);
  }
  
  if (rawLogData.ProcessCommandLine) {
    indicators.push(`Command Line: ${rawLogData.ProcessCommandLine}`);
  }
  
  return indicators.length > 0 ? indicators.join('<br />') : 'No threat indicators identified';
};

const extractRecommendation = (rawLogData: any): string => {
  // You can customize this based on your specific incident types
  const defaultRecommendations = [
    'Review the incident details and validate the threat',
    'Investigate the affected systems and users',
    'Implement appropriate containment measures if necessary',
    'Document findings and update security measures'
  ];
  
  return rawLogData.Recommendation || defaultRecommendations.join('<br />');
};
