
import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, AlertTriangle } from "lucide-react";
import { useStatusTransitions, updateIncidentStatusWithValidation } from "@/hooks/useStatusWorkflow";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

interface StatusWorkflowDropdownProps {
  currentStatus: string;
  incidentId: string;
  onStatusChange?: (newStatus: string) => void;
}

export function StatusWorkflowDropdown({
  currentStatus,
  incidentId,
  onStatusChange
}: StatusWorkflowDropdownProps) {
  const { data: transitions, isLoading } = useStatusTransitions(currentStatus);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const { mutate: updateStatus } = updateIncidentStatusWithValidation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'incident': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'incident_closed': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'false_positive_closed': return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'open': return 'Open';
      case 'incident': return 'Incident';
      case 'incident_closed': return 'Incident-Closed';
      case 'false_positive_closed': return 'False-Positive Closed';
      default: return status;
    }
  };

  const handleStatusChange = async (newStatus: string, transitionName: string, requiresApproval: boolean) => {
    // Check if transitioning from 'incident' to 'incident_closed' without approved customer notification
    if (currentStatus === 'incident' && newStatus === 'incident_closed') {
      const { data: incident } = await supabase
        .from('incidents')
        .select('customer_notification')
        .eq('incident_id', incidentId)
        .single();

      if (incident?.customer_notification !== 'approved') {
        toast({
          title: "Action Required",
          description: "Customer notification must be approved before closing the incident.",
          variant: "destructive",
        });
        return;
      }
    }

    if (requiresApproval) {
      const confirmed = window.confirm(
        `This transition "${transitionName}" requires approval. Are you sure you want to proceed?`
      );
      if (!confirmed) return;
    }

    setIsUpdating(true);
    try {
      await updateStatus({
        incidentId,
        newStatus,
        jiraTicketId: transitionName, // Using transitionName as jiraTicketId since that's what the interface expects
        changedBy: 'System User'
      });

      toast({
        title: "Status Updated",
        description: `Incident status changed to ${getStatusDisplayName(newStatus)}`,
      });

      if (onStatusChange) {
        onStatusChange(newStatus);
      }
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident', incidentId] });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update incident status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`flex items-center gap-2 ${getStatusColor(currentStatus)}`}
          disabled={isLoading || isUpdating}
        >
          {getStatusDisplayName(currentStatus)}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {transitions?.map((transition) => (
          <DropdownMenuItem
            key={transition.to_status}
            onClick={() => handleStatusChange(
              transition.to_status, 
              transition.transition_name,
              transition.requires_approval
            )}
            className="flex items-center justify-between"
          >
            <span>{transition.transition_name}</span>
            <div className="flex items-center gap-2">
              {transition.requires_approval && (
                <AlertTriangle className="h-3 w-3 text-orange-600" />
              )}
              <Badge className={getStatusColor(transition.to_status)}>
                {getStatusDisplayName(transition.to_status)}
              </Badge>
            </div>
          </DropdownMenuItem>
        ))}
        {(!transitions || transitions.length === 0) && (
          <DropdownMenuItem disabled>
            No status transitions available
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}