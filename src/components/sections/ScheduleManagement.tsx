
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Edit, X, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSchedule, useDeleteSchedule, useUpdateSchedule } from '@/hooks/useSchedule';
import { CreateScheduleDialog } from '@/components/CreateScheduleDialog';
import { ImportScheduleDialog } from '@/components/ImportScheduleDialog';
import { useToast } from '@/hooks/use-toast';

export function ScheduleManagement() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { toast } = useToast();
  
  const todayStr = new Date().toISOString().split('T')[0];
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  
  const { data: allSchedules, isLoading, error, refetch } = useSchedule();
  const { data: todaySchedules } = useSchedule(todayStr);
  const deleteSchedule = useDeleteSchedule();
  const updateSchedule = useUpdateSchedule();

  // Calculate statistics
  const scheduleStats = useMemo(() => {
    if (!allSchedules) return { onDutyNow: 0, coverageRate: 0, upcomingShifts: 0 };
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().substring(0, 5);
    
    const onDutyNow = allSchedules.filter(schedule => 
      schedule.shift_date === today && 
      schedule.shift_start <= currentTime && 
      schedule.shift_end >= currentTime &&
      schedule.status === 'scheduled'
    ).length;

    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const upcomingShifts = allSchedules.filter(schedule => {
      const shiftDate = new Date(schedule.shift_date + 'T' + schedule.shift_start);
      return shiftDate >= now && shiftDate <= next24Hours && schedule.status === 'scheduled';
    }).length;

    // Simple coverage calculation - assuming 3 shifts per day should cover 24 hours
    const todayShifts = allSchedules.filter(s => s.shift_date === today).length;
    const coverageRate = Math.min(100, (todayShifts / 3) * 100);

    return { onDutyNow, coverageRate, upcomingShifts };
  }, [allSchedules]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getShiftType = (start: string, end: string) => {
    const startHour = parseInt(start.split(':')[0]);
    if (startHour >= 6 && startHour < 14) return 'Morning';
    if (startHour >= 14 && startHour < 22) return 'Evening';
    return 'Night';
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      await deleteSchedule.mutateAsync(id);
      toast({
        title: "Success",
        description: "Schedule deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete schedule",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'scheduled' | 'completed' | 'cancelled') => {
    try {
      await updateSchedule.mutateAsync({ id, status: newStatus });
      toast({
        title: "Success",
        description: "Schedule status updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update schedule status",
        variant: "destructive",
      });
    }
  };

  // Generate calendar view
  const currentDate = selectedDate;
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Get schedules for calendar view
  const getSchedulesForDate = (day: number) => {
    if (!allSchedules) return [];
    const dateStr = new Date(currentYear, currentMonth, day).toISOString().split('T')[0];
    return allSchedules.filter(schedule => schedule.shift_date === dateStr);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Schedule Management</h2>
          <p className="text-gray-600">Manage analyst schedules and shifts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <ImportScheduleDialog />
          <CreateScheduleDialog />
        </div>
      </div>

      {/* Current Shift Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">On Duty Now</p>
                <p className="text-2xl font-bold text-blue-900">{scheduleStats.onDutyNow}</p>
                <p className="text-xs text-blue-600">Analysts active</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Coverage Rate</p>
                <p className="text-2xl font-bold text-green-900">{scheduleStats.coverageRate.toFixed(0)}%</p>
                <p className="text-xs text-green-600">Daily coverage</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">Upcoming Shifts</p>
                <p className="text-2xl font-bold text-orange-900">{scheduleStats.upcomingShifts}</p>
                <p className="text-xs text-orange-600">Next 24 hours</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Views */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Overview</CardTitle>
          <CardDescription>View and manage analyst schedules</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="today" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Today's Shifts</h3>
                {todaySchedules && todaySchedules.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {todaySchedules.map((schedule) => (
                      <Card key={schedule.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-sm">{schedule.analyst_name}</h4>
                              <p className="text-xs text-gray-500">{schedule.analyst_code}</p>
                            </div>
                            <Badge className={getStatusColor(schedule.status)}>
                              {schedule.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center text-sm">
                              <Clock className="w-4 h-4 mr-2 text-gray-400" />
                              <span>{schedule.shift_start} - {schedule.shift_end}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">
                                {getShiftType(schedule.shift_start, schedule.shift_end)}
                              </Badge>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleStatusChange(schedule.id, 
                                    schedule.status === 'scheduled' ? 'completed' : 'scheduled'
                                  )}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteSchedule(schedule.id)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No schedules for today</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="week" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Weekly Schedule</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 p-2 text-left font-medium">Time</th>
                        <th className="border border-gray-200 p-2 text-left font-medium">Mon</th>
                        <th className="border border-gray-200 p-2 text-left font-medium">Tue</th>
                        <th className="border border-gray-200 p-2 text-left font-medium">Wed</th>
                        <th className="border border-gray-200 p-2 text-left font-medium">Thu</th>
                        <th className="border border-gray-200 p-2 text-left font-medium">Fri</th>
                        <th className="border border-gray-200 p-2 text-left font-medium">Sat</th>
                        <th className="border border-gray-200 p-2 text-left font-medium">Sun</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['08:00-16:00', '16:00-24:00', '00:00-08:00'].map((timeSlot) => (
                        <tr key={timeSlot}>
                          <td className="border border-gray-200 p-2 font-medium text-sm">{timeSlot}</td>
                          {[...Array(7)].map((_, dayIndex) => (
                            <td key={dayIndex} className="border border-gray-200 p-2">
                              <div className="text-xs space-y-1">
                                {/* This would be populated with actual schedule data */}
                                <div className="bg-blue-50 rounded p-1 text-center">
                                  {allSchedules?.find(s => {
                                    const scheduleDate = new Date(s.shift_date);
                                    const dayOfWeek = scheduleDate.getDay();
                                    return dayOfWeek === dayIndex && s.shift_start.startsWith(timeSlot.split('-')[0].substring(0, 2));
                                  })?.analyst_name || '-'}
                                </div>
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="calendar" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedDate(new Date(currentYear, currentMonth - 1, 1))}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedDate(new Date(currentYear, currentMonth + 1, 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-1 border border-gray-200 rounded-lg overflow-hidden">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="bg-gray-50 text-center p-2 font-medium text-sm text-gray-600 border-b border-gray-200">
                      {day}
                    </div>
                  ))}
                  
                  {calendarDays.map((day, index) => (
                    <div key={index} className="min-h-[80px] border-b border-r border-gray-200 p-1 text-sm">
                      {day && (
                        <div>
                          <div className="font-medium mb-1">{day}</div>
                          {getSchedulesForDate(day).slice(0, 2).map((schedule, i) => (
                            <div key={i} className="text-xs bg-blue-100 text-blue-800 rounded px-1 py-0.5 mb-1 truncate">
                              {schedule.analyst_name}
                            </div>
                          ))}
                          {getSchedulesForDate(day).length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{getSchedulesForDate(day).length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Schedule Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Shift Templates</CardTitle>
            <CardDescription>Predefined shift patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 border rounded">
                <div>
                  <p className="font-medium text-sm">Morning Shift</p>
                  <p className="text-xs text-gray-500">08:00 - 16:00</p>
                </div>
                <Button variant="outline" size="sm">Use Template</Button>
              </div>
              <div className="flex justify-between items-center p-3 border rounded">
                <div>
                  <p className="font-medium text-sm">Evening Shift</p>
                  <p className="text-xs text-gray-500">16:00 - 24:00</p>
                </div>
                <Button variant="outline" size="sm">Use Template</Button>
              </div>
              <div className="flex justify-between items-center p-3 border rounded">
                <div>
                  <p className="font-medium text-sm">Night Shift</p>
                  <p className="text-xs text-gray-500">00:00 - 08:00</p>
                </div>
                <Button variant="outline" size="sm">Use Template</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule Statistics</CardTitle>
            <CardDescription>Shift coverage and analyst utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Schedules</span>
                <span className="font-medium">{allSchedules?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Schedules</span>
                <span className="font-medium">{allSchedules?.filter(s => s.status === 'scheduled').length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed Shifts</span>
                <span className="font-medium text-green-600">{allSchedules?.filter(s => s.status === 'completed').length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Cancelled Shifts</span>
                <span className="font-medium text-red-600">{allSchedules?.filter(s => s.status === 'cancelled').length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
