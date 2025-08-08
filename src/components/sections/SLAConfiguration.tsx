
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings, Search, Plus, Edit, Clock, Target } from 'lucide-react';
import { useSLAConfig } from '@/hooks/useSLAConfig';
import { AddSLAConfigForm } from '@/components/forms/AddSLAConfigForm';

export function SLAConfiguration() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddSLAConfigDialogOpen, setIsAddSLAConfigDialogOpen] = useState(false);
  
  const { data: slaConfigs = [], isLoading, refetch } = useSLAConfig();

  const filteredSLAConfigs = slaConfigs.filter(config =>
    config.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.workspace_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.priority.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group configs by priority for stats
  const priorityStats = slaConfigs.reduce((acc, config) => {
    acc[config.priority] = (acc[config.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatResolutionTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours === 0) return `${remainingMinutes}m`;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SLA Configuration</h2>
          <p className="text-gray-600">Manage Service Level Agreement settings for customers</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setIsAddSLAConfigDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add SLA Config
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Configs</p>
                <p className="text-2xl font-bold text-blue-600">{slaConfigs.length}</p>
              </div>
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Priority</p>
                <p className="text-2xl font-bold text-red-600">{priorityStats['Critical'] || 0}</p>
              </div>
              <Target className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-orange-600">{priorityStats['High'] || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Resolution</p>
                <p className="text-2xl font-bold text-green-600">
                  {slaConfigs.length > 0
                    ? formatResolutionTime(Math.round(slaConfigs.reduce((acc, c) => acc + c.resolution_minutes, 0) / slaConfigs.length))
                    : '0m'
                  }
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SLA Config Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>SLA Configurations</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search SLA configs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Resolution Time</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSLAConfigs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Target className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{config.customer_name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {config.workspace_name}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(config.priority)}>
                        {config.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{formatResolutionTime(config.resolution_minutes)}</span>
                        <span className="text-sm text-gray-500">({config.resolution_minutes} min)</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(config.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(config.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add SLA Config Dialog */}
      <Dialog open={isAddSLAConfigDialogOpen} onOpenChange={setIsAddSLAConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add SLA Configuration</DialogTitle>
            <DialogDescription>
              Create a new SLA configuration for a customer and priority level.
            </DialogDescription>
          </DialogHeader>
          <AddSLAConfigForm
            onSuccess={() => {
              setIsAddSLAConfigDialogOpen(false);
              refetch();
            }}
            onCancel={() => setIsAddSLAConfigDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Priority Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Distribution</CardTitle>
          <CardDescription>SLA configurations by priority level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(priorityStats).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className={getPriorityColor(priority)}>
                    {priority}
                  </Badge>
                </div>
                <span className="font-medium">{count} configurations</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
