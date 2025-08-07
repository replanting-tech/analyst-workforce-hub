
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Analyst } from '@/hooks/useAnalysts'; // Import Analyst interface
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useAnalysts } from '@/hooks/useAnalysts';
import { useToast } from '@/components/ui/use-toast'; // Import useToast

export function AnalystManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false); // State for Add User dialog visibility
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false); // State for Reset Password dialog visibility
  const [isResetLinkDialogOpen, setIsResetLinkDialogOpen] = useState(false); // State for Reset Link display dialog
  const [resetPasswordLink, setResetPasswordLink] = useState(''); // State to store the generated reset link
  const [selectedAnalyst, setSelectedAnalyst] = useState<Analyst | null>(null); // State for selected analyst
  
  const { data: analysts = [], isLoading, error, refetch } = useAnalysts();
  const { toast } = useToast(); // Initialize useToast

  const handleAddAsUser = async (analyst: Analyst) => {
    const payload = JSON.stringify({ email: analyst.email, name: analyst.name });
    try {
      const response = await fetch('https://xmozpbewjkeisvpfzeca.supabase.co/functions/v1/register-analyst-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhtb3pwYmV3amtlaXN2cGZ6ZWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMDM3MDMsImV4cCI6MjA2Nzc3OTcwM30.goD6H9fLQPljKpifLlLIU6_Oo4jJO7b2-8GlkeqkiKA`, // SUPABASE_PUBLISHABLE_KEY
        },
        body: payload,
      });

      console.log('Payload:', payload);

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Error registering user for ${analyst.email}:`, errorData.error);
        // Optionally show a toast notification for error
        return;
      }

      const { success, userId } = await response.json();
      if (success) {
        console.log(`User ${analyst.email} registered with ID: ${userId}`);
        toast({
          title: "Analyst Added!",
          description: `${analyst.name} has been successfully added as a user.`,
          variant: "default",
        });
        refetch(); // Refetch analysts to update the UI
      }
    } catch (fetchError) {
      console.error(`Network error registering user for ${analyst.email}:`, fetchError);
      toast({
        title: "Error",
        description: `Failed to add ${analyst.name} as a user. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async (analyst: Analyst) => {
    try {
      const response = await fetch('https://xmozpbewjkeisvpfzeca.supabase.co/functions/v1/reset-user-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhtb3pwYmV3amtlaXN2cGZ6ZWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMDM3MDMsImV4cCI6MjA2Nzc3OTcwM30.goD6H9fLQPljKpifLlLIU6_Oo4jJO7b2-8GlkeqkiKA`, // SUPABASE_PUBLISHABLE_KEY
        },
        body: JSON.stringify({ email: analyst.email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Error generating password reset link for ${analyst.email}:`, errorData.error);
        toast({
          title: "Error",
          description: `Failed to generate reset link for ${analyst.name}. Please try again.`,
          variant: "destructive",
        });
        return;
      }

      const { success, resetLink } = await response.json();
      if (success && resetLink) {
        console.log(`Password reset link generated for ${analyst.email}:`, resetLink);
        setResetPasswordLink(resetLink);
        setIsResetLinkDialogOpen(true); // Open the dialog to show the link
        toast({
          title: "Password Reset Link Generated!",
          description: `A reset link has been generated for ${analyst.name}.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to generate reset link for ${analyst.name}.`,
          variant: "destructive",
        });
      }
    } catch (fetchError) {
      console.error(`Network error generating password reset link for ${analyst.email}:`, fetchError);
      toast({
        title: "Error",
        description: `Network error while generating password reset link for ${analyst.name}.`,
        variant: "destructive",
      });
    }
  };

  const filteredAnalysts = analysts.filter(analyst => {
    const matchesSearch = analyst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         analyst.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         analyst.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || analyst.availability === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalAnalysts = analysts.length;
  const availableAnalysts = analysts.filter(a => a.availability === 'available').length;
  const busyAnalysts = analysts.filter(a => a.availability === 'busy').length;
  const offlineAnalysts = analysts.filter(a => a.availability === 'offline').length;

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-orange-100 text-orange-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center text-red-600">
          <Users className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-medium">Error loading analysts</h3>
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
                <p className="text-2xl font-bold text-blue-600">{totalAnalysts}</p>
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
              <UserCheck className="w-8 h-8 text-green-600" />
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
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Offline</p>
                <p className="text-2xl font-bold text-gray-600">{offlineAnalysts}</p>
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
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
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
                  <TableHead>Active Cases</TableHead>
                  <TableHead>Today Closed</TableHead>
                  <TableHead>Today Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnalysts.map((analyst) => (
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
                          <p className="text-xs text-gray-500">
                            Updated: {analyst.workload_updated_at 
                              ? new Date(analyst.workload_updated_at).toLocaleDateString()
                              : 'N/A'
                            }
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
                      <span className="font-medium">{analyst.current_active_incidents}</span>
                    </TableCell>
                    <TableCell>{analyst.today_closed_incidents}</TableCell>
                    <TableCell>{analyst.today_total_incidents}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                        {!analyst.isRegisteredUser && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAnalyst(analyst);
                              setIsAddUserDialogOpen(true);
                            }}
                          >
                            Add as User
                          </Button>
                        )}
                        {analyst.isRegisteredUser && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAnalyst(analyst);
                              setIsResetPasswordDialogOpen(true);
                            }}
                          >
                            Reset Password
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Confirmation Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Add Analyst as User</DialogTitle>
            <DialogDescription>
              Are you sure you want to add <strong>{selectedAnalyst?.name}</strong> ({selectedAnalyst?.email}) as a new user in Supabase authentication?
              The default password "C0mpn3t!" will be set, and the user will need to use the "Forgot Password" flow to set their initial password.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (selectedAnalyst) {
                handleAddAsUser(selectedAnalyst);
              }
              setIsAddUserDialogOpen(false);
            }}>Confirm Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Confirmation Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Reset Password</DialogTitle>
            <DialogDescription>
              Are you sure you want to send a password reset link to <strong>{selectedAnalyst?.name}</strong> ({selectedAnalyst?.email})?
              An email with the reset link will be sent to their registered email address.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (selectedAnalyst) {
                handleResetPassword(selectedAnalyst);
              }
              setIsResetPasswordDialogOpen(false);
            }}>Send Reset Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Link Display Dialog */}
      <Dialog open={isResetLinkDialogOpen} onOpenChange={setIsResetLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Reset Link</DialogTitle>
            <DialogDescription>
              Copy the following link to reset the password for <strong>{selectedAnalyst?.name}</strong>:
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-gray-100 rounded-md break-all">
            <p className="text-sm font-mono">{resetPasswordLink}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => {
              navigator.clipboard.writeText(resetPasswordLink);
              toast({ title: "Link Copied!", description: "The reset link has been copied to your clipboard." });
              setIsResetLinkDialogOpen(false);
            }}>Copy Link</Button>
            <Button variant="outline" onClick={() => setIsResetLinkDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workload Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Workload Distribution</CardTitle>
            <CardDescription>Current incident assignments per analyst</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAnalysts.map((analyst) => (
                <div key={analyst.code} className="flex items-center justify-between">
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
                        style={{width: `${Math.min((analyst.current_active_incidents / 10) * 100, 100)}%`}}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {analyst.current_active_incidents}/10
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
            <CardDescription>Analyst performance today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAnalysts.slice(0, 5).map((analyst) => (
                <div key={analyst.code} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">{analyst.name}</span>
                    <Badge variant="secondary">
                      {analyst.today_closed_incidents > 0
                        ? Math.round((analyst.today_closed_incidents / analyst.today_total_incidents) * 100)
                        : 0}% Resolution
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Active</p>
                      <p className="font-medium">{analyst.current_active_incidents}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Closed</p>
                      <p className="font-medium">{analyst.today_closed_incidents}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total</p>
                      <p className="font-medium">{analyst.today_total_incidents}</p>
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
