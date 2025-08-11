
-- Create incident status workflow table
CREATE TABLE public.incident_status_workflow (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status_code TEXT NOT NULL UNIQUE,
  status_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create incident status transitions table to define allowed transitions
CREATE TABLE public.incident_status_transitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  transition_name TEXT NOT NULL,
  requires_approval BOOLEAN DEFAULT false,
  auto_transition BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(from_status, to_status)
);

-- Insert the new status workflow
INSERT INTO public.incident_status_workflow (status_code, status_name, description, sort_order) VALUES
('open', 'Open', 'Initial status when incident is created and under investigation', 1),
('incident', 'Incident', 'Confirmed as a true security incident requiring response', 2),
('incident_closed', 'Incident-Closed', 'Incident has been resolved and closed', 3),
('false_positive_closed', 'False-Positive Closed', 'Determined to be false positive and closed', 4);

-- Insert allowed status transitions based on your flowchart
INSERT INTO public.incident_status_transitions (from_status, to_status, transition_name, requires_approval) VALUES
('open', 'incident', 'Confirm as True Alert', false),
('open', 'false_positive_closed', 'Mark as False Alert', false),
('incident', 'incident_closed', 'Close Incident', false),
('incident', 'false_positive_closed', 'Correction - Mark as False Positive', true),
('incident_closed', 'incident', 'Re-Open Incident', true),
('false_positive_closed', 'incident', 'Correction - Reopen as Incident', true);

-- Update existing incidents to use new status values
-- Map old statuses to new ones
UPDATE public.incidents 
SET status = CASE 
  WHEN status = 'active' THEN 'open'
  WHEN status = 'closed' THEN 'incident_closed'
  WHEN status = 'escalated' THEN 'incident'
  WHEN status = 'need review' THEN 'open'
  ELSE 'open'
END;

-- Create function to get allowed next statuses for an incident
CREATE OR REPLACE FUNCTION public.get_allowed_status_transitions(current_status TEXT)
RETURNS TABLE(
  to_status TEXT,
  transition_name TEXT,
  requires_approval BOOLEAN
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    ist.to_status,
    ist.transition_name,
    ist.requires_approval
  FROM public.incident_status_transitions ist
  WHERE ist.from_status = current_status
  ORDER BY ist.transition_name;
$$;

-- Create function to validate status transition
CREATE OR REPLACE FUNCTION public.validate_status_transition(
  p_from_status TEXT,
  p_to_status TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.incident_status_transitions 
    WHERE from_status = p_from_status 
    AND to_status = p_to_status
  );
$$;

-- Update the existing update_incident_status function to validate transitions
CREATE OR REPLACE FUNCTION public.update_incident_status_with_validation(
  p_incident_id TEXT,
  p_new_status TEXT,
  p_analyst_code TEXT DEFAULT NULL,
  p_jira_ticket_id TEXT DEFAULT NULL,
  p_customer_notification TEXT DEFAULT NULL,
  p_changed_by TEXT DEFAULT NULL,
  p_change_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_status TEXT;
    v_old_analyst_id UUID;
    v_new_analyst_id UUID;
    v_internal_id UUID;
    v_transition_valid BOOLEAN;
    result JSON;
BEGIN
    -- Get current status, analyst, and internal ID
    SELECT status, analyst_id, id INTO v_old_status, v_old_analyst_id, v_internal_id
    FROM incidents 
    WHERE incident_id = p_incident_id;
    
    IF v_internal_id IS NULL THEN
        RAISE EXCEPTION 'Incident % not found', p_incident_id;
    END IF;
    
    -- Validate status transition if changing status
    IF p_new_status IS NOT NULL AND p_new_status != v_old_status THEN
        SELECT public.validate_status_transition(v_old_status, p_new_status) INTO v_transition_valid;
        
        IF NOT v_transition_valid THEN
            RAISE EXCEPTION 'Invalid status transition from % to %', v_old_status, p_new_status;
        END IF;
    END IF;
    
    -- Get new analyst ID if provided
    IF p_analyst_code IS NOT NULL THEN
        SELECT id INTO v_new_analyst_id 
        FROM analysts 
        WHERE code = p_analyst_code AND status = 'active';
        
        IF v_new_analyst_id IS NULL THEN
            RAISE EXCEPTION 'Analyst with code % not found or inactive', p_analyst_code;
        END IF;
    END IF;
    
    -- Update incident
    UPDATE incidents 
    SET 
        status = COALESCE(p_new_status, status),
        analyst_id = COALESCE(v_new_analyst_id, analyst_id),
        jira_ticket_id = COALESCE(p_jira_ticket_id, jira_ticket_id),
        customer_notification = COALESCE(p_customer_notification, customer_notification),
        closed_time = CASE 
          WHEN p_new_status IN ('incident_closed', 'false_positive_closed') THEN NOW() 
          ELSE closed_time 
        END,
        updated_at = NOW()
    WHERE incident_id = p_incident_id;
    
    -- Log status change
    INSERT INTO incident_status_log (
        incident_id, old_status, new_status, old_analyst_id, new_analyst_id, 
        changed_by, change_reason
    ) VALUES (
        v_internal_id, v_old_status, COALESCE(p_new_status, v_old_status), 
        v_old_analyst_id, COALESCE(v_new_analyst_id, v_old_analyst_id), 
        p_changed_by, p_change_reason
    );
    
    -- Update workload for analysts
    IF v_old_analyst_id IS NOT NULL THEN
        PERFORM update_analyst_workload(v_old_analyst_id);
    END IF;
    
    IF v_new_analyst_id IS NOT NULL AND v_new_analyst_id != v_old_analyst_id THEN
        PERFORM update_analyst_workload(v_new_analyst_id);
    END IF;
    
    -- Return result
    SELECT json_build_object(
        'success', true,
        'incident_id', v_internal_id,
        'old_status', v_old_status,
        'new_status', COALESCE(p_new_status, v_old_status),
        'transition_valid', v_transition_valid,
        'message', 'Incident updated successfully'
    ) INTO result;
    
    RETURN result;
END;
$$;
