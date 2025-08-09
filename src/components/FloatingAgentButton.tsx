
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bot, Zap } from "lucide-react";
import AgentStepsTimeline from './AgentStepsTimeline';

interface FloatingAgentButtonProps {
  incidentId: string;
}

const FloatingAgentButton = ({ incidentId }: FloatingAgentButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

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

      {/* Dialog with AI Agent Timeline */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl h-[80vh] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI Agent Analysis - Incident {incidentId}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-6 pt-0">
            <AgentStepsTimeline incidentId={incidentId} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingAgentButton;
