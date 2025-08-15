-- Create structured_reports table
CREATE TABLE IF NOT EXISTS public.structured_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  fields JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_structured_reports_incident_id ON public.structured_reports(incident_id);

-- Enable RLS for security
ALTER TABLE public.structured_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for secure access
CREATE POLICY "Enable read access for authenticated users"
  ON public.structured_reports
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON public.structured_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON public.structured_reports
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_structured_reports_modtime
BEFORE UPDATE ON public.structured_reports
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
