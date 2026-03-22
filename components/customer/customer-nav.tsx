"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  Package, 
  Ticket, 
  LogOut, 
  LayoutDashboard, 
  User, 
  Mail,
  ChevronRight,
  Building2
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { NotificationsBell } from "@/components/common/notifications-bell"
import { cn } from "@/lib/utils"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/customer/dashboard", icon: LayoutDashboard },
  { title: "Products", href: "/customer/products", icon: Package },
  { title: "Requests", href: "/customer/requests", icon: Mail },
  { title: "Tickets", href: "/customer/tickets", icon: Ticket },
  { title: "Profile", href: "/customer/profile", icon: User },
]

export function CustomerNav({ customer, onLogout }: { customer: any; onLogout: () => void }) {
  const pathname = usePathname()
  
  const isActive = (href: string) => {
    if (href === "/customer/dashboard") return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">H</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">Hazel</span>
          </div>
          <NotificationsBell userType="customer" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {/* Company Info */}
        <div className="mb-4 px-3 py-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {customer?.companyName || customer?.company_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">{customer?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={item.title}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isActive(item.href)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className={cn(
                        "h-4 w-4 shrink-0",
                        isActive(item.href) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )} />
                      <span>{item.title}</span>
                      {isActive(item.href) && (
                        <ChevronRight className="ml-auto h-4 w-4 text-primary" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{customer?.fullName || customer?.full_name}</p>
            <p className="text-xs text-muted-foreground capitalize">{customer?.role?.replace("_", " ")}</p>
          </div>
        </div>
        <Button 
          onClick={onLogout} 
          variant="ghost" 
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
