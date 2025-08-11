
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
}

interface CustomerPortalLayoutProps {
  user: CustomerPortalUser;
  onLogout: () => void;
}

export default function CustomerPortalLayout({ user, onLogout }: CustomerPortalLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Building2 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Customer Portal</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {user.full_name || user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="flex items-center gap-2">
              <User className="w-3 h-3" />
              {user.role || 'Customer'}
            </Badge>
            <Button variant="ghost" onClick={onLogout} className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="cases" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Case Management
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <CustomerPortalDashboard user={user} />
          </TabsContent>

          <TabsContent value="cases">
            <CustomerPortalCaseManagement user={user} />
          </TabsContent>

          <TabsContent value="reports">
            <CustomerPortalReport user={user} />
          </TabsContent>

          <TabsContent value="settings">
            <CustomerPortalSettings user={user} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
