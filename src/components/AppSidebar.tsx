
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
const menuItems = [
  {
    title: "Dashboard",
    icon: BarChart3,
    section: "overview",
    path: "/",
  },
  {
    title: "Case Management",
    icon: FileText,
    section: "case-management",
    subItems: [
      {
        title: "Incidents",
        icon: AlertTriangle,
        section: "incidents",
        path: "/incidents",
      },
      {
        title: "Request Changes",
        icon: FileText,
        section: "requests",
        path: "/requests",
      },
    ],
  },
  {
    title: "Analysts",
    icon: Users,
    section: "analysts",
    path: "/analysts",
  },
  {
    title: "Schedule",
    icon: Calendar,
    section: "schedule",
    path: "/schedule",
  },
  {
    title: "Customers",
    icon: Building2,
    section: "customers",
    path: "/customers",
  },
  {
    title: "SLA Configuration",
    icon: Target,
    section: "sla",
    path: "/sla",
  },
  {
    title: "Workload",
    icon: Activity,
    section: "workload",
    path: "/workload",
  },
  {
    title: "Reports",
    icon: Activity,
    section: "reports",
    path: "/reports",
  },
];

interface AppSidebarProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

export function AppSidebar({
  activeSection = "overview",
  onSectionChange,
}: AppSidebarProps) {
  const { state } = useSidebar();
  const navigate = useNavigate();
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
              {menuItems.map((item) => (
                <React.Fragment key={item.section}>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item)}
                      className={`${
                        activeSection === item.section || 
                        (item.subItems && item.subItems.some(subItem => subItem.section === activeSection))
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
                          {item.subItems && (
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
                      {item.subItems.map((subItem) => (
                        <SidebarMenuItem key={subItem.section}>
                          <SidebarMenuButton
                            onClick={() => handleNavigation(subItem)}
                            className={`${
                              activeSection === subItem.section
                                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600"
                                : "text-foreground hover:bg-muted"
                            } transition-colors cursor-pointer w-full text-left pl-4`}
                          >
                            <subItem.icon className="h-4 w-4 mr-2" />
                            {!isCollapsed && <span>{subItem.title}</span>}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-4">
        <Button 
          variant="outline" 
          // onClick={onLogout}
          className="w-full justify-start"
        >
          <LogOut className={`${isCollapsed ? "mr-0" : "mr-2"} h-4 w-4`} />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
