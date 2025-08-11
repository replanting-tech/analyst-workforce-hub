import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SidebarProvider } from "@/components/ui/sidebar";
import { CustomerPortalSidebar } from "@/components/CustomerPortalSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DarkModeToggle } from './DarkModeToggle';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { LogOut } from 'lucide-react';

const getSectionTitle = (section: string): string => {
  switch (section) {
    case 'dashboard':
      return 'Dashboard';
    case 'case-management':
      return 'Case Management';
    case 'case-detail':
      return 'Case Details';
    case 'reports':
      return 'Reports';
    case 'settings':
      return 'Settings';
    default:
      return 'Dashboard';
  }
};

const getActiveSection = (pathname: string): string => {
  if (pathname.includes('/cases/')) return 'case-detail';
  if (pathname.includes('/cases')) return 'case-management';
  if (pathname.includes('/reports')) return 'reports';
  if (pathname.includes('/settings')) return 'settings';
  return 'dashboard';
};

interface CustomerPortalLayoutProps {
  children?: React.ReactNode;
}

export function CustomerPortalLayout({ children }: CustomerPortalLayoutProps) {
  const { user, logout } = useCustomerAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get the active section based on the current path
  const activeSection = React.useMemo(() => {
    return getActiveSection(location.pathname);
  }, [location.pathname]);

  const handleSectionChange = (section: string) => {
    switch (section) {
      case 'dashboard':
        navigate('/portal');
        break;
      case 'case-management':
        navigate('/portal/cases');
        break;
      case 'reports':
        navigate('/portal/reports');
        break;
      case 'settings':
        navigate('/portal/settings');
        break;
      default:
        navigate('/portal');
    }
  };

  if (!user) {
    // This shouldn't happen as the ProtectedRoute should handle this
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full">
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <CustomerPortalSidebar 
            user={user} 
            activeSection={activeSection} 
            onSectionChange={handleSectionChange} 
            onLogout={logout} 
          />
          <div className="flex-1 flex flex-col w-full overflow-hidden">
            <header className="bg-white dark:bg-gray-800 shadow-sm w-full">
              <div className="w-full flex items-center justify-between p-4">
                <div className="flex items-center">
                  <SidebarTrigger className="md:hidden mr-4" />
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {getSectionTitle(activeSection)}
                  </h1>
                </div>
                <div className="flex items-center space-x-4">
                  <DarkModeToggle />
                  {/* <div className="relative">
                    <button
                      className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                      onClick={logout}
                    >
                      <span>Logout</span>
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div> */}
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto w-full p-0">
              <div className="w-full h-full">
                {children || <Outlet context={{ user }} />}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
