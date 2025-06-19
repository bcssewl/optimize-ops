import { AppSidebar } from "@/src/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/src/components/ui/sidebar";

export default function ProtectedPageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider className="relative">
      <div className="flex flex-row xl:flex-row relative flex-1 w-full">
        <AppSidebar />
        <main className="flex flex-1 w-full relative">
          <div className="absolute top-0 left-0 p-2">
            <SidebarTrigger />
          </div>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
