
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAnalystsList } from '@/hooks/useAnalystsList';
import { useCreateSchedule } from '@/hooks/useSchedule';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  shiftTemplate?: {
    name: string;
    start: string;
    end: string;
  };
}

export function AddScheduleModal({ isOpen, onClose, selectedDate, shiftTemplate }: AddScheduleModalProps) {
  const [selectedAnalysts, setSelectedAnalysts] = useState<string[]>([]);
  const [shiftStart, setShiftStart] = useState(shiftTemplate?.start || '');
  const [shiftEnd, setShiftEnd] = useState(shiftTemplate?.end || '');
  const [timezone, setTimezone] = useState('UTC');

  const { data: analystsList } = useAnalystsList();
  const createSchedule = useCreateSchedule();
  const { toast } = useToast();

  const handleAnalystToggle = (analystId: string) => {
    setSelectedAnalysts(prev => 
      prev.includes(analystId) 
        ? prev.filter(id => id !== analystId)
        : [...prev, analystId]
    );
  };

  const handleSubmit = async () => {
    if (!selectedDate || selectedAnalysts.length === 0 || !shiftStart || !shiftEnd) {
      toast({
        title: "Error",
        description: "Please select date, analysts, and shift times",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create schedule for each selected analyst
      const promises = selectedAnalysts.map(analystId =>
        createSchedule.mutateAsync({
          analyst_id: analystId,
          shift_date: format(selectedDate, 'yyyy-MM-dd'),
          shift_start: shiftStart,
          shift_end: shiftEnd,
          timezone,
        })
      );

      await Promise.all(promises);

      toast({
        title: "Success",
        description: `Schedules created for ${selectedAnalysts.length} analyst(s)`,
      });

      // Reset form
      setSelectedAnalysts([]);
      setShiftStart(shiftTemplate?.start || '');
      setShiftEnd(shiftTemplate?.end || '');
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create schedules",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Add Schedule for {selectedDate && format(selectedDate, 'MMMM dd, yyyy')}
            {shiftTemplate && ` - ${shiftTemplate.name}`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shift_start">Start Time</Label>
              <Select value={shiftStart} onValueChange={setShiftStart}>
                <SelectTrigger>
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="08:00">08:00</SelectItem>
                  <SelectItem value="16:00">16:00</SelectItem>
                  <SelectItem value="00:00">00:00</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shift_end">End Time</Label>
              <Select value={shiftEnd} onValueChange={setShiftEnd}>
                <SelectTrigger>
                  <SelectValue placeholder="Select end time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:00">16:00</SelectItem>
                  <SelectItem value="24:00">24:00</SelectItem>
                  <SelectItem value="08:00">08:00</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
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

          <div className="space-y-2">
            <Label>Select Analysts</Label>
            <div className="max-h-40 overflow-y-auto border rounded-md p-3">
              {analystsList?.map(analyst => (
                <div key={analyst.id} className="flex items-center space-x-2 py-1">
                  <Checkbox
                    id={analyst.id}
                    checked={selectedAnalysts.includes(analyst.id)}
                    onCheckedChange={() => handleAnalystToggle(analyst.id)}
                  />
                  <Label htmlFor={analyst.id} className="text-sm cursor-pointer">
                    {analyst.name} ({analyst.code})
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createSchedule.isPending}>
              {createSchedule.isPending ? 'Creating...' : 'Create Schedules'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
