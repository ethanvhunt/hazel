"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, Ticket, LogOut, BarChart3, User, Activity, Mail, TrendingUp, Package } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import dynamic from "next/dynamic"

const NotificationsBell = dynamic(
  () => import("@/components/common/notifications-bell").then((mod) => ({ default: mod.NotificationsBell })),
  { ssr: false },
)

export function TeamNav({ user, onLogout }: { user: any; onLogout: () => void }) {
  return (
    <Sidebar className="border-r">
      <SidebarHeader>
        <div className="flex justify-between items-center gap-4">
          <h1 className="text-lg font-bold">Hazelnutcyborg CRM</h1>
          <NotificationsBell userType="team" />
        </div>
        <div className="text-sm">
          <p className="text-muted-foreground">Logged in as</p>
          <p className="font-semibold truncate">{user?.fullName || user?.full_name}</p>
          <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace("_", " ")}</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Dashboard">
              <Link href="/team/dashboard">
                <BarChart3 />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Customers">
              <Link href="/team/customers">
                <Users />
                <span>Customers</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Tickets">
              <Link href="/team/tickets">
                <Ticket />
                <span>Tickets</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {["super_admin", "admin", "manager"].includes(user?.role) && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Products">
                <Link href="/team/products">
                  <Package />
                  <span>Products</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {["super_admin", "admin", "manager"].includes(user?.role) && (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Product Requests">
                  <Link href="/team/product-requests">
                    <Mail />
                    <span>Product Requests</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Team Members">
                  <Link href="/team/users">
                    <Users />
                    <span>Team Members</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Activity Logs">
                  <Link href="/team/activity-logs">
                    <Activity />
                    <span>Activity Logs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}

          {user?.role === "super_admin" && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Detailed Reports">
                <Link href="/team/reports">
                  <TrendingUp />
                  <span>Reports</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Profile">
              <Link href="/team/profile">
                <User />
                <span>Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <Button onClick={onLogout} variant="outline" className="w-full bg-transparent">
          <LogOut className="mr-2" size={20} />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
