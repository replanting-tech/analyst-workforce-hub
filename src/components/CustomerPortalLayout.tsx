
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Shield, 
  FileText, 
  Settings,
  LogOut,
  Home,
  User
} from "lucide-react";
import { CustomerDashboard } from '@/components/CustomerDashboard';
import { CustomerPortalReport } from '@/components/CustomerPortalReport';
import { CustomerPortalCaseManagement } from '@/components/CustomerPortalCaseManagement';
import { CustomerPortalSettings } from '@/components/CustomerPortalSettings';

interface CustomerUser {
  id: string;
  email: string;
  full_name: string;
  customer_id: string;
  role: string;
}

interface CustomerPortalLayoutProps {
  user: CustomerUser;
  onLogout: () => void;
}

const CustomerPortalLayout = ({ user, onLogout }: CustomerPortalLayoutProps) => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'case-management', label: 'Case Management', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <CustomerDashboard user={user} />;
      case 'reports':
        return <CustomerPortalReport customerId={user.customer_id} />;
      case 'case-management':
        return <CustomerPortalCaseManagement customerId={user.customer_id} />;
      case 'settings':
        return <CustomerPortalSettings user={user} />;
      default:
        return <CustomerDashboard user={user} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">Customer Portal</h1>
          <div className="flex items-center space-x-2 mt-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{user.full_name}</span>
          </div>
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
