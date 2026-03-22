"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TeamNav } from "@/components/team/team-nav"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default function CreateUserPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    role: "agent",
  })

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
        })

        if (!response.ok) {
          router.push("/team/login")
          return
        }

        const data = await response.json()

        if (!data.session || data.type !== "team") {
          router.push("/team/login")
          return
        }

        // Check permissions - only managers, admins and super admins can create users
        if (!["manager", "admin", "super_admin"].includes(data.session.role)) {
          toast.error("You don't have permission to create users")
          router.push("/team/dashboard")
          return
        }

        setUser(data.session)
      } catch (error) {
        console.error("[v0] Session error:", error)
        router.push("/team/login")
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [router])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    router.push("/team/login")
  }

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error("Full name is required")
      return false
    }
    if (!formData.email.trim()) {
      toast.error("Email is required")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Invalid email format")
      return false
    }
    if (formData.mobile && !/^[6-9]\d{9}$/.test(formData.mobile)) {
      toast.error("Invalid Indian mobile number (10 digits starting with 6-9)")
      return false
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match")
      return false
    }
    if (user.role === "manager" && formData.role !== "agent") {
      toast.error("Managers can only create agents")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/user-management/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          mobile: formData.mobile ? `+91${formData.mobile}` : null,
          password: formData.password,
          role: formData.role,
        }),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.message || "Failed to create user")
        return
      }

      toast.success("User created successfully")
      router.push("/team/users")
    } catch (error) {
      console.error("[v0] Error creating user:", error)
      toast.error("An error occurred while creating user")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!user) return null

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <TeamNav user={user} onLogout={handleLogout} />
        <SidebarInset>
          <main className="flex-1 overflow-auto">
            <div className="p-8 max-w-2xl">
              <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" asChild>
                  <Link href="/team/users">
                    <ArrowLeft size={20} />
                  </Link>
                </Button>
                <h1 className="text-3xl font-bold">Create New User</h1>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>User Information</CardTitle>
                  <CardDescription>Add a new team member to the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mobile">Mobile Number (India)</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                          +91
                        </span>
                        <Input
                          id="mobile"
                          type="tel"
                          value={formData.mobile}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "").slice(0, 10)
                            setFormData({ ...formData, mobile: value })
                          }}
                          placeholder="9876543210"
                          className="rounded-l-none"
                          maxLength={10}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">10-digit mobile number</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) => setFormData({ ...formData, role: value })}
                      >
                        <SelectTrigger id="role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {user.role === "super_admin" && <SelectItem value="super_admin">Super Admin</SelectItem>}
                          {["super_admin", "admin"].includes(user.role) && <SelectItem value="admin">Admin</SelectItem>}
                          {["super_admin", "admin"].includes(user.role) && (
                            <SelectItem value="manager">Manager</SelectItem>
                          )}
                          <SelectItem value="agent">Agent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="Confirm password"
                      />
                    </div>

                    <div className="flex gap-4">
                      <Button type="submit" disabled={submitting}>
                        {submitting ? "Creating..." : "Create User"}
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/team/users">Cancel</Link>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
