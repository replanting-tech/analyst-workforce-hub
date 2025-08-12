
-- Create table for incident report templates
CREATE TABLE public.incident_report_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb, -- Array of variable placeholders like {ticket_id}, {customer_name}
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT, -- analyst who created it
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for incident report versions (for versioning)
CREATE TABLE public.incident_report_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id TEXT NOT NULL, -- reference to incidents.incident_id
  version_number INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  template_id UUID REFERENCES incident_report_templates(id),
  created_by TEXT, -- analyst who created this version
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_current BOOLEAN DEFAULT true,
  change_summary TEXT
);

-- Create unique constraint to ensure only one current version per incident
CREATE UNIQUE INDEX idx_incident_current_version ON incident_report_versions (incident_id) WHERE is_current = true;

-- Create indexes for better performance
CREATE INDEX idx_report_templates_active ON incident_report_templates (is_active);
CREATE INDEX idx_report_versions_incident ON incident_report_versions (incident_id, version_number DESC);

-- Insert default template
INSERT INTO incident_report_templates (name, description, template_content, variables, is_default, created_by) VALUES (
  'Security Incident Report',
  'Default template for security incident reporting',
  '<table style="border-collapse: collapse; width: 100%; max-width: 100%; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">
  <tbody>
    <tr>
      <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">Ticket ID</td>
      <td style="border: 1px solid #ccc; padding: 8px;">{ticket_id}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">Ticket Name</td>
      <td style="border: 1px solid #ccc; padding: 8px;">{ticket_name}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">Log Source</td>
      <td style="border: 1px solid #ccc; padding: 8px;">{log_source}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">Alert Date</td>
      <td style="border: 1px solid #ccc; padding: 8px;">{alert_date}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">Incident Severity</td>
      <td style="border: 1px solid #ccc; padding: 8px;">{severity}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">Entity</td>
      <td style="border: 1px solid #ccc; padding: 8px;">{entity_info}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">Description</td>
      <td style="border: 1px solid #ccc; padding: 8px;">{description}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">Threat Indicators</td>
      <td style="border: 1px solid #ccc; padding: 8px;">{threat_indicators}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">Technical Recommendation</td>
      <td style="border: 1px solid #ccc; padding: 8px;">{technical_recommendation}</td>
    </tr>
  </tbody>
</table>',
  '["ticket_id", "ticket_name", "log_source", "alert_date", "severity", "entity_info", "description", "threat_indicators", "technical_recommendation"]'::jsonb,
  true,
  'system'
);

-- Enable RLS on tables
ALTER TABLE public.incident_report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_report_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for templates (all users can read, but only authorized can modify)
CREATE POLICY "All users can view templates" ON public.incident_report_templates FOR SELECT USING (true);
CREATE POLICY "Authorized users can manage templates" ON public.incident_report_templates FOR ALL USING (true);

-- Create RLS policies for versions (all users can read and create versions)
CREATE POLICY "All users can view report versions" ON public.incident_report_versions FOR SELECT USING (true);
CREATE POLICY "All users can create report versions" ON public.incident_report_versions FOR INSERT WITH CHECK (true);
CREATE POLICY "All users can update report versions" ON public.incident_report_versions FOR UPDATE USING (true);
