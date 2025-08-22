import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  autoLookup?: boolean; // New prop to control auto-lookup
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
  className = '',
  autoLookup = true // Default to true for auto-lookup
}: StructuredReportProps) {
  const {
    fields: initialFields,
    isLoading,
    error,
    saveReport,
    refetch,
    lookupOriginalFieldValue
  } = useStructuredReport(incidentId);

  const [mode, setMode] = useState<'display' | 'edit'>('display'); // 'display' or 'edit'
  const [fields, setFields] = useState<ExtendedReportField[]>([]);
  const [editingField, setEditingField] = useState<ReportField | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorField, setEditorField] = useState<ReportField | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [hasPerformedAutoLookup, setHasPerformedAutoLookup] = useState(false); // Track if auto-lookup has been performed
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [selectedVariable, setSelectedVariable] = useState<{ id: string; value: string } | null>(null);
  const [variableEditorContent, setVariableEditorContent] = useState('');

  // New state for the variable being edited in the modal
  const [variableModalData, setVariableModalData] = useState<{
    fieldId: string;
    variableName: string;
    currentValue: string;
    originalFieldValue: string; // The full field value where the variable resides
  } | null>(null);

  const handleVariableClick = useCallback(async (fieldId: string, variableName: string, originalFieldValue: string) => {
    // Find the current value of the variable from the fields state
    const field = fields.find(f => f.id === fieldId);
    let currentValue = '';
    if (field) {
      const regex = new RegExp(`\\{\\{${variableName}\\}\\}`, 'g');
      const match = field.value.match(regex);
      if (match) {
        // For now, we'll just use the variable name as the current value in the modal
        // A more sophisticated approach would involve parsing the actual value associated with the variable
        // if it's not directly the variable name itself.
        currentValue = match[0]; // e.g., "{{ticket_key}}"
      }
    }

    setVariableModalData({
      fieldId,
      variableName,
      currentValue,
      originalFieldValue,
    });
    setVariableEditorContent(currentValue); // Initialize TinyMCE content
    setIsVariableModalOpen(true);
  }, [fields]);

  const handleSaveVariableEdit = async () => {
    if (!variableModalData) return;

    setIsSaving(true);
    try {
      const { fieldId, variableName, originalFieldValue } = variableModalData;
      const currentValue = variableEditorContent; // Use content from TinyMCE

      // Replace the old variable placeholder with the new value in the original field's content
      // This assumes the user is editing the placeholder itself, not its resolved value.
      // If the user is editing the resolved value, we need a different approach.
      // Based on the prompt "the value {{}} with red highlight can be selected and show modal",
      // it implies editing the placeholder.

      // Find the field to update
      const fieldToUpdate = fields.find(f => f.id === fieldId);
      if (!fieldToUpdate) {
        toast.error("Field not found for variable update.");
        return;
      }

      // Replace the specific variable in the field's value
      // This regex ensures we only replace the exact variable placeholder
      const updatedFieldValue = fieldToUpdate.value.replace(
        new RegExp(`\\{\\{${variableName}\\}\\}`, 'g'),
        currentValue // The new value from the modal input
      );

      const updatedFields = fields.map(f =>
        f.id === fieldId ? { ...f, value: updatedFieldValue } : f
      );

      await saveReport(updatedFields);
      setFields(updatedFields);
      setIsVariableModalOpen(false);
      setVariableModalData(null);
      toast.success(`Variable ${variableName} updated successfully!`);
    } catch (error) {
      console.error('Error saving variable edit:', error);
      toast.error('Failed to save variable changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper component to render content with clickable variables
  const VariableContentRenderer: React.FC<{ content: string; fieldId: string; onVariableClick?: (variableName: string) => void }> = ({ content, fieldId, onVariableClick }) => {
    const parts: React.ReactNode[] = [];
    const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
    let textToRender = content;

    // If content is empty, and it's a known template field, display the placeholder
    if (!content || content.trim() === '' || content.trim() === '-') {
      // Check if fieldId is one of the DISPLAY_FIELDS that typically contain variables
      const isTemplateField = DISPLAY_FIELDS.includes(fieldId as typeof DISPLAY_FIELDS[number]);
      if (isTemplateField) {
        textToRender = `{{${fieldId}}}`; // Use fieldId as the variable name
      } else {
        textToRender = content || '-'; // Fallback to original content or hyphen
      }
    }

    let lastIndex = 0;
    let match;

    while ((match = regex.exec(textToRender)) !== null) {
      const [fullMatch, variableName] = match;
      const startIndex = match.index;
      const endIndex = regex.lastIndex;

      // Add text before the variable
      if (startIndex > lastIndex) {
        parts.push(<React.Fragment key={`text-${lastIndex}`}>{textToRender.substring(lastIndex, startIndex)}</React.Fragment>);
      }

      // Add the clickable variable span
      parts.push(
        <span
          key={`var-${startIndex}`}
          className="bg-red-200 text-red-800 px-1 rounded cursor-pointer hover:bg-red-300"
          onClick={(e) => {
            if (onVariableClick) {
              e.stopPropagation(); // Prevent the parent div's onClick from firing
              onVariableClick(variableName);
            }
          }}
        >
          {fullMatch}
        </span>
      );
      lastIndex = endIndex;
    }

    // Add any remaining text after the last variable
    if (lastIndex < textToRender.length) {
      parts.push(<React.Fragment key={`text-${lastIndex}`}>{textToRender.substring(lastIndex)}</React.Fragment>);
    }

    // If no variables were found but content exists, render it as plain text
    if (parts.length === 0 && textToRender) {
      return <>{textToRender}</>;
    }

    return <>{parts}</>;
  };

  // Update fields when initialFields changes and perform auto-lookup if enabled
  useEffect(() => {
    if (initialFields) {
      // Ensure fields are sorted according to DISPLAY_FIELDS when setting them
      const sortedFields = DISPLAY_FIELDS
        .map(key => initialFields.find(field => field.id === key))
        .filter((field): field is ReportField => !!field)
        .map(field => ({ ...field, isEditing: false }));
      setFields(sortedFields);
      
      // Perform auto-lookup if enabled and not already performed
      if (autoLookup && !hasPerformedAutoLookup) {
        // Use a setTimeout to ensure this runs after the component has fully rendered
        const timer = setTimeout(() => {
          // Call handleLookup for all editable fields that don't have values yet
          const performAutoLookup = async () => {
            for (const field of sortedFields) {
              // Only lookup fields that are editable and don't have values yet
              if (field.isEditable && (!field.value || field.value.trim() === '')) {
                try {
                  // Create a temporary handleLookup function to avoid dependency issues
                  const tempHandleLookup = async (field: ReportField) => {
                    toast.info(`Looking up original value for ${field.key}...`);
                    try {
                      const originalValue = await lookupOriginalFieldValue(field.id);
                      if (originalValue !== undefined) {
                        const updatedFields = sortedFields.map(f =>
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
                  
                  await tempHandleLookup(field);
                } catch (error) {
                  console.error(`Error performing auto-lookup for field ${field.key}:`, error);
                }
              }
            }
          };
          
          performAutoLookup();
        }, 0);
        
        // Mark that we've performed the auto-lookup
        setHasPerformedAutoLookup(true);
        
        // Clean up the timer
        return () => clearTimeout(timer);
      }
    }
  }, [initialFields, autoLookup, hasPerformedAutoLookup, lookupOriginalFieldValue, saveReport]);

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
          <div className="flex justify-end space-x-2">
            <Button
              variant={mode === 'display' ? 'default' : 'outline'}
              onClick={() => setMode('display')}
              size="sm"
            >
              Display Mode
            </Button>
            <Button
              variant={mode === 'edit' ? 'default' : 'outline'}
              onClick={() => setMode('edit')}
              size="sm"
            >
              Edit Mode
            </Button>
          </div>
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
          <div className="flex justify-end space-x-2">
            <Button
              variant={mode === 'display' ? 'default' : 'outline'}
              onClick={() => setMode('display')}
              size="sm"
            >
              Display Mode
            </Button>
            <Button
              variant={mode === 'edit' ? 'default' : 'outline'}
              onClick={() => setMode('edit')}
              size="sm"
            >
              Edit Mode
            </Button>
          </div>
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

  // New state for the variable being edited in the modal


  // Helper component to render content with clickable variables

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="p-3 pb-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md font-semibold">Structured Report</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant={mode === 'display' ? 'default' : 'outline'}
              onClick={() => setMode('display')}
              size="sm"
            >
              Display Mode
            </Button>
            <Button
              variant={mode === 'edit' ? 'default' : 'outline'}
              onClick={() => setMode('edit')}
              size="sm"
            >
              Edit Mode
            </Button>
          </div>
        </div>
      </CardHeader>
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
                        className={`min-h-[32px] flex items-center ${!field.value ? 'text-muted-foreground' : ''} ${mode === 'edit' ? '' : 'cursor-text'}`}
                        onClick={() => mode === 'display' ? handleEdit(field) : undefined} // Only allow direct field edit in display mode
                      >
                        <VariableContentRenderer
                          content={field.value} // Pass raw field.value
                          fieldId={field.id} // Pass field.id for placeholder logic
                          onVariableClick={mode === 'edit' ? (variableName) => handleVariableClick(field.id, variableName, field.value) : undefined}
                        />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="p-1 w-8 flex justify-end gap-1">
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

        {/* Variable Edit Modal */}
        <Dialog open={isVariableModalOpen} onOpenChange={setIsVariableModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Variable: {variableModalData?.variableName}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-4">
                <Editor
                  apiKey='9pxbmembo1uetj3qto7w4t0ce6vi14e321zvnvyip544v0yi'
                  initialValue={variableEditorContent}
                  onEditorChange={(content) => setVariableEditorContent(content)}
                  init={{
                    height: 200, // Smaller height for variable editing
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsVariableModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveVariableEdit} disabled={isSaving}>
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
