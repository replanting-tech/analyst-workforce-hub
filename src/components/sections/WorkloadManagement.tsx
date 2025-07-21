
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { Activity, TrendingUp, Users, BarChart3, Calendar, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function WorkloadManagement() {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [selectedAnalyst, setSelectedAnalyst] = useState('all');

  // Mock data - akan diganti dengan data dari Supabase
  const workloadData = [
    {
      analyst_id: '1',
      analyst_name: 'John Doe',
      analyst_code: 'ANALYST001',
      analyst_email: 'john.doe@company.com',
      availability: 'available',
      current_active_incidents: 3,
      today_closed_incidents: 2,
      today_total_incidents: 5,
      workload_percentage: 60,
      avg_resolution_time: 145, // minutes
      sla_compliance: 96.5
    },
    {
      analyst_id: '2',
      analyst_name: 'Jane Smith',
      analyst_code: 'ANALYST002',
      analyst_email: 'jane.smith@company.com',
      availability: 'busy',
      current_active_incidents: 5,
      today_closed_incidents: 3,
      today_total_incidents: 8,
      workload_percentage: 90,
      avg_resolution_time: 120,
      sla_compliance: 98.2
    },
    {
      analyst_id: '3',
      analyst_name: 'Mike Johnson',
      analyst_code: 'ANALYST003',
      analyst_email: 'mike.johnson@company.com',
      availability: 'available',
      current_active_incidents: 1,
      today_closed_incidents: 4,
      today_total_incidents: 5,
      workload_percentage: 30,
      avg_resolution_time: 95,
      sla_compliance: 94.8
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

  const getWorkloadColor = (percentage: number) => {
    if (percentage >= 85) return 'bg-red-500';
    if (percentage >= 70) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Calculate totals
  const totalActiveIncidents = workloadData.reduce((sum, analyst) => sum + analyst.current_active_incidents, 0);
  const totalClosedToday = workloadData.reduce((sum, analyst) => sum + analyst.today_closed_incidents, 0);
  const avgSLACompliance = workloadData.reduce((sum, analyst) => sum + analyst.sla_compliance, 0) / workloadData.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workload Management</h2>
          <p className="text-gray-600">Monitor analyst workload distribution and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Incidents</p>
                <p className="text-2xl font-bold text-orange-600">{totalActiveIncidents}</p>
              </div>
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved Today</p>
                <p className="text-2xl font-bold text-green-600">{totalClosedToday}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Analysts</p>
                <p className="text-2xl font-bold text-blue-600">{workloadData.filter(a => a.availability !== 'offline').length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg SLA Compliance</p>
                <p className="text-2xl font-bold text-green-600">{avgSLACompliance.toFixed(1)}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Analyst Workload Overview</CardTitle>
            <Select value={selectedAnalyst} onValueChange={setSelectedAnalyst}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter analyst" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Analysts</SelectItem>
                {workloadData.map(analyst => (
                  <SelectItem key={analyst.analyst_id} value={analyst.analyst_id}>
                    {analyst.analyst_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="current">Current Load</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="mt-6">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Analyst</TableHead>
                      <TableHead>Availability</TableHead>
                      <TableHead>Active Cases</TableHead>
                      <TableHead>Resolved Today</TableHead>
                      <TableHead>Workload</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workloadData
                      .filter(analyst => selectedAnalyst === 'all' || analyst.analyst_id === selectedAnalyst)
                      .map((analyst) => (
                      <TableRow key={analyst.analyst_id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src="" />
                              <AvatarFallback className="text-xs">
                                {getInitials(analyst.analyst_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{analyst.analyst_name}</p>
                              <p className="text-xs text-gray-500">{analyst.analyst_code}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getAvailabilityColor(analyst.availability)}>
                            {analyst.availability}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${
                            analyst.current_active_incidents > 0 ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {analyst.current_active_incidents}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">
                            {analyst.today_closed_incidents}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="w-full space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{analyst.workload_percentage}%</span>
                              <span className="text-gray-500">{analyst.current_active_incidents}/10</span>
                            </div>
                            <Progress 
                              value={analyst.workload_percentage} 
                              className="h-2"
                              style={{
                                background: `linear-gradient(to right, ${getWorkloadColor(analyst.workload_percentage)} ${analyst.workload_percentage}%, #e5e7eb ${analyst.workload_percentage}%)`
                              }}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">Assign Case</Button>
                            <Button variant="ghost" size="sm">View Details</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {workloadData.map((analyst) => (
                  <Card key={analyst.analyst_id}>
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>
                            {getInitials(analyst.analyst_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{analyst.analyst_name}</CardTitle>
                          <CardDescription>{analyst.analyst_code}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded">
                          <p className="text-2xl font-bold text-blue-600">{analyst.today_total_incidents}</p>
                          <p className="text-xs text-blue-600">Total Cases</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded">
                          <p className="text-2xl font-bold text-green-600">{analyst.sla_compliance.toFixed(1)}%</p>
                          <p className="text-xs text-green-600">SLA Compliance</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded">
                          <p className="text-2xl font-bold text-orange-600">{formatTime(analyst.avg_resolution_time)}</p>
                          <p className="text-xs text-orange-600">Avg Resolution</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded">
                          <p className="text-2xl font-bold text-purple-600">{analyst.workload_percentage}%</p>
                          <p className="text-xs text-purple-600">Current Load</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="trends" className="mt-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Workload Distribution Trends</CardTitle>
                    <CardDescription>Weekly workload distribution across analysts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {workloadData.map((analyst) => (
                        <div key={analyst.analyst_id} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {getInitials(analyst.analyst_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{analyst.analyst_name}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <p className="text-sm font-medium">{analyst.today_total_incidents * 7}</p>
                              <p className="text-xs text-gray-500">Weekly Cases</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium text-green-600">
                                {(Math.random() * 10 + 90).toFixed(1)}%
                              </p>
                              <p className="text-xs text-gray-500">Efficiency</p>
                            </div>
                            <div className="text-center">
                              <p className={`text-sm font-medium ${Math.random() > 0.5 ? 'text-green-600' : 'text-red-600'}`}>
                                {Math.random() > 0.5 ? '↗' : '↘'} {(Math.random() * 20).toFixed(1)}%
                              </p>
                              <p className="text-xs text-gray-500">Trend</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Peak Hours Analysis</CardTitle>
                      <CardDescription>Incident volume by hour of day</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {['00-06', '06-12', '12-18', '18-24'].map((timeRange, index) => (
                          <div key={timeRange} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{timeRange}:00</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{width: `${[60, 85, 90, 45][index]}%`}}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 w-8">
                                {[12, 17, 18, 9][index]}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Team Capacity</CardTitle>
                      <CardDescription>Current vs optimal capacity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Current Capacity</span>
                          <span className="font-medium">75%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{width: '75%'}}></div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Optimal Range</span>
                          <span className="font-medium text-green-600">60-80%</span>
                        </div>
                        
                        <div className="p-3 bg-green-50 rounded">
                          <p className="text-sm text-green-800">
                            <strong>Status:</strong> Operating within optimal range. 
                            Current workload distribution is balanced.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
