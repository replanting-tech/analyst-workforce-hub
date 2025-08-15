import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit2, Check, X, AlertCircle, Search } from 'lucide-react';
import { useStructuredReport } from '@/hooks/useStructuredReport';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Editor } from '@tinymce/tinymce-react';

export interface ReportField {
  id: string;
  key: string;
  value: string;
  isEditable: boolean;
  required: boolean;
}

interface StructuredReportProps {
  incidentId: string;
  onAnalysisUpdate?: (analysis: string) => void;
  className?: string;
}

type ExtendedReportField = ReportField & {
  isEditing: boolean;
};

// Define the field keys we want to display outside the component to prevent recreation
const DISPLAY_FIELDS = [
  'ticket_id',
  'ticket_name',
  'log_source',
  'alert_date',
  'incident_severity',
  'entity',
  'description',
  'threat_indicators',
  'technical_recommendation',
  'analyst_notes'
] as const;

export function StructuredReport({
  incidentId,
  onAnalysisUpdate,
  className = ''
}: StructuredReportProps) {
  const {
    fields: initialFields,
    isLoading,
    error,
    saveReport,
    refetch,
    lookupOriginalFieldValue
  } = useStructuredReport(incidentId);

  const [fields, setFields] = useState<ExtendedReportField[]>([]);
  const [editingField, setEditingField] = useState<ReportField | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorField, setEditorField] = useState<ReportField | null>(null);
  const [editorContent, setEditorContent] = useState('');

  // Update fields when initialFields changes
  useEffect(() => {
    if (initialFields) {
      // Ensure fields are sorted according to DISPLAY_FIELDS when setting them
      const sortedFields = DISPLAY_FIELDS
        .map(key => initialFields.find(field => field.id === key))
        .filter((field): field is ReportField => !!field)
        .map(field => ({ ...field, isEditing: false }));
      setFields(sortedFields);
    }
  }, [initialFields]);

  // Notify parent of analysis updates
  useEffect(() => {
    if (onAnalysisUpdate) {
      const analysis = fields.find(f => f.id === 'analyst_notes')?.value || '';
      onAnalysisUpdate(analysis);
    }
  }, [fields, onAnalysisUpdate]);

  // Handle loading and error states
  if (isLoading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader className="p-3">
          <CardTitle className="text-md font-semibold">Loading Report...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-3 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Error Loading Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error.message || 'Failed to load report. Please try again.'}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const RICH_FIELD_IDS = new Set(['description', 'threat_indicators', 'technical_recommendation']);

  const handleEdit = (field: ReportField) => {
    // For rich text fields, open modal with editor
    if (RICH_FIELD_IDS.has(field.id)) {
      setEditorField(field);
      setEditorContent(field.value || '');
      setIsEditorOpen(true);
      return;
    }

    // Set the field being edited and its current value
    setEditingField(field);
    setEditValue(field.value);

    // Update the fields to mark only the current field as being edited
    setFields(prevFields =>
      prevFields.map(f => ({
        ...f,
        isEditing: f.id === field.id
      }))
    );
  };

  const handleSaveEdit = async () => {
    if (!editingField) return;

    setIsSaving(true);

    try {
      // Create a copy of the current fields to update
      const updatedFields = fields.map(field => {
        if (field.id === editingField.id) {
          return { ...field, value: editValue, isEditing: false };
        }
        return field;
      });

      // Call saveReport with the updated fields
      await saveReport(updatedFields);

      // Update the local state to reflect the changes
      setFields(updatedFields);
      setEditingField(null);
      setEditValue('');

      // Show a subtle saved indicator instead of toast to reduce distraction
    } catch (error) {
      console.error('Error saving field:', error);
      toast.error('Failed to save changes. Please try again.');

      // Reset editing state on error
      setFields(prevFields =>
        prevFields.map(field => ({
          ...field,
          isEditing: false
        }))
      );
      setEditingField(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRichEdit = async () => {
    if (!editorField) return;
    setIsSaving(true);
    try {
      const updatedFields = fields.map(field => {
        if (field.id === editorField.id) {
          return { ...field, value: editorContent };
        }
        return field;
      });

      await saveReport(updatedFields);
      setFields(updatedFields);
      setIsEditorOpen(false);
      setEditorField(null);
      setEditorContent('');
    } catch (error) {
      console.error('Error saving rich text field:', error);
      toast.error('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset the editing state without saving changes
    setFields(prevFields =>
      prevFields.map(field => ({
        ...field,
        isEditing: false
      }))
    );
    setEditingField(null);
    setEditValue('');
  };

  const handleLookup = async (field: ReportField) => {
    toast.info(`Looking up original value for ${field.key}...`);
    try {
      const originalValue = await lookupOriginalFieldValue(field.id);
      if (originalValue !== undefined) {
        const updatedFields = fields.map(f =>
          f.id === field.id ? { ...f, value: originalValue } : f
        );
        setFields(updatedFields);
        toast.success(`Original value found for ${field.key}. Saving changes...`);
        await saveReport(updatedFields);
        toast.success(`Changes for ${field.key} saved successfully!`);
      } else {
        toast.info(`No original value found for ${field.key}.`);
      }
    } catch (error) {
      console.error('Error looking up or saving original field value:', error);
      toast.error(`Failed to lookup or save original value for ${field.key}.`);
    }
  };

  // Handle blur event for auto-save
  const handleBlur = (field: ReportField) => {
    // Only save if we have an active editing field and the values have changed
    if (editingField && field.id === editingField.id && editValue !== editingField.value) {
      handleSaveEdit();
    } else if (editingField) {
      // If values haven't changed, just cancel edit mode
      handleCancelEdit();
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-3">
        <div className="rounded-md">
          <Table className="text-sm">
            <TableHeader>
              <TableRow className="h-8">
                <TableHead className="w-[30%] font-medium p-2">Field</TableHead>
                <TableHead className="font-medium p-2">Value</TableHead>
                <TableHead className="w-[60px] p-2"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field) => (
                <TableRow key={field.id} className="hover:bg-muted/50 h-10">
                  <TableCell className="font-medium p-2 align-middle">
                    <div className="flex items-center">
                      <span className="text-xs text-muted-foreground">{field.key}</span>
                      {field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </div>
                  </TableCell>
                  <TableCell className="p-2">
                    {field.isEditing ? (
                      <div className="w-full">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                          onBlur={() => handleBlur(field)}
                          autoFocus
                          className="h-8 text-sm px-2 py-1"
                        />
                      </div>
                    ) : (
                      <div 
                        className={`min-h-[32px] flex items-center ${!field.value ? 'text-muted-foreground' : ''} cursor-text`}
                        onClick={() => handleEdit(field)}
                      >
                        { (field.id === 'description' || field.id === 'analyst_notes' || field.id === 'threat_indicators' || field.id === 'technical_recommendation') ? (
                          <div dangerouslySetInnerHTML={{ __html: field.value || '-' }} />
                        ) : (
                          field.value || <span>-</span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="p-1 w-8 flex justify-end gap-1">
                    {field.isEditable && !field.isEditing && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleLookup(field)}
                        disabled={isLoading}
                        className="h-7 w-7 p-0 hover:bg-muted rounded-full"
                        title="Lookup field from source"
                      >
                        <Search className="h-3 w-3" />
                      </Button>
                    )}
                    {field.isEditable && !field.isEditing && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(field)}
                        disabled={isLoading}
                        className="h-7 w-7 p-0 hover:bg-muted rounded-full"
                        title="Edit field"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Rich Text Editor Dialog */}
        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editorField?.key || 'Edit'}</DialogTitle>
            </DialogHeader>
            <div className="mt-2">
              <Editor
                apiKey='9pxbmembo1uetj3qto7w4t0ce6vi14e321zvnvyip544v0yi'
                initialValue={editorContent}
                onEditorChange={(content) => setEditorContent(content)}
                init={{
                  height: 400,
                  menubar: false,
                  statusbar: false,
                  plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'table', 'help', 'wordcount'
                  ],
                  toolbar: 'undo redo | blocks | bold italic underline | alignleft aligncenter alignright | bullist numlist | removeformat',
                  content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRichEdit} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default StructuredReport;
