
-- Add agent_runs and agent_steps tables to the realtime publication for real-time updates
ALTER TABLE agent_runs REPLICA IDENTITY FULL;
ALTER TABLE agent_steps REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE agent_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_steps;
