
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIncidentById } from '@/hooks/useIncidents';
import { 
  ArrowLeft, 
  AlertTriangle, 
  Clock, 
  User, 
  Building2, 
  ExternalLink, 
  Calendar, 
  Target, 
  FileText, 
  AlertCircle,
  Settings,
  MoreHorizontal,
  Share,
  ThumbsUp,
  Link as LinkIcon,
  Edit,
  MessageSquare
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from '@/components/RichTextEditor';

const IncidentDetailPage = () => {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const { data: incident, isLoading, error } = useIncidentById(incidentId || '');
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState('comments');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse space-y-4 max-w-7xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <AlertTriangle className="mx-auto h-12 w-12 mb-4 text-red-600" />
          <h3 className="text-lg font-medium">Error loading incident details</h3>
          <p className="text-sm text-gray-600">Incident not found or failed to load</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Very High': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Informational': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSLAStatusColor = (slaStatus: string, remainingSeconds: number) => {
    if (slaStatus === 'breach') return 'bg-red-100 text-red-800';
    if (remainingSeconds <= 900 && remainingSeconds > 0) return 'bg-orange-100 text-orange-800';
    if (slaStatus === 'met') return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTimeOnly = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>JSM-456</span>
                <span>•</span>
                <span>{incident.incident_number}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <ThumbsUp className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Share className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Issue Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h1 className="text-2xl font-semibold text-gray-900 mb-4">
                Is it possible to get a new monitor?
              </h1>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{incident.analyst_name || 'Jane Rotason'}</span>
                  <span>raised this request via</span>
                  <span className="text-blue-600 font-medium">Portal</span>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600 p-0 h-auto">
                  Hide details
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">What do you need help with?</h4>
                  <p className="text-gray-700">
                    I would like second monitor as part of my work setup. It will help me run multiple programs at 
                    the same time. 27" or larger would be great.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Location</h4>
                  <p className="text-gray-700">Sydney, Australia</p>
                </div>
              </div>
            </div>

            {/* Forms Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Forms</h3>
                <Button variant="outline" size="sm">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Onboarding form</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-800">SUBMITTED</Badge>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Reason Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reason</h3>
              <p className="text-gray-700">No stock on premise, will need to place a batch order.</p>
            </div>

            {/* Activity Section */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Activity</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Show:</span>
                      <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="h-8">
                          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                          <TabsTrigger value="comments" className="text-xs">Comments</TabsTrigger>
                          <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
                          <TabsTrigger value="worklog" className="text-xs">Worklog</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                    <Select defaultValue="newest">
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest first</SelectItem>
                        <SelectItem value="oldest">Oldest first</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-6">
                {/* Add Comment */}
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    FP
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <Button variant="outline" size="sm">
                        Add internal note
                      </Button>
                      <span className="text-gray-400">/</span>
                      <Button variant="outline" size="sm">
                        Reply to customer
                      </Button>
                    </div>
                    <RichTextEditor
                      value={comment}
                      onChange={setComment}
                      placeholder="Add a comment..."
                    />
                  </div>
                </div>

                {/* Comments */}
                <div className="space-y-4">
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      FP
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900">Fran Perez</span>
                        <span className="text-sm text-gray-500">1 hour ago</span>
                        <Badge variant="outline" className="text-xs">Internal note</Badge>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-gray-700">Ticket can be resolved once order for new monitor is placed.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      FP
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900">Fran Perez</span>
                        <span className="text-sm text-gray-500">Feb 2, 2022, 3:33 PM</span>
                        <span className="text-sm text-gray-500">Edited</span>
                      </div>
                      <div className="space-y-3">
                        <p className="text-gray-700">Hey Jane,</p>
                        <p className="text-gray-700">Just wanted to let you know that we got your request.</p>
                        <p className="text-gray-700">
                          Is your staff details up to date? That is the address we will use to send out your new monitor.
                        </p>
                        <p className="text-gray-700">Thanks.</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Button variant="ghost" size="sm" className="p-0 h-auto text-blue-600">
                            Edit
                          </Button>
                          <span>•</span>
                          <Button variant="ghost" size="sm" className="p-0 h-auto text-blue-600">
                            Delete
                          </Button>
                          <span>•</span>
                          <Button variant="ghost" size="sm" className="p-0 h-auto">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Status and Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <Select defaultValue="waiting">
                  <SelectTrigger className="w-full bg-blue-600 text-white border-blue-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waiting">Waiting for customer</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" className="ml-2">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* SLAs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">SLAs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-sm">Time to first response</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{incident.sla_remaining_formatted}</div>
                    <div className="text-xs text-gray-500">within 4h</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm">Time to resolution</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">2h 18m</div>
                    <div className="text-xs text-gray-500">within 8h</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Assignee</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                        FP
                      </div>
                      <span className="text-sm">Fran Perez</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Reporter</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs">
                        JR
                      </div>
                      <span className="text-sm">Jane Rotason</span>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Request type</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">📧 Emailed request</span>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Priority</span>
                    <Badge className={getPriorityColor(incident.priority)}>
                      {incident.priority}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Knowledge base</span>
                    <span className="text-sm">📚 3 articles</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Automation</span>
                    <span className="text-sm">⚡ Rule executions</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <Button variant="ghost" className="w-full justify-start p-0 h-auto text-blue-600">
                    More fields
                    <span className="ml-2 text-gray-400">Request participants, Labels, reminders, pr...</span>
                  </Button>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Created {formatDateOnly(incident.creation_time)} {formatTimeOnly(incident.creation_time)}</span>
                    <Button variant="ghost" size="sm" className="p-0 h-auto">
                      <Settings className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Updated 1 hours ago
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetailPage;
