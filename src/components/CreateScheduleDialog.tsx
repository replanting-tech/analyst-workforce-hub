
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useAnalystsList } from '@/hooks/useAnalystsList';
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

  const { data: analystsList, isLoading: analystsListLoading } = useAnalystsList();
  const createSchedule = useCreateSchedule();
  const { toast } = useToast();

  const formatTimeInput = (value: string) => {
    const cleanedValue = value.replace(/\D/g, ''); // Remove non-digits
    let formattedValue = cleanedValue;

    if (cleanedValue.length > 2) {
      formattedValue = `${cleanedValue.slice(0, 2)}:${cleanedValue.slice(2, 4)}`;
    }

    // Basic validation for hours and minutes
    const [hoursStr, minutesStr] = formattedValue.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (hours > 23 || minutes > 59) {
      // Optionally, you can clear the input or show an error
      // For now, we'll just return the potentially invalid formatted value
      // More robust validation will happen on form submission
    }

    return formattedValue;
  };
 
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

    // Validate time format before submission
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.shift_start) || !timeRegex.test(formData.shift_end)) {
      toast({
        title: "Error",
        description: "Please enter time in HH:mm (24h) format.",
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
                {analystsList?.map(analyst => (
                  <SelectItem key={analyst.id} value={analyst.id}>
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
                type="text"
                value={formData.shift_start}
                onChange={(e) => setFormData({ ...formData, shift_start: formatTimeInput(e.target.value) })}
                placeholder="HH:mm (24h format)"
                maxLength={5} // HH:mm is 5 characters
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shift_end">End Time</Label>
              <Input
                id="shift_end"
                type="text"
                value={formData.shift_end}
                onChange={(e) => setFormData({ ...formData, shift_end: formatTimeInput(e.target.value) })}
                placeholder="HH:mm (24h format)"
                maxLength={5} // HH:mm is 5 characters
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
