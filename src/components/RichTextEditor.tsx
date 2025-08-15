import { useRef, useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Save, History, FileText, RotateCcw } from 'lucide-react';
import { useReportTemplates, useCurrentReportVersion, useSaveReportVersion, useReportVersions, useRestoreReportVersion, type ReportVersion } from '@/hooks/useReportTemplates';
import { parseTemplateVariables } from '@/utils/templateParser';
import type { Incident } from '@/hooks/useIncidents';
import { toast } from 'sonner';

interface RichTextEditorProps {
  incident: Incident;
  isCustomerPortal?: boolean;
  value?: string;
  onChange?: (content: string) => void;
}

export default function RichTextEditor({
  incident,
  isCustomerPortal = false,
  value = '',
  onChange
}: RichTextEditorProps) {
  const editorRef = useRef<any>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [currentContent, setCurrentContent] = useState<string>(value);
  const [changeSummary, setChangeSummary] = useState<string>('');
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);

  const { data: templates, isLoading: templatesLoading } = useReportTemplates();
  const { data: currentVersion } = useCurrentReportVersion(incident.incident_id);
  const { data: versions = [] } = useReportVersions(incident.incident_id);
  const saveVersion = useSaveReportVersion();
  const restoreVersion = useRestoreReportVersion();

  // Only update editor when value changes from outside
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getContent()) {
      setCurrentContent(value);
      editorRef.current.setContent(value);
    }
  }, [value]);

  // Load current version or default template on mount
  useEffect(() => {
    if (currentVersion) {
      const content = currentVersion.content;
      setCurrentContent(content);
      if (onChange) onChange(content);
      if (editorRef.current) {
        editorRef.current.setContent(content);
      }
    } else if (templates?.length > 0) {
      const defaultTemplate = templates.find(t => t.is_default) || templates[0];
      const parsedContent = parseTemplateVariables(defaultTemplate.template_content, incident);
      setCurrentContent(parsedContent);
      setSelectedTemplateId(defaultTemplate.id);
      if (onChange) onChange(parsedContent);
      if (editorRef.current) {
        editorRef.current.setContent(parsedContent);
      }
    }
  }, [currentVersion, templates, incident]);

  const handleTemplateChange = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (template && editorRef.current) {
      const parsedContent = parseTemplateVariables(template.template_content, incident);
      editorRef.current.setContent(parsedContent);
      setCurrentContent(parsedContent);
      setSelectedTemplateId(templateId);
    }
  };

  const handleSave = async () => {
    if (!editorRef.current) return;

    const content = editorRef.current.getContent();
    setCurrentContent(content);
    if (onChange) onChange(content);

    try {
      await saveVersion.mutateAsync({
        incidentId: incident.incident_id,
        content,
        changeSummary: changeSummary || 'Updated report',
        templateId: selectedTemplateId
      });

      toast.success('Report saved successfully');
      setChangeSummary('');
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Failed to save report');
    }
  };

  const handleRestoreVersion = async (version: ReportVersion) => {
    try {
      await restoreVersion.mutateAsync({
        incidentId: incident.incident_id,
        versionId: version.id
      });

      setCurrentContent(version.content);
      if (onChange) onChange(version.content);
      if (editorRef.current) {
        editorRef.current.setContent(version.content);
      }

      toast.success('Version restored successfully');
      setIsVersionDialogOpen(false);
    } catch (error) {
      console.error('Error restoring version:', error);
      toast.error('Failed to restore version');
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {!isCustomerPortal && <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <Label>Template:</Label>
          </div>
          <Select
            value={selectedTemplateId}
            onValueChange={handleTemplateChange}
            disabled={templatesLoading}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              {templates?.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <div className="flex items-center gap-2">
                    {template.name}
                    {template.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>}

      {/* Editor with Undo/Redo Fix */}
      <Editor
        apiKey='9pxbmembo1uetj3qto7w4t0ce6vi14e321zvnvyip544v0yi'
        onInit={(_evt, editor) => {
          editorRef.current = editor;
          if (currentContent) {
            editor.setContent(currentContent);
            editor.mode.set(isCustomerPortal ? 'readonly' : 'design');
          }
        }}
        initialValue={currentContent}
        init={{
          height: 500,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
          undoRedoLevels: 100,
          setup: (editor) => {
            editor.addShortcut('meta+z', 'Undo', () => editor.execCommand('Undo'));
            editor.addShortcut('ctrl+z', 'Undo', () => editor.execCommand('Undo'));
            editor.addShortcut('meta+shift+z', 'Redo', () => editor.execCommand('Redo'));
            editor.addShortcut('ctrl+y', 'Redo', () => editor.execCommand('Redo'));
          }
        }}
        onEditorChange={(content) => {
          setCurrentContent(content);
          if (onChange) onChange(content);
        }}
      />

      {!isCustomerPortal && <div>
        <div className='flex items-center justify-between gap-2'>
          {currentVersion && (
            <div className="text-sm text-muted-foreground flex items-center gap-4">
              <span>Current: Version {currentVersion.version_number}</span>
              <span>Last saved: {formatDateTime(currentVersion.created_at)}</span>
              {currentVersion.created_by && (
                <span>by {currentVersion.created_by}</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <History className="w-4 h-4 mr-2" />
                  Versions ({versions.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Report Versions</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className={`p-4 border rounded-lg ${version.is_current ? 'border-primary bg-primary/5' : 'border-border'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={version.is_current ? 'default' : 'secondary'}>
                            Version {version.version_number}
                          </Badge>
                          {version.is_current && <Badge variant="outline">Current</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {formatDateTime(version.created_at)}
                          </span>
                          {!version.is_current && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRestoreVersion(version)}
                              disabled={restoreVersion.isPending}
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Restore
                            </Button>
                          )}
                        </div>
                      </div>
                      {version.change_summary && (
                        <p className="text-sm text-muted-foreground mb-2">{version.change_summary}</p>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Created by: {version.created_by || 'Unknown'}
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            <Button size="sm" onClick={handleSave} disabled={saveVersion.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {saveVersion.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>}
    </div>
  );
}
