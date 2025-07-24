
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAnalysts } from '@/hooks/useAnalysts';
import { useCreateSchedule } from '@/hooks/useSchedule';

export function ImportScheduleDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { data: analysts } = useAnalysts();
  const createSchedule = useCreateSchedule();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const processExcelFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    
    try {
      // This is a simplified version - in a real implementation, you'd use a library like SheetJS
      // to parse the Excel file according to the format you described
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        
        // Parse the Excel content here
        // This is a placeholder - you'd need to implement proper Excel parsing
        // based on the format you described
        
        toast({
          title: "Info",
          description: "Excel import feature is under development. Please use the Create Schedule form for now.",
          variant: "default",
        });
      };
      
      reader.readAsText(file);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process Excel file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive",
      });
      return;
    }

    await processExcelFile();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Import Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Schedule from Excel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Excel File</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="flex-1"
              />
              <FileSpreadsheet className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-sm text-gray-500">
              Upload an Excel file with schedule data in the specified format
            </p>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Expected Format:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• A1-A2: Month name (merged cell)</li>
              <li>• B1-AF1: Day numbers (1-31)</li>
              <li>• B2-AF2: Day names (MON, TUE, etc.)</li>
              <li>• A3-A4: Shift time (08.00 - 20.00)</li>
              <li>• B3-AF3: Analyst names for each day</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!file || isProcessing}>
              {isProcessing ? 'Processing...' : 'Import'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
