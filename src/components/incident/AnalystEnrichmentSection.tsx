
import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import RichTextEditor from '@/components/RichTextEditor';
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
  comments?: string[];
  tags?: string[];
}

const AnalystEnrichmentSection: React.FC<AnalystEnrichmentSectionProps> = ({ 
  incidentId, 
  comments,
  tags
}) => {
  const [isEditing, setIsEditing] = useState(true);
  const [enrichmentData, setEnrichmentData] = useState<AnalystEnrichment>({
    threatIndicatorIP: '',
    threatIndicatorHash: '',
    threatIndicatorDomain: '',
    threatName: '',
    threatCategory: '',
    description: '',
    technicalRecommendation: 'Please refer to security playbook for remediation steps'
  });

  // Extract #description and #recommendation from comments
  useEffect(() => {
    if (comments && Array.isArray(comments)) {
      let description = '';
      let recommendation = '';
      let hash = '';
      let ip = '';
      let domain = '';

      console.log(comments);

      // Process each comment
      const allMessages = comments
        .map((c) => {
          try {
            const parsed = JSON.parse(c);
            return parsed?.properties?.message || '';
          } catch (error) {
            console.error('Error parsing comment:', error);
            return '';
          }
        })
        .join(''); // Join raw HTML strings

      // Function to extract HTML content for a given keyword
      const extractHtmlContent = (html: string, keyword: string) => {
        const regex = new RegExp(`(<p>)?#${keyword}\s*:?\s*(.*?)(?=<p>#|$)`, 'is');
        const match = html.match(regex);
        return match ? match[2].trim() : '';
      };

      // Function to clean HTML for entity extraction
      const cleanHtml = (html: string) => {
        return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim();
      };

      // Extract full HTML blocks for rendering
      description = extractHtmlContent(allMessages, 'description');
      recommendation = extractHtmlContent(allMessages, 'recommendation');
      const ipBlock = extractHtmlContent(allMessages, 'ip');
      const hashBlock = extractHtmlContent(allMessages, 'hash');
      const domainBlock = extractHtmlContent(allMessages, 'domain');

      // Use the IP block if found, otherwise use the description for entity extraction
      const textForIp = ipBlock ? cleanHtml(ipBlock) : cleanHtml(description);
      const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
      const foundIps = textForIp.match(ipRegex);
      ip = foundIps ? [...new Set(foundIps)].join(', ') : '';

      // Use the hash block if found, otherwise scan everything
      const textForHash = hashBlock ? cleanHtml(hashBlock) : cleanHtml(allMessages);
      const hashRegex = /\b([a-f0-9]{32}|[a-f0-9]{40}|[a-f0-9]{64})\b/ig;
      const foundHashes = textForHash.match(hashRegex);
      hash = foundHashes ? [...new Set(foundHashes)].join(', ') : '';

      // Use the domain block if found, otherwise scan everything
      const textForDomain = domainBlock ? cleanHtml(domainBlock) : cleanHtml(allMessages);
      const domainRegex = /\b((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9])\b/ig;
      const foundDomains = textForDomain.match(domainRegex);
      domain = foundDomains ? [...new Set(foundDomains)].join(', ') : '';

      // If a dedicated IP block was found, use its HTML content for the 'ip' variable
      if (ipBlock) {
        ip = ipBlock;
      }

      console.log('Extracted data:', {
        description,
        recommendation,
        hash,
        ip,
        domain
      });

      // Update the state
      setEnrichmentData(prev => ({
        ...prev,
        description: description || prev.description,
        technicalRecommendation: recommendation || prev.technicalRecommendation,
        threatIndicatorHash: hash || prev.threatIndicatorHash,
        threatIndicatorIP: ip || prev.threatIndicatorIP,
        threatIndicatorDomain: domain || prev.threatIndicatorDomain
      }));
    }
  }, [comments]);

  useEffect(() => {
    if (tags && Array.isArray(tags)) {
      let threatCategory, threatName;
      tags.forEach(tag => {
        const parsedTag = JSON.parse(tag);
        if (parsedTag?.labelName.includes('*')) {
          threatName = parsedTag?.labelName;
        }
        else {
          threatCategory = parsedTag?.labelName;
        }
      });
      // threatCategory = tags.find(tag => tag.toLowerCase().includes('description'));

      setEnrichmentData(prev => ({
        ...prev,
        threatCategory: threatCategory || prev.threatCategory,
        threatName: threatName || prev.threatName,
      }));
    }
  }, [tags]); 
  
  const { updateEnrichment, isLoading } = useAnalystEnrichment(incidentId);
  const { toast } = useToast();

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
            Investigation Result
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
        <div className="grid grid-cols-1 gap-6">
          {/* Left Column - Threat Indicators */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground mb-3">
              Threat Indicators
            </h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="threatCategory" className="text-xs font-medium">
                  Threat Name
                </Label>
                {isEditing ? (
                  <Input
                    id="threatName"
                    value={enrichmentData.threatName || ''}
                    onChange={(e) => handleInputChange('threatName', e.target.value)}
                    className="text-xs"
                    placeholder="Enter threat category"
                  />
                ) : (
                  <div className="p-2 bg-muted rounded text-xs">
                    {enrichmentData.threatName || 'N/A'}
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
              <div>
                <Label htmlFor="threatIP" className="text-xs font-medium">
                  Threat Indicator - IP
                </Label>
                {isEditing ? (
                  <ReactQuill
                    value={enrichmentData.threatIndicatorIP || ''}
                    onChange={(val: string) => handleInputChange('threatIndicatorIP', val)}
                    className="min-h-[120px] text-xs"
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
                  <ReactQuill
                    value={enrichmentData.threatIndicatorHash || ''}
                    onChange={(val: string) => handleInputChange('threatIndicatorHash', val)}
                    className="min-h-[120px] text-xs"
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
                  <ReactQuill
                    value={enrichmentData.threatIndicatorDomain || ''}
                    onChange={(val: string) => handleInputChange('threatIndicatorDomain', val)}
                    className="min-h-[120px] text-xs"
                    placeholder="Enter domain"
                  />
                ) : (
                  <div className="p-2 bg-muted rounded text-xs">
                    {enrichmentData.threatIndicatorDomain || 'N/A'}
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
                  <ReactQuill
                    value={enrichmentData.description || ''}
                    onChange={(val: string) => handleInputChange('description', val)}
                    className="min-h-[80px] text-xs"
                    placeholder="Enter threat description"
                  />
                ) : (
                  <div className="p-2 bg-muted rounded text-xs min-h-[80px]">
                    <div dangerouslySetInnerHTML={{ __html: enrichmentData.description || 'N/A' }} />
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="technicalRecommendation" className="text-xs font-medium flex items-center gap-2">
                   Recommendation
                </Label>
                {isEditing ? (
                  <ReactQuill
                    value={enrichmentData.technicalRecommendation || ''}
                    onChange={(val: string) => handleInputChange('technicalRecommendation', val)}
                    className="min-h-[120px] text-xs"
                    placeholder="Enter technical recommendation for customer"
                  />
                ) : (
                  <div className="p-2 bg-muted rounded text-xs min-h-[120px]">
                    <div dangerouslySetInnerHTML={{ __html: enrichmentData.technicalRecommendation || 'Please refer to security playbook for remediation steps' }} />
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
