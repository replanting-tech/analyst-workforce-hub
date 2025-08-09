
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { SLAConfig } from '@/hooks/useSLAConfig';
import { useCustomers } from '@/hooks/useCustomers';

interface EditSLAConfigFormProps {
  slaConfig: SLAConfig;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditSLAConfigForm({ slaConfig, onSuccess, onCancel }: EditSLAConfigFormProps) {
  const [formData, setFormData] = useState({
    customer_id: slaConfig.customer_id,
    priority: slaConfig.priority,
    resolution_minutes: slaConfig.resolution_minutes
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { data: customers = [] } = useCustomers();

  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('sla_config')
        .update(formData)
        .eq('id', slaConfig.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "SLA configuration updated successfully",
      });
      onSuccess();
    } catch (error) {
      console.error('Error updating SLA config:', error);
      toast({
        title: "Error",
        description: "Failed to update SLA configuration",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="customer_id">Customer</Label>
        <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map(customer => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.customer_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priorities.map(priority => (
              <SelectItem key={priority} value={priority}>
                {priority}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="resolution_minutes">Resolution Time (minutes)</Label>
        <Input
          id="resolution_minutes"
          type="number"
          value={formData.resolution_minutes}
          onChange={(e) => setFormData({ ...formData, resolution_minutes: parseInt(e.target.value) })}
          min="1"
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          Current: {Math.floor(formData.resolution_minutes / 60)}h {formData.resolution_minutes % 60}m
        </p>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Update SLA Config'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
