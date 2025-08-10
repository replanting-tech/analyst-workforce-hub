
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AgentRun {
  id: string;
  incident_id: string;
  status: string;
  mode: string;
  summary: string | null;
  started_at: string;
  finished_at: string | null;
}

interface AgentStep {
  id: string;
  run_id: string;
  step_name: string;
  status: string;
  input_blob: any;
  output_blob: any;
  started_at: string;
  finished_at: string | null;
}

interface AgentStepsTimelineProps {
  incidentId: string;
}

export function AgentStepsTimeline({ incidentId }: AgentStepsTimelineProps) {
  const [agentRun, setAgentRun] = useState<AgentRun | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AgentStepsTimeline: Starting to fetch data for incidentId:', incidentId);
    fetchAgentData();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('agent-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_runs',
          filter: `incident_id=eq.${incidentId}`
        },
        (payload) => {
          console.log('Real-time update for agent_runs:', payload);
          fetchAgentData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_steps'
        },
        (payload) => {
          console.log('Real-time update for agent_steps:', payload);
          if (agentRun) {
            fetchSteps(agentRun.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [incidentId]);

  const fetchAgentData = async () => {
    try {
      console.log('Fetching agent run for incident_id:', incidentId);
      
      const { data: runData, error: runError } = await supabase
        .from('agent_runs')
        .select('*')
        .eq('incident_id', incidentId)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (runError) {
        console.error('Error fetching agent run:', runError);
        return;
      }

      if (runData) {
        console.log('Found agent run:', runData);
        setAgentRun(runData);
        await fetchSteps(runData.id);
      } else {
        console.log('No agent run found for incident_id:', incidentId);
        setAgentRun(null);
        setSteps([]);
      }
    } catch (error) {
      console.error('Error in fetchAgentData:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSteps = async (runId: string) => {
    try {
      console.log('Fetching steps for run_id:', runId);
      
      const { data: stepsData, error: stepsError } = await supabase
        .from('agent_steps')
        .select('*')
        .eq('run_id', runId)
        .order('started_at', { ascending: true });

      if (stepsError) {
        console.error('Error fetching agent steps:', stepsError);
        return;
      }

      console.log('Found agent steps:', stepsData);
      setSteps(stepsData || []);
    } catch (error) {
      console.error('Error in fetchSteps:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading AI Agent Progress...</span>
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!agentRun) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Agent Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No AI agent run found for this incident.</p>
          <p className="text-sm text-gray-400 mt-2">Incident ID: {incidentId}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>AI Agent Progress</span>
          <Badge className={getStatusColor(agentRun.status)}>
            {agentRun.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm font-medium">Mode: {agentRun.mode}</p>
          <p className="text-sm text-gray-600">Started: {new Date(agentRun.started_at).toLocaleString()}</p>
          {agentRun.finished_at && (
            <p className="text-sm text-gray-600">Finished: {new Date(agentRun.finished_at).toLocaleString()}</p>
          )}
          {agentRun.summary && (
            <p className="text-sm mt-2">{agentRun.summary}</p>
          )}
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Investigation Steps</h4>
          {steps.length === 0 ? (
            <p className="text-gray-500 text-sm">No steps recorded yet.</p>
          ) : (
            steps.map((step, index) => (
              <div key={step.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(step.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-sm">{step.step_name}</h5>
                    <Badge variant="outline" className={getStatusColor(step.status)}>
                      {step.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Started: {new Date(step.started_at).toLocaleString()}
                  </p>
                  {step.finished_at && (
                    <p className="text-xs text-gray-500">
                      Finished: {new Date(step.finished_at).toLocaleString()}
                    </p>
                  )}
                  {step.output_blob && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(step.output_blob, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
