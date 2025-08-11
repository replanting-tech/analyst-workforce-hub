
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Send, AlertTriangle } from 'lucide-react';

interface RequestChangeModalProps {
  incidentId: string;
  incidentNumber: string;
  analystName: string;
  onSuccess?: () => void;
}

export function RequestChangeModal({
  incidentId,
  incidentNumber,
  analystName,
  onSuccess
}: RequestChangeModalProps) {
  const [open, setOpen] = useState(false);
  const [requiredAction, setRequiredAction] = useState<'soc_team' | 'customer'>('soc_team');
  const [assets, setAssets] = useState('');
  const [description, setDescription] = useState('');
  const [jiraTicketId, setJiraTicketId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!assets.trim() || !description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create request change
      const { data, error } = await supabase
        .rpc('create_request_change', {
          p_incident_id: incidentNumber,
          p_analyst_name: analystName,
          p_jira_ticket_id: jiraTicketId || null,
          p_assets: assets,
        });

      if (error) throw error;

      // If successful, create indicators/details
      const requestChangeId = data?.id;
      if (requestChangeId) {
        const { error: indicatorError } = await supabase
          .from('request_changes_indicators')
          .insert({
            request_changes_id: requestChangeId,
            type: 'action',
            value: requiredAction,
            description: description,
            status: 'pending'
          });

        if (indicatorError) {
          console.error('Error creating indicator:', indicatorError);
        }
      }

      toast({
        title: "Success",
        description: "Request change submitted successfully",
      });

      setOpen(false);
      onSuccess?.();
      
      // Reset form
      setAssets('');
      setDescription('');
      setJiraTicketId('');
      setRequiredAction('soc_team');
    } catch (error) {
      console.error('Error submitting request change:', error);
      toast({
        title: "Error",
        description: "Failed to submit request change",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center justify-center">
          <Send className="w-4 h-4 mr-2" />
          Request Change
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Request Change - Incident #{incidentNumber}
          </DialogTitle>
          <DialogDescription>
            Propose changes to the customer's environment based on your investigation. 
            This will notify the customer portal and require their approval before proceeding.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label>Required Action</Label>
            <RadioGroup 
              value={requiredAction} 
              onValueChange={(value: 'soc_team' | 'customer') => setRequiredAction(value)}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2 border rounded-lg p-4">
                <RadioGroupItem value="soc_team" id="soc_team" />
                <div className="grid gap-2">
                  <Label htmlFor="soc_team" className="font-medium">
                    By SOC Team
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    SOC team will perform the action (existing privileges)
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-4">
                <RadioGroupItem value="customer" id="customer" />
                <div className="grid gap-2">
                  <Label htmlFor="customer" className="font-medium">
                    By Customer
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Customer must perform the action (requires permission)
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assets">Affected Assets *</Label>
            <Input
              id="assets"
              placeholder="e.g., Server01, Workstation-192.168.1.10, Domain Controller"
              value={assets}
              onChange={(e) => setAssets(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Change Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the changes needed, steps to be taken, and the expected outcome..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jira">JIRA Ticket ID (Optional)</Label>
            <Input
              id="jira"
              placeholder="e.g., CSOC-12345"
              value={jiraTicketId}
              onChange={(e) => setJiraTicketId(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
