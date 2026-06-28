import * as React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "#/components/ui/sidebar.tsx"
import { Link, useLocation } from "@tanstack/react-router"

// Sidebar navigation data. URLs are ABSOLUTE (leading slash) so they resolve
// from the router root, not relative to the current path.
const data = {
  navMain: [
    {
      title: "Architecture",
      items: [
        { title: "Forms", url: "/forms" },
        { title: "Responses", url: "/responses" },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { pathname } = useLocation()

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
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        pathname === item.url || pathname.startsWith(item.url + "/")
                      }
                    >
                      <Link to={item.url}>{item.title}</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}