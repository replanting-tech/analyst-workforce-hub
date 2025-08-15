
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
import { Activity, TrendingUp, Users, BarChart3, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAnalysts } from '@/hooks/useAnalysts';
import { useAuth } from '@/contexts/AuthContext';

export function WorkloadManagement() {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [selectedAnalyst, setSelectedAnalyst] = useState('all');
  
  const { role: userRole, analyst } = useAuth();
  
  const { data: analysts = [], isLoading, error, refetch } = useAnalysts({
    userRole,
    analystCode: analyst?.code || null
  });
  
  // If L1 user, auto-select their analyst code
  React.useEffect(() => {
    if (userRole === 'L1' && analyst?.code) {
      setSelectedAnalyst(analyst.code);
    } else {
      setSelectedAnalyst('all');
    }
  }, [userRole, analyst?.code]);

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

  const calculateWorkloadPercentage = (activeIncidents: number, maxCapacity: number = 10) => {
    return Math.min((activeIncidents / maxCapacity) * 100, 100);
  };

  const calculateResolutionRate = (closed: number, total: number) => {
    return total > 0 ? Math.round((closed / total) * 100) : 0;
  };

  // Calculate totals
  const totalActiveIncidents = analysts.reduce((sum, analyst) => sum + analyst.current_active_incidents, 0);
  const totalClosedToday = analysts.reduce((sum, analyst) => sum + analyst.today_closed_incidents, 0);
  const totalAnalysts = analysts.length;
  const activeAnalysts = analysts.filter(a => a.availability !== 'offline').length;
  const avgResolutionRate = analysts.length > 0 
    ? analysts.reduce((sum, analyst) => sum + calculateResolutionRate(analyst.today_closed_incidents, analyst.today_total_incidents), 0) / analysts.length
    : 0;

  const filteredAnalysts = analysts.filter(analyst => 
    selectedAnalyst === 'all' || analyst.code === selectedAnalyst
  );

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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center text-red-600">
          <Activity className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-medium">Error loading workload data</h3>
          <p className="text-sm">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

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
          <Button variant="outline" size="sm" onClick={() => refetch()}>
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
                <p className="text-2xl font-bold text-blue-600">{activeAnalysts}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Resolution Rate</p>
                <p className="text-2xl font-bold text-green-600">{avgResolutionRate.toFixed(1)}%</p>
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
                {analysts.map(analyst => (
                  <SelectItem key={analyst.code} value={analyst.code}>
                    {analyst.name}
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
                    {filteredAnalysts.map((analyst) => {
                      const workloadPercentage = calculateWorkloadPercentage(analyst.current_active_incidents);
                      return (
                        <TableRow key={analyst.code}>
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
                                <p className="text-xs text-gray-500">{analyst.code}</p>
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
                                <span>{workloadPercentage.toFixed(0)}%</span>
                                <span className="text-gray-500">{analyst.current_active_incidents}/10</span>
                              </div>
                              <Progress value={workloadPercentage} className="h-2" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">Assign Case</Button>
                              <Button variant="ghost" size="sm">View Details</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredAnalysts.map((analyst) => {
                  const resolutionRate = calculateResolutionRate(analyst.today_closed_incidents, analyst.today_total_incidents);
                  const workloadPercentage = calculateWorkloadPercentage(analyst.current_active_incidents);
                  
                  return (
                    <Card key={analyst.code}>
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>
                              {getInitials(analyst.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{analyst.name}</CardTitle>
                            <CardDescription>{analyst.code}</CardDescription>
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
                            <p className="text-2xl font-bold text-green-600">{resolutionRate}%</p>
                            <p className="text-xs text-green-600">Resolution Rate</p>
                          </div>
                          <div className="text-center p-3 bg-orange-50 rounded">
                            <p className="text-2xl font-bold text-orange-600">{analyst.current_active_incidents}</p>
                            <p className="text-xs text-orange-600">Active Cases</p>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded">
                            <p className="text-2xl font-bold text-purple-600">{workloadPercentage.toFixed(0)}%</p>
                            <p className="text-xs text-purple-600">Current Load</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="trends" className="mt-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Workload Distribution Trends</CardTitle>
                    <CardDescription>Current workload distribution across analysts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {filteredAnalysts.map((analyst) => {
                        const efficiency = calculateResolutionRate(analyst.today_closed_incidents, analyst.today_total_incidents);
                        return (
                          <div key={analyst.code} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {getInitials(analyst.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm">{analyst.name}</span>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-center">
                                <p className="text-sm font-medium">{analyst.today_total_incidents}</p>
                                <p className="text-xs text-gray-500">Today's Cases</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-green-600">
                                  {efficiency}%
                                </p>
                                <p className="text-xs text-gray-500">Resolution Rate</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-blue-600">
                                  {analyst.current_active_incidents}
                                </p>
                                <p className="text-xs text-gray-500">Active</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
