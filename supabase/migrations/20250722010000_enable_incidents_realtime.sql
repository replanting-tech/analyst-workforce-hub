
-- Enable realtime for incidents table
ALTER TABLE public.incidents REPLICA IDENTITY FULL;

-- Add the table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
