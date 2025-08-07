import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Activity } from 'lucide-react';
import { useActivityLogs } from '@/hooks/useActivityLogs';

interface ActivityLogsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  analystEmail?: string;
  analystName?: string;
  shiftDate?: string;
  shiftTime?: string;
}

export function ActivityLogsDialog({ 
  isOpen, 
  onClose, 
  analystEmail, 
  analystName, 
  shiftDate, 
  shiftTime 
}: ActivityLogsDialogProps) {
  const { data: activityLogs, isLoading, error } = useActivityLogs(analystEmail, shiftDate);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activity Logs
          </DialogTitle>
          <DialogDescription>
            {analystName && (
              <div className="flex items-center gap-2 mt-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{analystName}</span>
                {shiftDate && shiftTime && (
                  <>
                    <span className="text-gray-400">•</span>
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>{shiftDate} at {shiftTime}</span>
                  </>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500">Loading activity logs...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-500">Error loading activity logs</p>
            </div>
          )}

          {!isLoading && !error && activityLogs && activityLogs.length > 0 ? (
            <div className="space-y-3">
              {activityLogs.map((log) => (
                <Card key={log.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {formatTime(log.created_at)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700">{log.info}</p>
                      {log.analyst_email && (
                        <p className="text-xs text-gray-500">
                          Logged by: {log.analyst_email}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !isLoading && !error && (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No activity logs found for this shift</p>
              <p className="text-xs text-gray-400 mt-1">
                Activity logs will appear here when the analyst performs actions during their shift
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 