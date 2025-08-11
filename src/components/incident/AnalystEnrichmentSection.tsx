
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, Save, Edit3 } from 'lucide-react';
import { useAnalystEnrichment, AnalystEnrichment } from '@/hooks/useAnalystEnrichment';
import { useToast } from "@/hooks/use-toast";

interface AnalystEnrichmentSectionProps {
  incidentId: string;
  initialData?: AnalystEnrichment;
  rawLogs?: string;
}

const AnalystEnrichmentSection: React.FC<AnalystEnrichmentSectionProps> = ({ 
  incidentId, 
  initialData,
  rawLogs 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [enrichmentData, setEnrichmentData] = useState<AnalystEnrichment>({
    threatIndicatorIP: '',
    threatIndicatorHash: '',
    threatIndicatorDomain: '',
    threatCategory: '',
    description: '',
    technicalRecommendation: 'Please refer to security playbook for remediation steps'
  });

  const { updateEnrichment, isLoading } = useAnalystEnrichment(incidentId);
  const { toast } = useToast();

  // Extract data from raw logs to pre-populate fields
  useEffect(() => {
    const extractFromLogs = () => {
      if (!rawLogs) return {};

      try {
        const parsed = JSON.parse(rawLogs);
        const logData = Array.isArray(parsed) ? parsed[0] : parsed;

        return {
          threatIndicatorIP: logData?.TI_Source === 'IP' ? logData?.src : logData?.extracted_ip || '',
          threatIndicatorHash: logData?.extracted_fileHash || logData?.TI_FileHash || '',
          threatIndicatorDomain: logData?.TI_Source === 'Domain' ? logData?.request : '',
          threatCategory: logData?.extracted_malwareFamily || logData?.TI_ThreatType || '',
          description: logData?.TI_Description || '',
          technicalRecommendation: 'Please refer to security playbook for remediation steps'
        };
      } catch (error) {
        console.error('Error parsing raw logs for enrichment:', error);
        return {};
      }
    };

    const extractedData = extractFromLogs();
    setEnrichmentData(prev => ({
      ...prev,
      ...extractedData,
      ...initialData // Override with any existing data
    }));
  }, [rawLogs, initialData]);

  const handleSave = async () => {
    try {
      await updateEnrichment(enrichmentData);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Analyst enrichment updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update analyst enrichment",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof AnalystEnrichment, value: string) => {
    setEnrichmentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Analyst Enrichment
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Saving...' : 'Save'}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Threat Indicators */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground mb-3">
              Threat Indicators
            </h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="threatIP" className="text-xs font-medium">
                  Threat Indicator - IP
                </Label>
                {isEditing ? (
                  <Input
                    id="threatIP"
                    value={enrichmentData.threatIndicatorIP || ''}
                    onChange={(e) => handleInputChange('threatIndicatorIP', e.target.value)}
                    className="text-xs font-mono"
                    placeholder="Enter IP address"
                  />
                ) : (
                  <div className="p-2 bg-muted rounded text-xs font-mono">
                    {enrichmentData.threatIndicatorIP || 'N/A'}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="threatHash" className="text-xs font-medium">
                  Threat Indicator - Hash
                </Label>
                {isEditing ? (
                  <Input
                    id="threatHash"
                    value={enrichmentData.threatIndicatorHash || ''}
                    onChange={(e) => handleInputChange('threatIndicatorHash', e.target.value)}
                    className="text-xs font-mono"
                    placeholder="Enter file hash"
                  />
                ) : (
                  <div className="p-2 bg-muted rounded text-xs font-mono truncate" title={enrichmentData.threatIndicatorHash}>
                    {enrichmentData.threatIndicatorHash || 'N/A'}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="threatDomain" className="text-xs font-medium">
                  Threat Indicator - Domain
                </Label>
                {isEditing ? (
                  <Input
                    id="threatDomain"
                    value={enrichmentData.threatIndicatorDomain || ''}
                    onChange={(e) => handleInputChange('threatIndicatorDomain', e.target.value)}
                    className="text-xs"
                    placeholder="Enter domain"
                  />
                ) : (
                  <div className="p-2 bg-muted rounded text-xs">
                    {enrichmentData.threatIndicatorDomain || 'N/A'}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="threatCategory" className="text-xs font-medium">
                  Threat Category
                </Label>
                {isEditing ? (
                  <Input
                    id="threatCategory"
                    value={enrichmentData.threatCategory || ''}
                    onChange={(e) => handleInputChange('threatCategory', e.target.value)}
                    className="text-xs"
                    placeholder="Enter threat category"
                  />
                ) : (
                  <div className="p-2 bg-muted rounded text-xs">
                    {enrichmentData.threatCategory || 'N/A'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Analysis & Recommendations */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground mb-3">
              Analysis & Recommendations
            </h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="description" className="text-xs font-medium">
                  Description
                </Label>
                {isEditing ? (
                  <Textarea
                    id="description"
                    value={enrichmentData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="text-xs min-h-[80px]"
                    placeholder="Enter threat description"
                  />
                ) : (
                  <div className="p-2 bg-muted rounded text-xs min-h-[80px]">
                    {enrichmentData.description || 'N/A'}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="technicalRecommendation" className="text-xs font-medium flex items-center gap-2">
                  Technical Recommendation
                  <Badge variant="secondary" className="text-xs">
                    Customer Report Field
                  </Badge>
                </Label>
                {isEditing ? (
                  <Textarea
                    id="technicalRecommendation"
                    value={enrichmentData.technicalRecommendation || ''}
                    onChange={(e) => handleInputChange('technicalRecommendation', e.target.value)}
                    className="text-xs min-h-[120px]"
                    placeholder="Enter technical recommendation for customer"
                  />
                ) : (
                  <div className="p-2 bg-muted rounded text-xs min-h-[120px]">
                    {enrichmentData.technicalRecommendation || 'Please refer to security playbook for remediation steps'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalystEnrichmentSection;
