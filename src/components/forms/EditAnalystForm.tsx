
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Analyst } from '@/hooks/useAnalysts';

interface EditAnalystFormProps {
  analyst: Analyst;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditAnalystForm({ analyst, onSuccess, onCancel }: EditAnalystFormProps) {
  const [formData, setFormData] = useState({
    name: analyst.name,
    email: analyst.email,
    code: analyst.code,
    availability: analyst.availability
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('analysts')
        .update(formData)
        .eq('id', analyst.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Analyst updated successfully",
      });
      onSuccess();
    } catch (error) {
      console.error('Error updating analyst:', error);
      toast({
        title: "Error",
        description: "Failed to update analyst",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          placeholder="e.g., AN001"
          required
        />
      </div>

      <div>
        <Label htmlFor="availability">Availability</Label>
        <Select value={formData.availability} onValueChange={(value) => setFormData({ ...formData, availability: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="busy">Busy</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Update Analyst'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
