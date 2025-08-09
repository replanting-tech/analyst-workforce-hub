
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Shield, 
  AlertTriangle, 
  FileText, 
  Settings,
  LogOut,
  Home
} from "lucide-react";
import { CustomerDashboard } from '@/components/CustomerDashboard';
import { CustomerPortalReport } from '@/components/CustomerPortalReport';
import { CustomerPortalCaseManagement } from '@/components/CustomerPortalCaseManagement';
import { CustomerPortalSettings } from '@/components/CustomerPortalSettings';

interface CustomerPortalLayoutProps {
  onLogout: () => void;
}

const CustomerPortalLayout = ({ onLogout }: CustomerPortalLayoutProps) => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'report', label: 'Report', icon: BarChart3 },
    { id: 'case-management', label: 'Case Management', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <CustomerDashboard onLogout={onLogout} />;
      case 'report':
        return <CustomerPortalReport />;
      case 'case-management':
        return <CustomerPortalCaseManagement />;
      case 'settings':
        return <CustomerPortalSettings />;
      default:
        return <CustomerDashboard onLogout={onLogout} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">Customer Portal</h1>
        </div>
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  activeSection === item.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Button 
            variant="ghost" 
            onClick={onLogout}
            className="w-full justify-start"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <h2 className="text-2xl font-semibold text-foreground capitalize">
            {activeSection.replace('-', ' ')}
          </h2>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default CustomerPortalLayout;
