import * as React from "react"

import {
  Sidebar,
  SidebarContent, SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "#/components/ui/sidebar.tsx"
import {Link, useLocation, useNavigate} from "@tanstack/react-router"
import {FileText, LogOut, Plus} from "lucide-react";
import {clearToken} from "#/lib/auth.ts";

// Sidebar navigation data. URLs are ABSOLUTE (leading slash) so they resolve
// from the router root, not relative to the current path.
const data = {
  navMain: [
    {
      title: "Workspace",
      items: [
        { title: "Forms", url: "/forms", icon: FileText },
        { title: "New form", url: "/forms/create", icon: Plus },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearToken()
    navigate({ to: "/auth/sign-in" })
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader />
      <SidebarContent>
        {/* A SidebarGroup per parent. */}
        {data.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {

                  const isActive =
                    item.url === "/forms"
                      ? pathname === "/forms"
                      : pathname === item.url ||
                      pathname.startsWith(item.url + "/")

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link to={item.url}>{item.title}</Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}