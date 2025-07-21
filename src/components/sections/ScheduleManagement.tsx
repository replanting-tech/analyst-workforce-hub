
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Plus, Edit, CheckCircle, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ScheduleManagement() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Mock data - akan diganti dengan data dari Supabase
  const schedules = [
    {
      id: '1',
      analyst_name: 'John Doe',
      analyst_code: 'ANALYST001',
      shift_date: '2024-01-15',
      shift_start: '09:00',
      shift_end: '17:00',
      timezone: 'UTC',
      status: 'scheduled'
    },
    {
      id: '2',
      analyst_name: 'Jane Smith',
      analyst_code: 'ANALYST002',
      shift_date: '2024-01-15',
      shift_start: '17:00',
      shift_end: '01:00',
      timezone: 'UTC',
      status: 'scheduled'
    },
    {
      id: '3',
      analyst_name: 'Mike Johnson',
      analyst_code: 'ANALYST003',
      shift_date: '2024-01-15',
      shift_start: '01:00',
      shift_end: '09:00',
      timezone: 'UTC',
      status: 'completed'
    }
  ];

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

  // Calendar view data
  const currentDate = new Date();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Schedule Management</h2>
          <p className="text-gray-600">Manage analyst schedules and shifts</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Schedule
        </Button>
      </div>

      {/* Current Shift Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">On Duty Now</p>
                <p className="text-2xl font-bold text-blue-900">3</p>
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
                <p className="text-2xl font-bold text-green-900">98%</p>
                <p className="text-xs text-green-600">24/7 coverage</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">Upcoming Shifts</p>
                <p className="text-2xl font-bold text-orange-900">12</p>
                <p className="text-xs text-orange-600">Next 24 hours</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600" />
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {schedules.map((schedule) => (
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
                              <Button variant="ghost" size="sm">
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="week" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Weekly Schedule</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Time</th>
                        <th className="text-left p-2 font-medium">Mon</th>
                        <th className="text-left p-2 font-medium">Tue</th>
                        <th className="text-left p-2 font-medium">Wed</th>
                        <th className="text-left p-2 font-medium">Thu</th>
                        <th className="text-left p-2 font-medium">Fri</th>
                        <th className="text-left p-2 font-medium">Sat</th>
                        <th className="text-left p-2 font-medium">Sun</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['00:00-08:00', '08:00-16:00', '16:00-24:00'].map((timeSlot, index) => (
                        <tr key={timeSlot} className="border-b">
                          <td className="p-2 font-medium text-sm">{timeSlot}</td>
                          {[...Array(7)].map((_, dayIndex) => (
                            <td key={dayIndex} className="p-2">
                              <div className="text-xs bg-blue-50 rounded p-1 text-center">
                                {index === 0 ? 'Mike J.' : index === 1 ? 'John D.' : 'Jane S.'}
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
                    <Button variant="outline" size="sm">Previous</Button>
                    <Button variant="outline" size="sm">Next</Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center p-2 font-medium text-sm text-gray-600">
                      {day}
                    </div>
                  ))}
                  
                  {calendarDays.map((day, index) => (
                    <div key={index} className="aspect-square border rounded p-1 text-sm">
                      {day && (
                        <div>
                          <div className="text-center mb-1">{day}</div>
                          {Math.random() > 0.7 && (
                            <div className="w-full h-1 bg-blue-500 rounded"></div>
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

      {/* Shift Templates */}
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
                  <p className="text-xs text-gray-500">09:00 - 17:00</p>
                </div>
                <Button variant="outline" size="sm">Use Template</Button>
              </div>
              <div className="flex justify-between items-center p-3 border rounded">
                <div>
                  <p className="font-medium text-sm">Evening Shift</p>
                  <p className="text-xs text-gray-500">17:00 - 01:00</p>
                </div>
                <Button variant="outline" size="sm">Use Template</Button>
              </div>
              <div className="flex justify-between items-center p-3 border rounded">
                <div>
                  <p className="font-medium text-sm">Night Shift</p>
                  <p className="text-xs text-gray-500">01:00 - 09:00</p>
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
                <span className="text-sm text-gray-600">Coverage This Week</span>
                <span className="font-medium">168/168 hours (100%)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Shifts per Analyst</span>
                <span className="font-medium">21 hours/week</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Overtime Hours</span>
                <span className="font-medium text-orange-600">8 hours</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Schedule Conflicts</span>
                <span className="font-medium text-red-600">2 conflicts</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
