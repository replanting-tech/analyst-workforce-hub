
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bot, Zap } from "lucide-react";
import AgentInvestigationPanel from './AgentInvestigationPanel';

interface Step {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  summary?: string;
  details?: string;
  toolCalls?: { name: string; request: any; response: any }[];
}

interface Message {
  role: 'agent' | 'analyst';
  content: string;
}

interface FloatingAgentButtonProps {
  incidentId: string;
}

const FloatingAgentButton = ({ incidentId }: FloatingAgentButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Mock handlers for demo purposes
  const handleRunAgent = () => {
    console.log('Running AI agent for incident:', incidentId);
    
    // Mock streaming steps
    const mockSteps: Step[] = [
      {
        id: '1',
        name: 'Reading',
        status: 'running',
        summary: 'Analyzing incident logs and details...'
      }
    ];
    
    setSteps(mockSteps);
    setMessages([
      { role: 'agent', content: 'Starting investigation for this incident. Let me analyze the logs and gather information.' }
    ]);

    // Simulate step progression
    setTimeout(() => {
      setSteps(prev => [
        { ...prev[0], status: 'completed', details: '# Reading Analysis\n\nSuccessfully read and parsed the incident logs. Found anomalous network activity patterns.' },
        {
          id: '2',
          name: 'Grounding',
          status: 'running',
          summary: 'Correlating with threat intelligence...'
        }
      ]);
    }, 2000);
  };

  const handleApproveStep = (stepId: string) => {
    console.log('Approving step:', stepId);
  };

  const handleRerunStep = (stepId: string) => {
    console.log('Re-running step:', stepId);
  };

  const handleAskAnalyst = (stepId: string) => {
    console.log('Asking analyst about step:', stepId);
  };

  const handleCreateTicket = () => {
    console.log('Creating Jira ticket for incident:', incidentId);
  };

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        size="icon"
      >
        <div className="relative">
          <Bot className="w-6 h-6" />
          <Zap className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300" />
        </div>
      </Button>

      {/* Dialog with AI Agent Panel */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-7xl h-[80vh] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI Agent Investigation - Incident {incidentId}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <AgentInvestigationPanel
              incidentId={incidentId}
              steps={steps}
              messages={messages}
              onRunAgent={handleRunAgent}
              onApproveStep={handleApproveStep}
              onRerunStep={handleRerunStep}
              onAskAnalyst={handleAskAnalyst}
              onCreateTicket={handleCreateTicket}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingAgentButton;
