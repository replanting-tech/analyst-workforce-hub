
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useAnalysts } from '@/hooks/useAnalysts';
import { useCreateSchedule } from '@/hooks/useSchedule';
import { useToast } from '@/hooks/use-toast';

export function CreateScheduleDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    analyst_id: '',
    shift_date: '',
    shift_start: '',
    shift_end: '',
    timezone: 'UTC',
  });

  const { data: analysts, isLoading: analystsLoading } = useAnalysts();
  const createSchedule = useCreateSchedule();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.analyst_id || !formData.shift_date || !formData.shift_start || !formData.shift_end) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await createSchedule.mutateAsync(formData);
      toast({
        title: "Success",
        description: "Schedule created successfully",
      });
      setOpen(false);
      setFormData({
        analyst_id: '',
        shift_date: '',
        shift_start: '',
        shift_end: '',
        timezone: 'UTC',
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create schedule",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Schedule</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="analyst">Analyst</Label>
            <Select value={formData.analyst_id} onValueChange={(value) => setFormData({ ...formData, analyst_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select analyst" />
              </SelectTrigger>
              <SelectContent>
                {analysts?.map(analyst => (
                  <SelectItem key={analyst.code} value={analyst.code}>
                    {analyst.name} ({analyst.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shift_date">Shift Date</Label>
            <Input
              id="shift_date"
              type="date"
              value={formData.shift_date}
              onChange={(e) => setFormData({ ...formData, shift_date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shift_start">Start Time</Label>
              <Input
                id="shift_start"
                type="time"
                value={formData.shift_start}
                onChange={(e) => setFormData({ ...formData, shift_start: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shift_end">End Time</Label>
              <Input
                id="shift_end"
                type="time"
                value={formData.shift_end}
                onChange={(e) => setFormData({ ...formData, shift_end: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="WIB">WIB (UTC+7)</SelectItem>
                <SelectItem value="WITA">WITA (UTC+8)</SelectItem>
                <SelectItem value="WIT">WIT (UTC+9)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createSchedule.isPending}>
              {createSchedule.isPending ? 'Creating...' : 'Create Schedule'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
