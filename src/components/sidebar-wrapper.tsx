"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't show sidebar on sign-in page
  // Show sidebar if we're not on sign-in page (even during loading)
  const shouldShowSidebar = !pathname.startsWith("/sign-in");

  if (!shouldShowSidebar) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <div className="flex min-h-screen flex-col">
          <header className="flex h-14 shrink-0 items-center gap-4 border-b px-4">
            <SidebarTrigger />
          </header>
          <div className="flex-1">{children}</div>
        </div>
      </main>
    </SidebarProvider>
  );
}
