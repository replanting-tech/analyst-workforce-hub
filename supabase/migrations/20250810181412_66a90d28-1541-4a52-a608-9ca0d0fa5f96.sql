
-- Create customer portal users table for email login
CREATE TABLE public.customer_portal_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create customer portal sessions table
CREATE TABLE public.customer_portal_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.customer_portal_users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create customer reports table
CREATE TABLE public.customer_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL, -- 'incident_summary', 'security_metrics', 'threat_analysis', 'compliance'
  report_data JSONB,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  generated_by UUID REFERENCES public.customer_portal_users(id),
  file_path TEXT,
  status TEXT DEFAULT 'completed' -- 'pending', 'completed', 'failed'
);

-- Create customer settings table
CREATE TABLE public.customer_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB,
  updated_by UUID REFERENCES public.customer_portal_users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(customer_id, setting_key)
);

-- Enable RLS on all tables
ALTER TABLE public.customer_portal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_portal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customer_portal_users
CREATE POLICY "Users can view their own profile" 
  ON public.customer_portal_users 
  FOR SELECT 
  USING (id = (current_setting('app.current_user_id', true))::uuid);

CREATE POLICY "Users can update their own profile" 
  ON public.customer_portal_users 
  FOR UPDATE 
  USING (id = (current_setting('app.current_user_id', true))::uuid);

-- Create RLS policies for customer_portal_sessions
CREATE POLICY "Users can view their own sessions" 
  ON public.customer_portal_sessions 
  FOR SELECT 
  USING (user_id = (current_setting('app.current_user_id', true))::uuid);

-- Create RLS policies for customer_reports
CREATE POLICY "Users can view their customer reports" 
  ON public.customer_reports 
  FOR SELECT 
  USING (customer_id IN (
    SELECT customer_id 
    FROM customer_portal_users 
    WHERE id = (current_setting('app.current_user_id', true))::uuid
  ));

CREATE POLICY "Users can create reports for their customer" 
  ON public.customer_reports 
  FOR INSERT 
  WITH CHECK (customer_id IN (
    SELECT customer_id 
    FROM customer_portal_users 
    WHERE id = (current_setting('app.current_user_id', true))::uuid
  ));

-- Create RLS policies for customer_settings
CREATE POLICY "Users can view their customer settings" 
  ON public.customer_settings 
  FOR SELECT 
  USING (customer_id IN (
    SELECT customer_id 
    FROM customer_portal_users 
    WHERE id = (current_setting('app.current_user_id', true))::uuid
  ));

CREATE POLICY "Users can update their customer settings" 
  ON public.customer_settings 
  FOR ALL 
  USING (customer_id IN (
    SELECT customer_id 
    FROM customer_portal_users 
    WHERE id = (current_setting('app.current_user_id', true))::uuid
  ));

-- Insert sample data for testing
-- First, get a customer ID to use
INSERT INTO public.customer_portal_users (email, password_hash, customer_id, full_name, role)
SELECT 
  'customer@test.com',
  '$2b$10$dummy.hash.for.testing.purposes.only',
  id,
  'Test Customer User',
  'admin'
FROM public.customers
LIMIT 1;

-- Insert sample reports
INSERT INTO public.customer_reports (customer_id, report_name, report_type, report_data, status)
SELECT 
  c.id,
  'Weekly Incident Summary',
  'incident_summary',
  '{"incidents_count": 5, "resolved": 3, "pending": 2}'::jsonb,
  'completed'
FROM public.customers c
LIMIT 1;

INSERT INTO public.customer_reports (customer_id, report_name, report_type, report_data, status)
SELECT 
  c.id,
  'Monthly Security Metrics',
  'security_metrics',
  '{"threats_detected": 12, "false_positives": 2, "avg_response_time": "2.5 hours"}'::jsonb,
  'completed'
FROM public.customers c
LIMIT 1;

-- Insert sample settings
INSERT INTO public.customer_settings (customer_id, setting_key, setting_value)
SELECT 
  c.id,
  'notification_preferences',
  '{"email_alerts": true, "sms_alerts": false, "report_frequency": "weekly"}'::jsonb
FROM public.customers c
LIMIT 1;

INSERT INTO public.customer_settings (customer_id, setting_key, setting_value)
SELECT 
  c.id,
  'dashboard_preferences',
  '{"theme": "light", "default_view": "incidents", "auto_refresh": true}'::jsonb
FROM public.customers c
LIMIT 1;

-- Create updated_at trigger for customer_portal_users
CREATE TRIGGER update_customer_portal_users_updated_at
  BEFORE UPDATE ON public.customer_portal_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for customer_settings
CREATE TRIGGER update_customer_settings_updated_at
  BEFORE UPDATE ON public.customer_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
