
import React from 'react';
import {
  BarChart3,
  Users,
  AlertTriangle,
  Calendar,
  Settings,
  Building2,
  FileText,
  Target,
  Activity
} from 'lucide-react';
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
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard",
    icon: BarChart3,
    section: "overview"
  },
  {
    title: "Incidents",
    icon: AlertTriangle,
    section: "incidents"
  },
  {
    title: "Analysts",
    icon: Users,
    section: "analysts"
  },
  {
    title: "Schedule",
    icon: Calendar,
    section: "schedule"
  },
  {
    title: "Customers",
    icon: Building2,
    section: "customers"
  },
  {
    title: "Request Changes",
    icon: FileText,
    section: "requests"
  },
  {
    title: "SLA Configuration",
    icon: Target,
    section: "sla"
  },
  {
    title: "Workload",
    icon: Activity,
    section: "workload"
  }
];

interface AppSidebarProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

export function AppSidebar({ activeSection = "overview", onSectionChange }: AppSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-border p-4">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Incident Response</h2>
              <p className="text-xs text-muted-foreground">Management Platform</p>
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
                <SidebarMenuItem key={item.section}>
                  <SidebarMenuButton 
                    onClick={() => onSectionChange?.(item.section)}
                    className={`${
                      activeSection === item.section 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600' 
                        : 'text-foreground hover:bg-muted'
                    } transition-colors`}
                  >
                    <item.icon className={`${isCollapsed ? 'mr-0' : 'mr-2'} h-4 w-4`} />
                    {!isCollapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
