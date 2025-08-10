
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, LogOut, Settings, FileText, AlertTriangle, Home } from 'lucide-react';
import { CustomerPortalDashboard } from './CustomerPortalDashboard';
import { CustomerPortalReport } from './CustomerPortalReport';
import { CustomerPortalSettings } from './CustomerPortalSettings';
import { CustomerPortalCaseManagement } from './CustomerPortalCaseManagement';

interface User {
  id: string;
  email: string;
  full_name: string;
  customer_id: string;
}

interface CustomerPortalLayoutProps {
  user: User;
  onLogout: () => void;
}

export default function CustomerPortalLayout({ user, onLogout }: CustomerPortalLayoutProps) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Customer Portal</h1>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {user.full_name}
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="cases" className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
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

          <TabsContent value="dashboard">
            <CustomerPortalDashboard user={user} />
          </TabsContent>

          <TabsContent value="cases">
            <CustomerPortalCaseManagement user={user} />
          </TabsContent>

          <TabsContent value="reports">
            <CustomerPortalReport customerId={user.customer_id} />
          </TabsContent>

          <TabsContent value="settings">
            <CustomerPortalSettings customerId={user.customer_id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
