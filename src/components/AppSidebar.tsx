
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
  const { collapsed } = useSidebar();

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible>
      <SidebarHeader className="border-b border-gray-200 p-4">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Service Manager</h2>
              <p className="text-xs text-gray-500">Provider Portal</p>
            </div>
          </div>
        )}
        {collapsed && (
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
                        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                    } transition-colors`}
                  >
                    <item.icon className={`${collapsed ? 'mr-0' : 'mr-2'} h-4 w-4`} />
                    {!collapsed && <span>{item.title}</span>}
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
