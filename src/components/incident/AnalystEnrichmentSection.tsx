
import React, { useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
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
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStructuredReport } from '@/hooks/useStructuredReport';

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
  const queryClient = useQueryClient();
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const { updateEnrichment, isLoading } = useAnalystEnrichment(incidentId);
  const { fields: reportFields } = useStructuredReport(incidentId);

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
        const regex = new RegExp(`(<p>)?#${keyword}\\s*:?\\s*(.*?)(?=<p>#|$)`, 'gis');
        const matches = Array.from(html.matchAll(regex));
        const last = matches.length ? matches[matches.length - 1] : null;
        return last ? (last[2]?.trim() ?? '') : '';
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

  // Sync from Structured Report for Description and Recommendation
  useEffect(() => {
    if (!reportFields || reportFields.length === 0) return;
    const descriptionField = reportFields.find(f => f.id === 'description');
    const recommendationField = reportFields.find(f => f.id === 'technical_recommendation');

    setEnrichmentData(prev => {
      const next = { ...prev };
      if (descriptionField && descriptionField.value !== prev.description) {
        next.description = descriptionField.value || '';
      }
      if (recommendationField && recommendationField.value !== prev.technicalRecommendation) {
        next.technicalRecommendation = recommendationField.value || '';
      }
      return next;
    });
  }, [reportFields]);

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
  
  // Autosave enrichment data with debounce
  useEffect(() => {
    if (!isEditing) return;
    setAutoSaveStatus('saving');
    const timeoutId = setTimeout(async () => {
      try {
        await updateEnrichment(enrichmentData);
        setAutoSaveStatus('saved');
      } catch (e) {
        setAutoSaveStatus('error');
      }
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [enrichmentData, isEditing]);

  // Keep Ticket Name (incident title) synced with Threat Name
  useEffect(() => {
    const newTitle = enrichmentData.threatName?.trim();
    if (!newTitle) return;
    const timeoutId = setTimeout(async () => {
      try {
        await supabase
          .from('incidents')
          .update({ title: newTitle, updated_at: new Date().toISOString() })
          .eq('incident_id', incidentId);
        queryClient.invalidateQueries({ queryKey: ['incidentReport', incidentId] });
        queryClient.invalidateQueries({ queryKey: ['incident', incidentId] });
      } catch (e) {
        // no-op for now
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [enrichmentData.threatName, incidentId, queryClient]);
  
  // Sync Threat Name into incidents.tags array (string[] of JSON strings)
  useEffect(() => {
    const threatName = enrichmentData.threatName?.trim();
    if (!threatName) return;
    const timeoutId = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('incidents')
          .select('tags')
          .eq('incident_id', incidentId)
          .single();
        if (error) throw error;

        const currentTagsRaw: any = data?.tags ?? [];
        const currentTags: string[] = Array.isArray(currentTagsRaw)
          ? currentTagsRaw.filter((t: any) => typeof t === 'string')
          : [];

        const newTagString = JSON.stringify({ labelName: threatName });
        let replaced = false;
        const updatedTags = currentTags.map((t) => {
          try {
            const obj = JSON.parse(t);
            if (obj && typeof obj.labelName === 'string' && obj.labelName.includes('*')) {
              replaced = true;
              return newTagString;
            }
          } catch {}
          return t;
        });

        // If we didn't replace an existing threat-name tag, append new one.
        if (!replaced) {
          // Avoid duplicate same labelName entries
          const hasSame = updatedTags.some((t) => {
            try { const o = JSON.parse(t); return o?.labelName === `${threatName}*`; } catch { return false; }
          });
          if (!hasSame) updatedTags.push(newTagString);
        }

        await supabase
          .from('incidents')
          .update({ tags: updatedTags, updated_at: new Date().toISOString() })
          .eq('incident_id', incidentId);

        queryClient.invalidateQueries({ queryKey: ['incident', incidentId] });
      } catch (e) {
        // swallow for now
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [enrichmentData.threatName, incidentId, queryClient]);
  
  // Sync Threat Category into incidents.tags array (string[] of JSON strings)
  useEffect(() => {
    const threatCategory = enrichmentData.threatCategory?.trim();
    if (!threatCategory) return;
    const timeoutId = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('incidents')
          .select('tags')
          .eq('incident_id', incidentId)
          .single();
        if (error) throw error;
 
        const currentTagsRaw: any = data?.tags ?? [];
        const currentTags: string[] = Array.isArray(currentTagsRaw)
          ? currentTagsRaw.filter((t: any) => typeof t === 'string')
          : [];
 
        const newTagString = JSON.stringify({ labelName: threatCategory });
        let replaced = false;
        const updatedTags = currentTags.map((t) => {
          try {
            const obj = JSON.parse(t);
            // Only replace if it does NOT have an asterisk (i.e., it's a threat category)
            if (obj && typeof obj.labelName === 'string' && !obj.labelName.includes('*')) {
              replaced = true;
              return newTagString;
            }
          } catch {}
          return t;
        });
 
        // If we didn't replace an existing threat-category tag, append new one.
        if (!replaced) {
          // Avoid duplicate same labelName entries and ensure it doesn't have an asterisk
          const hasSame = updatedTags.some((t) => {
            try { const o = JSON.parse(t); return o?.labelName === threatCategory && !o.labelName.includes('*'); } catch { return false; }
          });
          if (!hasSame) updatedTags.push(newTagString);
        }
 
        await supabase
          .from('incidents')
          .update({ tags: updatedTags, updated_at: new Date().toISOString() })
          .eq('incident_id', incidentId);
 
        queryClient.invalidateQueries({ queryKey: ['incident', incidentId] });
      } catch (e) {
        // swallow for now
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [enrichmentData.threatCategory, incidentId, queryClient]);
  
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
                  <Editor
                    apiKey='9pxbmembo1uetj3qto7w4t0ce6vi14e321zvnvyip544v0yi'
                    value={enrichmentData.threatIndicatorIP || ''}
                    onEditorChange={(val: string) => handleInputChange('threatIndicatorIP', val)}
                    init={{
                      height: 120,
                      menubar: false,
                      statusbar: false,
                      toolbar: 'undo redo | bold italic underline | bullist numlist | removeformat',
                    }}
                  />
                ) : (
                  <div className="p-2 bg-muted rounded text-xs font-mono">
                    <div dangerouslySetInnerHTML={{ __html: enrichmentData.threatIndicatorIP || 'N/A' }} />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="threatHash" className="text-xs font-medium">
                  Threat Indicator - Hash
                </Label>
                {isEditing ? (
                  <Editor
                    apiKey='9pxbmembo1uetj3qto7w4t0ce6vi14e321zvnvyip544v0yi'
                    value={enrichmentData.threatIndicatorHash || ''}
                    onEditorChange={(val: string) => handleInputChange('threatIndicatorHash', val)}
                    init={{
                      height: 120,
                      menubar: false,
                      statusbar: false,
                      toolbar: 'undo redo | bold italic underline | bullist numlist | removeformat',
                    }}
                  />
                ) : (
                  <div className="p-2 bg-muted rounded text-xs font-mono truncate" title={enrichmentData.threatIndicatorHash}>
                    <div dangerouslySetInnerHTML={{ __html: enrichmentData.threatIndicatorHash || 'N/A' }} />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="threatDomain" className="text-xs font-medium">
                  Threat Indicator - Domain
                </Label>
                {isEditing ? (
                  <Editor
                    apiKey='9pxbmembo1uetj3qto7w4t0ce6vi14e321zvnvyip544v0yi'
                    value={enrichmentData.threatIndicatorDomain || ''}
                    onEditorChange={(val: string) => handleInputChange('threatIndicatorDomain', val)}
                    init={{
                      height: 120,
                      menubar: false,
                      statusbar: false,
                      toolbar: 'undo redo | bold italic underline | bullist numlist | removeformat',
                    }}
                  />
                ) : (
                  <div className="p-2 bg-muted rounded text-xs">
                    <div dangerouslySetInnerHTML={{ __html: enrichmentData.threatIndicatorDomain || 'N/A' }} />
                  </div>
                )}
              </div>

            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="description" className="text-xs font-medium">
                  Description
                </Label>
                {isEditing ? (
                  <Editor
                    apiKey='9pxbmembo1uetj3qto7w4t0ce6vi14e321zvnvyip544v0yi'
                    value={enrichmentData.description || ''}
                    onEditorChange={(val: string) => handleInputChange('description', val)}
                    init={{
                      height: 200,
                      menubar: false,
                      statusbar: false,
                      toolbar: 'undo redo | blocks | bold italic underline | alignleft aligncenter alignright | bullist numlist | removeformat',
                    }}
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
                  <Editor
                    apiKey='9pxbmembo1uetj3qto7w4t0ce6vi14e321zvnvyip544v0yi'
                    value={enrichmentData.technicalRecommendation || ''}
                    onEditorChange={(val: string) => handleInputChange('technicalRecommendation', val)}
                    init={{
                      height: 200,
                      menubar: false,
                      statusbar: false,
                      toolbar: 'undo redo | blocks | bold italic underline | alignleft aligncenter alignright | bullist numlist | removeformat',
                    }}
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
