
import React from "react";
import {
  BarChart3,
  FileText,
  AlertTriangle,
  Settings,
  LogOut,
  Shield,
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
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    title: "Dashboard",
    icon: BarChart3,
    section: "dashboard",
  },
  {
    title: "Case Management",
    icon: AlertTriangle,
    section: "case-management",
  },
  {
    title: "Reports",
    icon: FileText,
    section: "reports",
  },
  {
    title: "Settings",
    icon: Settings,
    section: "settings",
  },
];

interface User {
  id: string;
  email: string;
  full_name: string;
  customer_id: string;
  role: string;
}

interface CustomerPortalSidebarProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  onLogout?: () => void;
  user: User;
}

export function CustomerPortalSidebar({
  activeSection = "dashboard",
  onSectionChange,
  onLogout,
  user,
}: CustomerPortalSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleNavigation = (section: string) => {
    onSectionChange?.(section);
  };

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-border p-4">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Customer Portal
              </h2>
              <p className="text-xs text-muted-foreground">
                Security Dashboard
              </p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.section}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.section)}
                    className={`${
                      activeSection === item.section
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600"
                        : "text-foreground hover:bg-muted"
                    } transition-colors cursor-pointer`}
                  >
                    <item.icon
                      className={`${isCollapsed ? "mr-0" : "mr-2"} h-4 w-4`}
                    />
                    {!isCollapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <Button 
          variant="outline" 
          onClick={onLogout}
          className="w-full justify-start"
        >
          <LogOut className={`${isCollapsed ? "mr-0" : "mr-2"} h-4 w-4`} />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
