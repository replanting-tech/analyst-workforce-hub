
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface ShiftTemplate {
  name: string;
  start: string;
  end: string;
  description: string;
}

interface ShiftTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ShiftTemplate) => void;
}

const shiftTemplates: ShiftTemplate[] = [
  {
    name: 'Morning Shift',
    start: '08:00',
    end: '16:00',
    description: '8 hour morning shift',
  },
  {
    name: 'Evening Shift',
    start: '16:00',
    end: '24:00',
    description: '8 hour evening shift',
  },
  {
    name: 'Night Shift',
    start: '00:00',
    end: '08:00',
    description: '8 hour night shift',
  },
  {
    name: 'Day Shift',
    start: '09:00',
    end: '17:00',
    description: 'Regular business hours',
  },
  {
    name: 'Extended Shift',
    start: '08:00',
    end: '20:00',
    description: '12 hour extended shift',
  },
];

export function ShiftTemplateModal({ isOpen, onClose, onSelectTemplate }: ShiftTemplateModalProps) {
  const handleSelectTemplate = (template: ShiftTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Shift Template</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {shiftTemplates.map((template, index) => (
            <Card 
              key={index} 
              className="cursor-pointer hover:bg-gray-50 transition-colors border-2 hover:border-blue-200"
              onClick={() => handleSelectTemplate(template)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">{template.name}</h3>
                  <Clock className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  {template.start} - {template.end}
                </div>
                <p className="text-xs text-gray-500">{template.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
