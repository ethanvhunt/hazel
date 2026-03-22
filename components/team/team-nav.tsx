"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Ticket, 
  LogOut, 
  LayoutDashboard, 
  User, 
  Activity, 
  Mail, 
  TrendingUp, 
  Package,
  FolderTree,
  ChevronRight
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
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"

const NotificationsBell = dynamic(
  () => import("@/components/common/notifications-bell").then((mod) => ({ default: mod.NotificationsBell })),
  { ssr: false },
)

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  roles?: string[]
}

const mainNavItems: NavItem[] = [
  { title: "Dashboard", href: "/team/dashboard", icon: LayoutDashboard },
  { title: "Customers", href: "/team/customers", icon: Users },
  { title: "Tickets", href: "/team/tickets", icon: Ticket },
]

const catalogNavItems: NavItem[] = [
  { title: "Products", href: "/team/products", icon: Package, roles: ["super_admin", "admin", "manager"] },
  { title: "Categories", href: "/team/products/categories", icon: FolderTree, roles: ["super_admin", "admin", "manager"] },
  { title: "Requests", href: "/team/product-requests", icon: Mail, roles: ["super_admin", "admin", "manager"] },
]

const adminNavItems: NavItem[] = [
  { title: "Team Members", href: "/team/users", icon: Users, roles: ["super_admin", "admin", "manager"] },
  { title: "Activity Logs", href: "/team/activity-logs", icon: Activity, roles: ["super_admin", "admin", "manager"] },
  { title: "Reports", href: "/team/reports", icon: TrendingUp, roles: ["super_admin"] },
]

export function TeamNav({ user, onLogout }: { user: any; onLogout: () => void }) {
  const pathname = usePathname()
  
  const isActive = (href: string) => {
    if (href === "/team/dashboard") return pathname === href
    return pathname.startsWith(href)
  }
  
  const filterByRole = (items: NavItem[]) => {
    return items.filter(item => !item.roles || item.roles.includes(user?.role))
  }

  const filteredCatalogItems = filterByRole(catalogNavItems)
  const filteredAdminItems = filterByRole(adminNavItems)

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
          <NotificationsBell userType="team" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
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

        {/* Catalog Navigation */}
        {filteredCatalogItems.length > 0 && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Catalog
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredCatalogItems.map((item) => (
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
        )}

        {/* Admin Navigation */}
        {filteredAdminItems.length > 0 && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAdminItems.map((item) => (
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
        )}

        {/* Profile Link */}
        <SidebarGroup className="mt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  tooltip="Profile"
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive("/team/profile")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Link href="/team/profile">
                    <User className={cn(
                      "h-4 w-4 shrink-0",
                      isActive("/team/profile") ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    <span>Profile</span>
                    {isActive("/team/profile") && (
                      <ChevronRight className="ml-auto h-4 w-4 text-primary" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.fullName || user?.full_name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace("_", " ")}</p>
          </div>
        </div>
        <Button 
          onClick={onLogout} 
          variant="ghost" 
          className="mt-3 w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
