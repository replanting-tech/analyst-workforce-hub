
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Circle,
  Bot,
  User,
  Send,
  ChevronDown,
  ChevronRight,
  PlayCircle,
  RotateCcw,
  MessageCircle,
  FileText
} from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface Step {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  summary?: string;
  details?: string; // markdown
  toolCalls?: { name: string; request: any; response: any }[];
}

interface Message {
  role: 'agent' | 'analyst';
  content: string;
}

interface AgentInvestigationPanelProps {
  incidentId: string;
  steps: Step[];
  messages: Message[];
  onRunAgent: () => void;
  onApproveStep: (stepId: string) => void;
  onRerunStep: (stepId: string) => void;
  onAskAnalyst: (stepId: string) => void;
  onCreateTicket: () => void;
}

const AgentInvestigationPanel = ({
  incidentId,
  steps,
  messages,
  onRunAgent,
  onApproveStep,
  onRerunStep,
  onAskAnalyst,
  onCreateTicket
}: AgentInvestigationPanelProps) => {
  const [messageInput, setMessageInput] = useState('');
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [expandedToolCalls, setExpandedToolCalls] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const getStatusIcon = (status: Step['status']) => {
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

  const getStatusBadge = (status: Step['status']) => {
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

  const toggleStepExpansion = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const toggleToolCallExpansion = (toolCallId: string) => {
    setExpandedToolCalls(prev => {
      const newSet = new Set(prev);
      if (newSet.has(toolCallId)) {
        newSet.delete(toolCallId);
      } else {
        newSet.add(toolCallId);
      }
      return newSet;
    });
  };

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // This would typically be handled by parent component
      setMessageInput('');
    }
  };

  const isAgentTyping = steps.some(step => step.status === 'running');
  const hasCompletedSteps = steps.some(step => step.status === 'completed');
  const hasProposingStep = steps.some(step => step.name === 'Proposing' && step.status === 'completed');

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 p-4">
      {/* Chat Panel */}
      <div className="flex-1 lg:w-1/2 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              AI Agent Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${message.role === 'analyst' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="flex-shrink-0">
                      {message.role === 'agent' ? (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Bot className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <User className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === 'agent'
                          ? 'bg-muted text-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      <ReactMarkdown className="prose prose-sm max-w-none">
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
                
                {isAgentTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-muted px-4 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-input rounded-md bg-background"
                />
                <Button onClick={handleSendMessage} size="sm">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Step Timeline */}
      <div className="flex-1 lg:w-1/2 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Investigation Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            {steps.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Ready to Investigate</h3>
                  <p className="text-muted-foreground mb-4">
                    Click the button below to start the AI investigation process
                  </p>
                  <Button onClick={onRunAgent} className="flex items-center gap-2">
                    <PlayCircle className="w-4 h-4" />
                    Run AI Investigator
                  </Button>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <Card key={step.id} className="border-l-4 border-l-primary/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(step.status)}
                            <div>
                              <h4 className="font-semibold">{step.name}</h4>
                              {step.summary && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {step.summary}
                                </p>
                              )}
                            </div>
                            {getStatusBadge(step.status)}
                          </div>
                          
                          {(step.details || step.toolCalls) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleStepExpansion(step.id)}
                            >
                              {expandedSteps.has(step.id) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                        
                        {step.status === 'completed' && (
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline" onClick={() => onApproveStep(step.id)}>
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => onRerunStep(step.id)}>
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Re-run
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => onAskAnalyst(step.id)}>
                              Ask Analyst
                            </Button>
                          </div>
                        )}
                      </CardHeader>
                      
                      {expandedSteps.has(step.id) && (
                        <CardContent className="pt-0">
                          {step.details && (
                            <div className="mb-4">
                              <h5 className="font-semibold mb-2">Details</h5>
                              <div className="prose prose-sm max-w-none bg-muted p-3 rounded-md">
                                <ReactMarkdown>{step.details}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                          
                          {step.toolCalls && step.toolCalls.length > 0 && (
                            <div>
                              <h5 className="font-semibold mb-2">Tool Calls</h5>
                              <div className="space-y-2">
                                {step.toolCalls.map((toolCall, toolIndex) => {
                                  const toolCallId = `${step.id}-tool-${toolIndex}`;
                                  return (
                                    <Collapsible key={toolIndex}>
                                      <CollapsibleTrigger 
                                        className="flex items-center gap-2 w-full p-2 text-left bg-muted/50 rounded-md hover:bg-muted"
                                        onClick={() => toggleToolCallExpansion(toolCallId)}
                                      >
                                        {expandedToolCalls.has(toolCallId) ? (
                                          <ChevronDown className="w-3 h-3" />
                                        ) : (
                                          <ChevronRight className="w-3 h-3" />
                                        )}
                                        <span className="font-medium">{toolCall.name}</span>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent className="mt-2 ml-5">
                                        <div className="space-y-2">
                                          <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                              Request
                                            </p>
                                            <pre className="text-xs bg-background p-2 rounded border overflow-x-auto">
                                              {JSON.stringify(toolCall.request, null, 2)}
                                            </pre>
                                          </div>
                                          <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                              Response
                                            </p>
                                            <pre className="text-xs bg-background p-2 rounded border overflow-x-auto">
                                              {JSON.stringify(toolCall.response, null, 2)}
                                            </pre>
                                          </div>
                                        </div>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
            
            {hasCompletedSteps && (
              <div className="p-4 border-t">
                <Button 
                  onClick={onCreateTicket}
                  disabled={!hasProposingStep}
                  className="w-full flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Create Jira Ticket
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentInvestigationPanel;
