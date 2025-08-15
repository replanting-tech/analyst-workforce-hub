
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
import { Users, Search, Plus, Edit, CheckCircle, XCircle, Clock, User, UserPlus, Shield } from 'lucide-react';
import { useAnalysts } from '@/hooks/useAnalysts';
import { AddAnalystForm } from '@/components/forms/AddAnalystForm';
import { EditAnalystForm } from '@/components/forms/EditAnalystForm';
import type { Analyst } from '@/hooks/useAnalysts';
import { useAuth } from '@/contexts/AuthContext';

export function AnalystManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddAnalystDialogOpen, setIsAddAnalystDialogOpen] = useState(false);
  const [editingAnalyst, setEditingAnalyst] = useState<Analyst | null>(null);
  
  const { role: userRole, analyst } = useAuth();
  
  const { data: analysts = [], isLoading, refetch } = useAnalysts({
    userRole,
    analystCode: analyst?.code || null
  });

  const filteredAnalysts = analysts.filter(analyst =>
    analyst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    analyst.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    analyst.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableAnalysts = analysts.filter(a => a.availability === 'available').length;
  const busyAnalysts = analysts.filter(a => a.availability === 'busy').length;
  const offlineAnalysts = analysts.filter(a => a.availability === 'offline').length;
  const totalActiveIncidents = analysts.reduce((acc, a) => acc + a.current_active_incidents, 0);

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-orange-100 text-orange-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityIcon = (availability: string) => {
    switch (availability) {
      case 'available': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'busy': return <Clock className="w-4 h-4 text-orange-600" />;
      case 'offline': return <XCircle className="w-4 h-4 text-gray-600" />;
      default: return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRegistrationStatusColor = (isRegistered: boolean | undefined) => {
    return isRegistered ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
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
          <h2 className="text-2xl font-bold text-gray-900">Analyst Management</h2>
          <p className="text-gray-600">Manage analyst accounts and workload distribution</p>
        </div>
        {(userRole === 'L2' || userRole === 'L3') && (
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsAddAnalystDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Analyst
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Analysts</p>
                <p className="text-2xl font-bold text-blue-600">{analysts.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-green-600">{availableAnalysts}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Busy</p>
                <p className="text-2xl font-bold text-orange-600">{busyAnalysts}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Incidents</p>
                <p className="text-2xl font-bold text-red-600">{totalActiveIncidents}</p>
              </div>
              <Shield className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysts Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Analyst Overview</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search analysts..."
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
                  <TableHead>Analyst</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Closed Today</TableHead>
                  <TableHead>Total Today</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnalysts.map((analyst) => (
                  <TableRow key={analyst.code}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{analyst.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {analyst.code}
                      </code>
                    </TableCell>
                    <TableCell>{analyst.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getAvailabilityIcon(analyst.availability)}
                        <Badge className={getAvailabilityColor(analyst.availability)}>
                          {analyst.availability}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${
                        analyst.current_active_incidents > 0 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {analyst.current_active_incidents}
                      </span>
                    </TableCell>
                    <TableCell>{analyst.today_closed_incidents}</TableCell>
                    <TableCell>{analyst.today_total_incidents}</TableCell>
                    <TableCell>
                      <Badge className={getRegistrationStatusColor(analyst.isRegisteredUser)}>
                        {analyst.isRegisteredUser ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingAnalyst(analyst)}
                        >
                          <Edit className="w-4 h-4" />
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

      {/* Add Analyst Dialog */}
      <Dialog open={isAddAnalystDialogOpen} onOpenChange={setIsAddAnalystDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Analyst</DialogTitle>
            <DialogDescription>
              Create a new analyst account in the system.
            </DialogDescription>
          </DialogHeader>
          <AddAnalystForm
            onSuccess={() => {
              setIsAddAnalystDialogOpen(false);
              refetch();
            }}
            onCancel={() => setIsAddAnalystDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Analyst Dialog */}
      <Dialog open={!!editingAnalyst} onOpenChange={() => setEditingAnalyst(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Analyst</DialogTitle>
            <DialogDescription>
              Update the analyst information.
            </DialogDescription>
          </DialogHeader>
          {editingAnalyst && (
            <EditAnalystForm
              analyst={editingAnalyst}
              onSuccess={() => {
                setEditingAnalyst(null);
                refetch();
              }}
              onCancel={() => setEditingAnalyst(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Analyst Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Availability Distribution</CardTitle>
            <CardDescription>Current analyst availability status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Available</span>
                </div>
                <span className="font-medium">{availableAnalysts} analysts</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm">Busy</span>
                </div>
                <span className="font-medium">{busyAnalysts} analysts</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span className="text-sm">Offline</span>
                </div>
                <span className="font-medium">{offlineAnalysts} analysts</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performers Today</CardTitle>
            <CardDescription>Analysts with most resolved incidents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysts
                .sort((a, b) => b.today_closed_incidents - a.today_closed_incidents)
                .slice(0, 5)
                .map((analyst, index) => (
                <div key={analyst.code} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{analyst.name}</p>
                      <p className="text-xs text-gray-500">{analyst.code}</p>
                    </div>
                  </div>
                  <span className="font-medium text-green-600">
                    {analyst.today_closed_incidents} resolved
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
