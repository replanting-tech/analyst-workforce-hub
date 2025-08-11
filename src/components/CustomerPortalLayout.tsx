
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, FileText, Settings, BarChart3, LogOut, User } from 'lucide-react';
import {CustomerPortalDashboard} from './CustomerPortalDashboard';
import {CustomerPortalCaseManagement} from './CustomerPortalCaseManagement';
import {CustomerPortalReport} from './CustomerPortalReport';
import {CustomerPortalSettings} from './CustomerPortalSettings';

interface CustomerPortalUser {
  id: string;
  email: string;
  full_name?: string;
  customer_id?: string;
  role?: string;
  is_active?: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

interface CustomerPortalLayoutProps {
  user: CustomerPortalUser;
  onLogout: () => void;
}

export function CustomerPortalLayout({ user, onLogout }: CustomerPortalLayoutProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/customer-portal');
  };

  // Create a user object with required full_name for components that need it
  const userWithFullName = {
    ...user,
    full_name: user.full_name || user.email.split('@')[0] || 'User'
  };

  return (
    <div className="min-h-screen bg-background">
      <Card className="rounded-none border-0 border-b">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarFallback>
                  <User className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{userWithFullName.full_name}</CardTitle>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="container mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="cases" className="flex items-center space-x-2">
              <Building2 className="w-4 h-4" />
              <span>Case Management</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Reports</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <CustomerPortalDashboard user={userWithFullName} />
          </TabsContent>

          <TabsContent value="cases" className="mt-6">
            <CustomerPortalCaseManagement user={userWithFullName} />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <CustomerPortalReport />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <CustomerPortalSettings user={userWithFullName} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default CustomerPortalLayout;
