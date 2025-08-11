
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RequestChangeModalProps {
  incidentId: string;
  incidentNumber: string;
  analystName: string;
}

interface Indicator {
  type: string;
  value: string;
  description: string;
}

export function RequestChangeModal({ incidentId, incidentNumber, analystName }: RequestChangeModalProps) {
  const [open, setOpen] = useState(false);
  const [requiredAction, setRequiredAction] = useState<'soc' | 'customer' | ''>('');
  const [affectedAssets, setAffectedAssets] = useState('');
  const [description, setDescription] = useState('');
  const [jiraTicketId, setJiraTicketId] = useState('');
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addIndicator = () => {
    setIndicators([...indicators, { type: 'hash', value: '', description: '' }]);
  };

  const removeIndicator = (index: number) => {
    setIndicators(indicators.filter((_, i) => i !== index));
  };

  const updateIndicator = (index: number, field: keyof Indicator, value: string) => {
    const updated = [...indicators];
    updated[index] = { ...updated[index], [field]: value };
    setIndicators(updated);
  };

  const handleSubmit = async () => {
    if (!requiredAction || !affectedAssets || !description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create the request change record
      const { data: requestChange, error: requestError } = await supabase
        .from('request_changes')
        .insert({
          incident_number: incidentNumber,
          jira_ticket_id: jiraTicketId || null,
          analyst_id: analystName,
          assets: affectedAssets,
          status: 'waiting for approval'
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Create indicators if any
      if (indicators.length > 0) {
        const indicatorRecords = indicators.map(indicator => ({
          request_changes_id: requestChange.id,
          type: indicator.type,
          value: indicator.value,
          description: indicator.description || null,
          status: 'pending'
        }));

        const { error: indicatorError } = await supabase
          .from('request_changes_indicators')
          .insert(indicatorRecords);

        if (indicatorError) throw indicatorError;
      }

      toast({
        title: "Success",
        description: "Request change submitted successfully",
      });

      // Reset form
      setRequiredAction('');
      setAffectedAssets('');
      setDescription('');
      setJiraTicketId('');
      setIndicators([]);
      setOpen(false);

    } catch (error) {
      console.error('Error submitting request change:', error);
      toast({
        title: "Error",
        description: "Failed to submit request change",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <FileText className="w-4 h-4 mr-2" />
          Request Change
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Change - Incident #{incidentNumber}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Purpose</h4>
            <p className="text-blue-800 text-sm">
              This feature allows you to propose changes to the customer's environment based on your investigation findings.
              The customer will receive a notification to approve or reject these changes.
            </p>
          </div>

          <div>
            <Label htmlFor="required-action">Required Action *</Label>
            <Select value={requiredAction} onValueChange={(value: 'soc' | 'customer') => setRequiredAction(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select who will perform the action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="soc">By SOC Team</SelectItem>
                <SelectItem value="customer">By Customer</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {requiredAction === 'soc' && "SOC team has privileges to perform this action"}
              {requiredAction === 'customer' && "Customer permission required to perform this action"}
            </p>
          </div>

          <div>
            <Label htmlFor="affected-assets">Affected Assets *</Label>
            <Input
              id="affected-assets"
              value={affectedAssets}
              onChange={(e) => setAffectedAssets(e.target.value)}
              placeholder="e.g., Server01, Workstation-HR-05, 192.168.1.100"
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the proposed changes and reasoning..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="jira-ticket">JIRA Ticket ID (Optional)</Label>
            <Input
              id="jira-ticket"
              value={jiraTicketId}
              onChange={(e) => setJiraTicketId(e.target.value)}
              placeholder="e.g., CSOC-12345"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Threat Indicators (Optional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addIndicator}>
                <Plus className="w-4 h-4 mr-1" />
                Add Indicator
              </Button>
            </div>
            
            {indicators.map((indicator, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3 mb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Indicator #{index + 1}</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeIndicator(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Type</Label>
                    <Select value={indicator.type} onValueChange={(value) => updateIndicator(index, 'type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hash">File Hash</SelectItem>
                        <SelectItem value="ip">IP Address</SelectItem>
                        <SelectItem value="domain">Domain</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Value</Label>
                    <Input
                      value={indicator.value}
                      onChange={(e) => updateIndicator(index, 'value', e.target.value)}
                      placeholder={`Enter ${indicator.type}`}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Input
                    value={indicator.description}
                    onChange={(e) => updateIndicator(index, 'description', e.target.value)}
                    placeholder="Brief description of this indicator"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
