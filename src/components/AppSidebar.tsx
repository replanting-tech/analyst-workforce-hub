import React from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Users,
  AlertTriangle,
  Calendar,
  Settings,
  Building2,
  FileText,
  Target,
  Activity,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";

type MenuItem = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  section: string;
  path?: string;
  subItems?: MenuItem[];
  roles?: ('L1' | 'L2' | 'L3')[]; // Roles that can access this menu item
};
const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    icon: BarChart3,
    section: "overview",
    path: "/",
    roles: ['L1', 'L2', 'L3'], // All roles can access Dashboard
  },
  {
    title: "Case Management",
    icon: FileText,
    section: "case-management",
    roles: ['L1', 'L2', 'L3'], // All roles can access Case Management
    subItems: [
      {
        title: "Incidents",
        icon: AlertTriangle,
        section: "incidents",
        path: "/incidents",
        roles: ['L1', 'L2', 'L3'],
      },
      {
        title: "Request Changes",
        icon: FileText,
        section: "requests",
        path: "/requests",
        roles: ['L1', 'L2', 'L3'],
      },
    ],
  },
  {
    title: "Analysts",
    icon: Users,
    section: "analysts",
    path: "/analysts",
    roles: ['L2', 'L3'], // Only L2 and L3 can access Analysts
  },
  {
    title: "Schedule",
    icon: Calendar,
    section: "schedule",
    path: "/schedule",
    roles: ['L2', 'L3'], // Only L2 and L3 can access Schedule
  },
  {
    title: "Customers",
    icon: Building2,
    section: "customers",
    path: "/customers",
    roles: ['L3'], // Only L3 can access Customers
  },
  {
    title: "SLA Configuration",
    icon: Target,
    section: "sla",
    path: "/sla",
    roles: ['L3'], // Only L3 can access SLA Configuration
  },
  {
    title: "Workload",
    icon: Activity,
    section: "workload",
    path: "/workload",
    roles: ['L2', 'L3'], // Only L2 and L3 can access Workload
  },
  {
    title: "Reports",
    icon: Activity,
    section: "reports",
    path: "/reports",
    roles: ['L2', 'L3'], // Only L2 and L3 can access Reports
  },
];

interface AppSidebarProps {
  onLogout?: () => void;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

// Helper function to check if a menu item should be shown based on user role
const shouldShowMenuItem = (item: MenuItem, userRole: string | null) => {
  // If no roles are specified, show the item to everyone
  if (!item.roles) return true;
  // If user has no role, don't show the item
  if (!userRole) return false;
  // Check if user's role is in the allowed roles for this item
  return item.roles.includes(userRole as 'L1' | 'L2' | 'L3');
};

export const AppSidebar: React.FC<AppSidebarProps> = ({ activeSection, onSectionChange, onLogout }) => {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const { role: userRole } = useAuth();
  const isCollapsed = state === "collapsed";

  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({});

  const handleNavigation = (item: typeof menuItems[0]) => {
    if (item.path) {
      navigate(item.path);
      onSectionChange?.(item.section);
    } else if (item.subItems) {
      // Toggle expanded state for menu items with submenus
      setExpandedSections(prev => ({
        ...prev,
        [item.section]: !prev[item.section]
      }));
    }
  };

  // Auto-expand menu if a sub-item is active
  React.useEffect(() => {
    const activeMenu = menuItems.find(item => 
      item.subItems?.some(subItem => subItem.section === activeSection)
    );
    
    if (activeMenu) {
      setExpandedSections(prev => ({
        ...prev,
        [activeMenu.section]: true
      }));
    }
  }, [activeSection]);

  // Suppress the specific React Fragment warning
  React.useEffect(() => {
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      // Filter out the specific data-lov-id warning
      if (args[0] && typeof args[0] === 'string' && args[0].includes('Invalid prop `data-lov-id` supplied to `React.Fragment`')) {
        return;
      }
      originalConsoleWarn.apply(console, args);
    };

    return () => {
      console.warn = originalConsoleWarn;
    };
  }, []);

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-border p-4">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Cyber Command
              </h2>
              <p className="text-xs text-muted-foreground">
                Management Platform
              </p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems
                .filter(item => shouldShowMenuItem(item, userRole))
                .map((item) => (
                  <div key={item.section}>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => handleNavigation(item)}
                        className={`${
                          activeSection === item.section || 
                          (item.subItems && item.subItems.some(
                            subItem => subItem.section === activeSection && 
                            shouldShowMenuItem(subItem, userRole)
                          ))
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600"
                            : "text-foreground hover:bg-muted"
                        } transition-colors cursor-pointer w-full text-left`}
                      >
                        <item.icon
                          className={`${isCollapsed ? "mr-0" : "mr-2"} h-4 w-4`}
                        />
                        {!isCollapsed && (
                          <div className="flex items-center justify-between w-full">
                            <span>{item.title}</span>
                            {item.subItems && item.subItems.some(subItem => shouldShowMenuItem(subItem, userRole)) && (
                              <span className="text-xs opacity-50">
                                {expandedSections[item.section] ? '▼' : '▶'}
                              </span>
                            )}
                          </div>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    {item.subItems && !isCollapsed && expandedSections[item.section] && (
                      <div className="pl-6">
                        {item.subItems
                          .filter(subItem => shouldShowMenuItem(subItem, userRole))
                          .map((subItem) => (
                            <SidebarMenuItem key={subItem.section}>
                              <SidebarMenuButton
                                onClick={() => {
                                  if (subItem.path) {
                                    navigate(subItem.path);
                                    onSectionChange?.(subItem.section);
                                  }
                                }}
                                className={`${
                                  activeSection === subItem.section
                                    ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                                    : "text-foreground hover:bg-muted"
                                } transition-colors cursor-pointer w-full text-left`}
                              >
                                <subItem.icon className="h-4 w-4 mr-2" />
                                {!isCollapsed && <span>{subItem.title}</span>}
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-4">
        {/* <Button 
          variant="outline" 
          onClick={onLogout}
          className="w-full justify-start"
        >
          <LogOut className={`${isCollapsed ? "mr-0" : "mr-2"} h-4 w-4`} />
          {!isCollapsed && <span>Logout</span>}
        </Button> */}
      </SidebarFooter>
    </Sidebar>
  );
}