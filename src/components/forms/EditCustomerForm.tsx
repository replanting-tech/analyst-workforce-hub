
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Customer } from '@/hooks/useCustomers';

interface EditCustomerFormProps {
  customer: Customer;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditCustomerForm({ customer, onSuccess, onCancel }: EditCustomerFormProps) {
  const [formData, setFormData] = useState({
    customer_name: customer.customer_name,
    workspace_name: customer.workspace_name,
    timezone: customer.timezone
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const timezones = [
    'UTC',
    'Asia/Jakarta',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Europe/London',
    'Europe/Berlin',
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('customers')
        .update(formData)
        .eq('id', customer.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      onSuccess();
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="customer_name">Customer Name</Label>
        <Input
          id="customer_name"
          value={formData.customer_name}
          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="workspace_name">Workspace Name</Label>
        <Input
          id="workspace_name"
          value={formData.workspace_name}
          onChange={(e) => setFormData({ ...formData, workspace_name: e.target.value })}
          placeholder="e.g., companyname-workspace"
          required
        />
      </div>

      <div>
        <Label htmlFor="timezone">Timezone</Label>
        <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timezones.map(tz => (
              <SelectItem key={tz} value={tz}>{tz}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Update Customer'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
