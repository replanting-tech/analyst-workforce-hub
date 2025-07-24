import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MainDashboard } from "@/components/MainDashboard";
import { ReportPage } from "@/components/sections/ReportPage";

const Report = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* <AppSidebar /> */}
        <main className="flex-1 w-full">
          <ReportPage />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Report;
