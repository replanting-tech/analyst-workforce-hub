import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Circle,
  Bot,
  FileText,
  AlertCircle
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';

interface AgentStep {
  id: string;
  run_id: string;
  step_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  finished_at?: string;
  input_blob?: any;
  output_blob?: any;
}

interface AgentRun {
  id: string;
  incident_id: string;
  status: string;
  started_at: string;
  finished_at?: string;
  summary?: string;
  mode: string;
}

interface AgentStepsTimelineProps {
  incidentId: string;
}

const AgentStepsTimeline = ({ incidentId }: AgentStepsTimelineProps) => {
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [currentRun, setCurrentRun] = useState<AgentRun | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch the latest run and its steps
  const fetchLatestRunAndSteps = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get the latest run for this incident
      const { data: latestRun, error: runError } = await supabase
        .from('agent_runs')
        .select('*')
        .eq('incident_id', incidentId)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (runError) {
        console.error('Error fetching latest run:', runError);
        setError('Failed to fetch agent run data');
        return;
      }

      if (!latestRun) {
        setCurrentRun(null);
        setSteps([]);
        setIsLoading(false);
        return;
      }

      setCurrentRun(latestRun);

      // Get all steps for this run
      const { data: runSteps, error: stepsError } = await supabase
        .from('agent_steps')
        .select('*')
        .eq('run_id', latestRun.id)
        .order('started_at', { ascending: true });

      if (stepsError) {
        console.error('Error fetching steps:', stepsError);
        setError('Failed to fetch agent steps');
        return;
      }

      setSteps(runSteps || []);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscription for agent_steps changes
  useEffect(() => {
    if (!currentRun) return;

    const channel = supabase
      .channel(`agent-steps-${currentRun.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_steps',
          filter: `run_id=eq.${currentRun.id}`
        },
        (payload) => {
          console.log('New step inserted:', payload);
          setSteps(prev => [...prev, payload.new as AgentStep]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agent_steps',
          filter: `run_id=eq.${currentRun.id}`
        },
        (payload) => {
          console.log('Step updated:', payload);
          setSteps(prev => 
            prev.map(step => 
              step.id === payload.new.id ? payload.new as AgentStep : step
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentRun]);

  // Initial fetch on mount or incidentId change
  useEffect(() => {
    fetchLatestRunAndSteps();
  }, [incidentId]);

  const getStatusIcon = (status: AgentStep['status']) => {
    switch (status) {
      case 'pending':
        return <Circle className="w-4 h-4 text-muted-foreground" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: AgentStep['status']) => {
    const variants = {
      pending: 'secondary',
      running: 'default',
      completed: 'default',
      failed: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status]} className="ml-2">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatOutput = (output: any) => {
    if (!output) return null;
    
    if (typeof output === 'string') {
      return output;
    }
    
    if (typeof output === 'object') {
      // If it has a 'content' or 'message' field, use that
      if (output.content) return output.content;
      if (output.message) return output.message;
      if (output.result) return output.result;
      
      // Otherwise, stringify the object
      return JSON.stringify(output, null, 2);
    }
    
    return String(output);
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading agent analysis...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Analysis</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentRun) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No AI Analysis Available</h3>
            <p className="text-muted-foreground">
              No AI analysis has been run yet for this incident.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          AI Analysis Timeline
          {currentRun.summary && (
            <Badge variant="outline" className="ml-2">
              {currentRun.mode}
            </Badge>
          )}
        </CardTitle>
        {currentRun.summary && (
          <p className="text-sm text-muted-foreground mt-1">
            {currentRun.summary}
          </p>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {steps.length === 0 ? (
          <div className="p-8 text-center">
            <Circle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Analysis Started</h3>
            <p className="text-muted-foreground">
              Waiting for analysis steps to begin...
            </p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4 p-4">
              {steps.map((step, index) => (
                <Card key={step.id} className="border-l-4 border-l-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(step.status)}
                        <div>
                          <h4 className="font-semibold">{step.step_name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              Started: {formatTimestamp(step.started_at)}
                            </span>
                            {step.finished_at && (
                              <span className="text-xs text-muted-foreground">
                                • Finished: {formatTimestamp(step.finished_at)}
                              </span>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(step.status)}
                      </div>
                    </div>
                  </CardHeader>
                  
                  {step.output_blob && (
                    <CardContent className="pt-0">
                      <div className="bg-muted p-3 rounded-md">
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown>
                            {formatOutput(step.output_blob)}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentStepsTimeline;
