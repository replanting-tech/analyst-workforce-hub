
import { useState, useRef, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Save, XCircle } from 'lucide-react';

interface Template {
  id?: string;
  name: string;
  description?: string;
  template_content: string;
  variables: string[];
  is_default: boolean;
  is_active: boolean;
  created_by?: string;
}

interface TemplateEditorProps {
  template?: Template;
  onSave: (template: Partial<Template>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const AVAILABLE_VARIABLES = [
  'ticket_id',
  'ticket_name',
  'log_source',
  'alert_date',
  'severity',
  'entity_info',
  'description',
  'threat_indicators',
  'technical_recommendation',
  'customer_name',
  'analyst_name',
  'status'
];

export default function TemplateEditor({ template, onSave, onCancel, isLoading }: TemplateEditorProps) {
  const editorRef = useRef<any>(null);
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    template_content: template?.template_content || '',
    variables: template?.variables || [],
    is_default: template?.is_default || false,
    is_active: template?.is_active ?? true,
    created_by: template?.created_by || 'analyst'
  });

  const [newVariable, setNewVariable] = useState('');

  useEffect(() => {
    if (template && editorRef.current) {
      editorRef.current.setContent(template.template_content);
    }
  }, [template]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Please enter a template name');
      return;
    }

    const content = editorRef.current?.getContent() || '';
    if (!content.trim()) {
      alert('Please enter template content');
      return;
    }

    onSave({
      ...formData,
      template_content: content,
    });
  };

  const addVariable = (variable: string) => {
    if (variable && !formData.variables.includes(variable)) {
      setFormData(prev => ({
        ...prev,
        variables: [...prev.variables, variable]
      }));
    }
    setNewVariable('');
  };

  const removeVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v !== variable)
    }));
  };

  const insertVariable = (variable: string) => {
    if (editorRef.current) {
      editorRef.current.insertContent(`{${variable}}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="grid gap-4">
        <div>
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter template name"
          />
        </div>
        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter template description"
            rows={2}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_default"
              checked={formData.is_default}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
            />
            <Label htmlFor="is_default">Set as Default</Label>
          </div>
        </div>
      </div>

      {/* Variables Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Variables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Available Variables</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {AVAILABLE_VARIABLES.map((variable) => (
                <Button
                  key={variable}
                  size="sm"
                  variant="outline"
                  onClick={() => insertVariable(variable)}
                  className="text-xs"
                >
                  {`{${variable}}`}
                  <Plus className="w-3 h-3 ml-1" />
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label>Add Custom Variable</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={newVariable}
                onChange={(e) => setNewVariable(e.target.value)}
                placeholder="Enter variable name"
                onKeyPress={(e) => e.key === 'Enter' && addVariable(newVariable)}
              />
              <Button size="sm" onClick={() => addVariable(newVariable)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {formData.variables.length > 0 && (
            <div>
              <Label>Template Variables</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.variables.map((variable) => (
                  <Badge key={variable} variant="secondary" className="flex items-center gap-1">
                    {`{${variable}}`}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-auto p-0 w-4 h-4"
                      onClick={() => removeVariable(variable)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Content Editor */}
      <div>
        <Label>Template Content</Label>
        <div className="mt-2 border rounded-md">
          <Editor
            apiKey='9pxbmembo1uetj3qto7w4t0ce6vi14e321zvnvyip544v0yi'
            onInit={(_evt, editor) => {
              editorRef.current = editor;
              if (formData.template_content) {
                editor.setContent(formData.template_content);
              }
            }}
            initialValue={formData.template_content}
            init={{
              height: 400,
              menubar: false,
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
              ],
              toolbar: 'undo redo | blocks | ' +
                'bold italic forecolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'table | removeformat | help',
              content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          <XCircle className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Template'}
        </Button>
      </div>
    </div>
  );
}
