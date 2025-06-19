import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/src/components/ui/sidebar";
import {
  faBuilding,
  faBullseye,
  faMicrophone,
  faTableColumns,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" className="relative">
      <SidebarContent className="bg-background">
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard">
                    <FontAwesomeIcon
                      icon={faTableColumns}
                      size="lg"
                      className="mr-2 text-primary font-bold"
                    />
                    <span className="group-data-[collapsible=icon]/sidebar:hidden">
                      Dashboard
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/departments">
                    <FontAwesomeIcon
                      icon={faBuilding}
                      size="lg"
                      className="mr-2 text-primary"
                    />
                    <span className="group-data-[collapsible=icon]/sidebar:hidden">
                      Departments
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/users">
                    <FontAwesomeIcon
                      icon={faUsers}
                      size="lg"
                      className="mr-2 text-primary"
                    />
                    <span className="group-data-[collapsible=icon]/sidebar:hidden">
                      Users
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/targets">
                    <FontAwesomeIcon
                      icon={faBullseye}
                      size="lg"
                      className="mr-2 text-primary"
                    />
                    <span className="group-data-[collapsible=icon]/sidebar:hidden">
                      Targets
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/upload-record">
                    <FontAwesomeIcon
                      icon={faMicrophone}
                      size="lg"
                      className="mr-2 text-primary"
                    />
                    <span className="group-data-[collapsible=icon]/sidebar:hidden">
                      Upload Record
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
