
-- Create or replace the view to include all necessary fields
CREATE OR REPLACE VIEW v_incident_sla_details AS
SELECT 
    i.id,
    i.incident_id,
    i.incident_number,
    i.customer_id,
    i.creation_time,
    i.sla_target_time,
    i.priority,
    i.status,
    i.closed_time,
    i.jira_ticket_id,
    i.customer_notification,
    i.raw_logs,
    i.incident_url,
    i.created_at,
    i.updated_at,
    
    -- Analyst information
    a.code as analyst_code,
    a.name as analyst_name,
    a.email as analyst_email,
    
    -- Customer information
    c.workspace_name,
    c.customer_name,
    
    -- SLA calculations
    sc.resolution_minutes,
    get_sla_status(i.sla_target_time, i.status, i.closed_time) as sla_status,
    calculate_sla_remaining_seconds(i.sla_target_time, i.status, i.closed_time) as sla_remaining_seconds,
    format_time_remaining(calculate_sla_remaining_seconds(i.sla_target_time, i.status, i.closed_time)) as sla_remaining_formatted
    
FROM incidents i
LEFT JOIN analysts a ON i.analyst_id = a.id
LEFT JOIN customers c ON i.customer_id = c.id
LEFT JOIN sla_config sc ON i.customer_id = sc.customer_id AND i.priority = sc.priority
ORDER BY i.creation_time DESC;
