
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Shield, 
  Settings, 
  LogOut,
  X,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerPortalDashboard } from '@/components/CustomerPortalDashboard';
import { CustomerPortalReport } from '@/components/CustomerPortalReport';
import { CustomerPortalCaseManagement } from '@/components/CustomerPortalCaseManagement';
import { CustomerPortalSettings } from '@/components/CustomerPortalSettings';

interface CustomerPortalLayoutProps {
  onLogout: () => void;
}

export function CustomerPortalLayout({ onLogout }: CustomerPortalLayoutProps) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'report', label: 'Report', icon: FileText },
    { id: 'case-management', label: 'Case Management', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <CustomerPortalDashboard />;
      case 'report':
        return <CustomerPortalReport />;
      case 'case-management':
        return <CustomerPortalCaseManagement />;
      case 'settings':
        return <CustomerPortalSettings />;
      default:
        return <CustomerPortalDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-sm border-r transition-all duration-300 ${
        isMobileMenuOpen ? 'w-64' : 'w-0 lg:w-64'
      } overflow-hidden`}>
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Security Operation Center</h2>
              <p className="text-sm text-blue-600 mt-1">PT. Indonesia Maju</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <nav className="p-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeSection === item.id
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 pt-4 border-t">
            <button
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 capitalize">
                {activeSection.replace('-', ' ')}
              </h1>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
