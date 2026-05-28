"use client";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ModalProvider } from "@/components/providers/modal-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Topbar />

      <main
        className={cn(
          "pt-[var(--spacing-topbar)] pb-6 transition-all duration-300",
          sidebarCollapsed
            ? "lg:pl-[var(--spacing-sidebar-collapsed)]"
            : "lg:pl-[var(--spacing-sidebar)]"
        )}
      >
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>

      <ModalProvider />
    </div>
  );
}
