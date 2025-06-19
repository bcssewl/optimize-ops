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
  faFileUpload,
  faKey,
  faPhone,
  faTableColumns,
  faUserEdit,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" className="relative">
      <SidebarContent className="bg-background">
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
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
                  <Link href="/calls">
                    <FontAwesomeIcon
                      icon={faPhone}
                      size="lg"
                      className="mr-2 text-primary"
                    />
                    <span className="group-data-[collapsible=icon]/sidebar:hidden">
                      Calls
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/upload-transcript">
                    <FontAwesomeIcon
                      icon={faFileUpload}
                      size="lg"
                      className="mr-2 text-primary"
                    />
                    <span className="group-data-[collapsible=icon]/sidebar:hidden">
                      Upload Transcript
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarGroupLabel className="mt-4">
                Organization
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/organization">
                        <FontAwesomeIcon
                          icon={faBuilding}
                          size="lg"
                          className="mr-2 text-primary"
                        />
                        <span className="group-data-[collapsible=icon]/sidebar:hidden">
                          Overview
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/organization/teams">
                        <FontAwesomeIcon
                          icon={faUsers}
                          size="lg"
                          className="mr-2 text-primary"
                        />
                        <span className="group-data-[collapsible=icon]/sidebar:hidden">
                          Teams
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
              <SidebarGroupLabel className="mt-4">
                Account Settings
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/account/update-profile">
                        <FontAwesomeIcon
                          icon={faUserEdit}
                          size="lg"
                          className="mr-2 text-primary"
                        />
                        <span className="group-data-[collapsible=icon]/sidebar:hidden">
                          Update Profile
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/account/change-password">
                        <FontAwesomeIcon
                          icon={faKey}
                          size="lg"
                          className="mr-2 text-primary"
                        />
                        <span className="group-data-[collapsible=icon]/sidebar:hidden">
                          Change Password
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
