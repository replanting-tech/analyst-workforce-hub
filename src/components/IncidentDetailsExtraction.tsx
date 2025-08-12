
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Shield, Server, Globe, Target, AlertTriangle } from 'lucide-react';

interface IncidentDetailsExtractionProps {
  rawLogs?: string;
  creationTime: string;
  priority: string;
}

interface ExtractedData {
  logSource?: string;
  alertName?: string;
  severity?: string;
  deviceAction?: string;
  sourceIP?: string;
  destIP?: string;
  contactedDomain?: string;
  username?: string;
  assetHostname?: string;
  ip?: string;
  threatIndicatorIP?: string;
  threatIndicatorHash?: string;
  threatIndicatorDomain?: string;
  threatCategory?: string;
  description?: string;
  technicalRecommendation?: string;
}

const IncidentDetailsExtraction: React.FC<IncidentDetailsExtractionProps> = ({ 
  rawLogs, 
  creationTime, 
  priority 
}) => {
  const extractDataFromLogs = (logs?: string): ExtractedData => {
    if (!logs) return {};

    try {
      const parsed = JSON.parse(logs);
      const logData = Array.isArray(parsed) ? parsed[0] : parsed;

      return {
        logSource: logData?.leef_vendor || logData?.device_vendor || logData?.Type?.replace('_CL', '') || 'Unknown',
        alertName: logData?.leef_name || logData?.event_name || logData?.signature_id || 'N/A',
        severity: logData?.LogSeverity || logData?.SeverityDescription || logData?.severity || priority,
        deviceAction: logData?.act || logData?.extracted_eventType || 'N/A',
        sourceIP: logData?.src || logData?.client_ip || logData?.extracted_ip || 'N/A',
        destIP: logData?.dst || 'N/A',
        contactedDomain: logData?.request || 'N/A',
        username: logData?.extracted_username || logData?.suser || 'N/A',
        assetHostname: logData?.extracted_hostname || logData?.host?.name || 'N/A',
        ip: logData?.extracted_ip || logData?.src || 'N/A',
        threatIndicatorIP: logData?.TI_Source === 'IP' ? logData?.src : 'N/A',
        threatIndicatorHash: logData?.extracted_fileHash || logData?.TI_FileHash || 'N/A',
        threatIndicatorDomain: logData?.TI_Source === 'Domain' ? logData?.request : 'N/A',
        threatCategory: logData?.extracted_malwareFamily || logData?.TI_ThreatType || 'N/A',
        description: logData?.TI_Description || 'N/A',
        technicalRecommendation: 'Please refer to security playbook for remediation steps'
      };
    } catch (error) {
      console.error('Error parsing raw logs:', error);
      return {};
    }
  };

  const extractedData = extractDataFromLogs(rawLogs);

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

  const getSeverityColor = (severity?: string) => {
    if (!severity) return "bg-gray-100 text-gray-800";
    
    const sev = severity.toLowerCase();
    if (sev.includes('high') || sev.includes('critical')) return "bg-red-100 text-red-800";
    if (sev.includes('medium')) return "bg-orange-100 text-orange-800";
    if (sev.includes('low')) return "bg-yellow-100 text-yellow-800";
    return "bg-blue-100 text-blue-800";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Incident Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Informasi Penting Dari Log */}
          <div className="space-y-4">
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium">Incident Creation Time:</span>
                <span className="text-xs">{formatDateTime(creationTime)}</span>
              </div>

              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <Server className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium">Log Source:</span>
                <span className="text-xs">{extractedData.logSource}</span>
              </div>

              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-medium">Alert Name:</span>
                <span className="text-xs truncate" title={extractedData.alertName}>
                  {extractedData.alertName}
                </span>
              </div>

              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <Shield className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-medium">Severity:</span>
                <Badge className={`text-xs ${getSeverityColor(extractedData.severity)}`}>
                  {extractedData.severity}
                </Badge>
              </div>

              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <Target className="w-4 h-4 text-red-500" />
                <span className="text-xs font-medium">Device Action:</span>
                <span className="text-xs">{extractedData.deviceAction}</span>
              </div>

              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <Globe className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium">Source IP:</span>
                <span className="text-xs font-mono">{extractedData.sourceIP}</span>
              </div>

              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <Globe className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium">Dest IP:</span>
                <span className="text-xs font-mono">{extractedData.destIP}</span>
              </div>

              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <Globe className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium">Contacted Domain:</span>
                <span className="text-xs">{extractedData.contactedDomain}</span>
              </div>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
};

export default IncidentDetailsExtraction;