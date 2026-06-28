import {SidebarInset, SidebarProvider, SidebarTrigger} from "#/components/ui/sidebar.tsx";
import {AppSidebar} from "#/components/app-sidebar.tsx";
import { Separator } from "./ui/separator";
import AppBreadcrumb from "#/components/app-breadcrumb.tsx";
import {Button} from "#/components/ui/button.tsx";
import {ArrowLeft} from "lucide-react";
import {useRouter} from "@tanstack/react-router";


export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => router.history.back()}
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <AppBreadcrumb />
        </header>
        <div>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
