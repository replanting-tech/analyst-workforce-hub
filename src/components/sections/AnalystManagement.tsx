
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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Users, Search, Plus, Edit, UserCheck, UserX, Activity } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AnalystManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data - akan diganti dengan data dari Supabase
  const analysts = [
    {
      id: '1',
      code: 'ANALYST001',
      name: 'John Doe',
      email: 'john.doe@company.com',
      availability: 'available',
      status: 'active',
      activeIncidents: 3,
      totalIncidents: 15,
      created_at: '2024-01-10T00:00:00Z'
    },
    {
      id: '2',
      code: 'ANALYST002',
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      availability: 'busy',
      status: 'active',
      activeIncidents: 5,
      totalIncidents: 28,
      created_at: '2024-01-08T00:00:00Z'
    },
    {
      id: '3',
      code: 'ANALYST003',
      name: 'Mike Johnson',
      email: 'mike.johnson@company.com',
      availability: 'offline',
      status: 'inactive',
      activeIncidents: 0,
      totalIncidents: 42,
      created_at: '2024-01-05T00:00:00Z'
    }
  ];

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-orange-100 text-orange-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analyst Management</h2>
          <p className="text-gray-600">Manage security analysts and their assignments</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Analyst
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Analysts</p>
                <p className="text-2xl font-bold text-blue-600">8</p>
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
                <p className="text-2xl font-bold text-green-600">5</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Busy</p>
                <p className="text-2xl font-bold text-orange-600">2</p>
              </div>
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Offline</p>
                <p className="text-2xl font-bold text-gray-600">1</p>
              </div>
              <UserX className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysts Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Analysts Overview</CardTitle>
            <div className="flex gap-4 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search analysts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
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
                  <TableHead>Status</TableHead>
                  <TableHead>Active Cases</TableHead>
                  <TableHead>Total Cases</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysts.map((analyst) => (
                  <TableRow key={analyst.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src="" />
                          <AvatarFallback className="text-xs">
                            {getInitials(analyst.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{analyst.name}</p>
                          <p className="text-xs text-gray-500">
                            Joined {new Date(analyst.created_at).toLocaleDateString()}
                          </p>
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
                      <Badge className={getAvailabilityColor(analyst.availability)}>
                        {analyst.availability}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(analyst.status)}>
                        {analyst.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{analyst.activeIncidents}</span>
                    </TableCell>
                    <TableCell>{analyst.totalIncidents}</TableCell>
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

      {/* Workload Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Workload Distribution</CardTitle>
            <CardDescription>Current incident assignments per analyst</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysts.filter(a => a.status === 'active').map((analyst) => (
                <div key={analyst.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {getInitials(analyst.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{analyst.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{width: `${(analyst.activeIncidents / 10) * 100}%`}}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {analyst.activeIncidents}/10
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Analyst performance over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysts.filter(a => a.status === 'active').map((analyst) => (
                <div key={analyst.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">{analyst.name}</span>
                    <Badge variant="secondary">
                      {Math.floor(Math.random() * 20 + 80)}% SLA
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Resolved</p>
                      <p className="font-medium">{Math.floor(Math.random() * 10 + 5)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Avg Time</p>
                      <p className="font-medium">{Math.floor(Math.random() * 60 + 30)}min</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Rating</p>
                      <p className="font-medium">{(Math.random() * 1 + 4).toFixed(1)}⭐</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
