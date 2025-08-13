import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, User, Building2, AlertTriangle, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import RichTextEditor from '@/components/RichTextEditor';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';

interface RequestChange {
  id: string;
  incident_number: string;
  jira_ticket_id: string;
  analyst_id: string;
  analyst_name: string;
  assets: string;
  status: string;
  created_at: string;
  updated_at: string;
  indicators: {
    id: string;
    type: string;
    value: string;
    description: string;
    status: string;
    created_at: string;
  }[];
}

export default function CustomerPortalIncidentDetail() {
  const { incidentId } = useParams<{ incidentId: string }>();
  const { user } = useCustomerAuth();

  const { data: incident, isLoading } = useQuery({
    queryKey: ['customer-incident', incidentId],
    queryFn: async () => {
      if (!user?.customer_id) return null;
      
      const { data, error } = await supabase
        .from('v_incident_sla_details')
        .select('*')
        .eq('incident_id', incidentId)
        .eq('customer_id', user.customer_id)
        .single();

      if (error) {
        console.error('Error fetching incident:', error);
        throw error;
      }

      return data;
    },
    enabled: !!incidentId && !!user?.customer_id,
  });

  const { data: requestChanges } = useQuery({
    queryKey: ['customer-request-changes', incidentId],
    queryFn: async () => {
      if (!incidentId) return [];
      
      const { data, error } = await supabase
        .from('v_request_changes_indicators')
        .select('*')
        .eq('incident_id', incidentId);

      if (error) {
        console.error('Error fetching request changes:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!incidentId,
  });

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!incident) {
    return <div className="p-6">Incident not found</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">{incident.incident_number}</CardTitle>
              <p className="text-muted-foreground">
                Created {formatDistanceToNow(new Date(incident.creation_time), { addSuffix: true })}
              </p>
            </div>
            <Badge variant="secondary">{incident.priority}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Jira Ticket:</span>
                {incident.jira_ticket_id ? (
                  <a
                    href={`https://your-jira-instance.com/browse/${incident.jira_ticket_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {incident.jira_ticket_id}
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                ) : (
                  <span>N/A</span>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Reported:</span>
                <span>{new Date(incident.creation_time).toLocaleDateString()}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Analyst:</span>
                <span>{incident.analyst_name || 'Unassigned'}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>Customer:</span>
                <span>{incident.customer_name}</span>
              </div>
            </div>
          </div>
          <Separator />
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Status:</span>
              <span>{incident.status}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Incident Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RichTextEditor incident={incident} isCustomerPortal={true} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Request Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requestChanges && requestChanges.length > 0 ? (
            <div className="space-y-4">
              {requestChanges.map((change: RequestChange) => (
                <div key={change.id} className="border rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Request Change ID: {change.id}</h3>
                    <Badge variant="outline">{change.status}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <strong>Type:</strong> {change.indicators[0]?.type || 'N/A'}
                    </div>
                    <div>
                      <strong>Value:</strong> {change.indicators[0]?.value || 'N/A'}
                    </div>
                    <div>
                      <strong>Description:</strong> {change.indicators[0]?.description || 'N/A'}
                    </div>
                    <div>
                      <strong>Created At:</strong> {new Date(change.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No request changes found for this incident.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
