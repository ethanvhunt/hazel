"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Package, Ticket, LogOut, Home, User, Mail } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { NotificationsBell } from "@/components/common/notifications-bell"

export function CustomerNav({ customer, onLogout }: { customer: any; onLogout: () => void }) {
  return (
    <Sidebar className="border-r">
      <SidebarHeader>
        <div className="flex justify-between items-center gap-4">
          <h1 className="text-lg font-bold">Hazelnutcyborg CRM</h1>
          <NotificationsBell userType="customer" />
        </div>
        <div className="text-sm">
          <p className="text-muted-foreground">Company</p>
          <p className="font-semibold truncate">{customer?.companyName || customer?.company_name}</p>
          <p className="text-xs text-muted-foreground">{customer?.email}</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Dashboard">
              <Link href="/customer/dashboard">
                <Home />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Products">
              <Link href="/customer/products">
                <Package />
                <span>Products</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Requests">
              <Link href="/customer/requests">
                <Mail />
                <span>Requests</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Tickets">
              <Link href="/customer/tickets">
                <Ticket />
                <span>Tickets</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Profile">
              <Link href="/customer/profile">
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
