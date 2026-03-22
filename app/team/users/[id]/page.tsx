"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TeamNav } from "@/components/team/team-nav"
import { toast } from "sonner"
import { ArrowLeft, Trash2, Lock } from "lucide-react"
import { SidebarProvider } from "@/components/ui/sidebar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const [user, setUser] = useState<any>(null)
  const [targetUser, setTargetUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  })
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "",
  })

  const roleHierarchy: Record<string, number> = {
    super_admin: 4,
    admin: 3,
    manager: 2,
    agent: 1,
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionResponse = await fetch("/api/auth/session", {
          credentials: "include",
        })

        if (!sessionResponse.ok) {
          router.push("/team/login")
          return
        }

        const sessionData = await sessionResponse.json()

        if (!sessionData.session || sessionData.type !== "team") {
          router.push("/team/login")
          return
        }

        if (!["manager", "admin", "super_admin"].includes(sessionData.session.role)) {
          toast.error("You don't have permission to edit users")
          router.push("/team/dashboard")
          return
        }

        setUser(sessionData.session)

        const usersResponse = await fetch("/api/users", {
          credentials: "include",
        })

        if (usersResponse.ok) {
          const users = await usersResponse.json()
          const foundUser = users.find((u: any) => u.id === userId)
          if (foundUser) {
            setTargetUser(foundUser)
            setFormData({
              fullName: foundUser.full_name,
              email: foundUser.email,
              role: foundUser.role,
            })
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router, userId])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    router.push("/team/login")
  }

  const getAvailableRoles = () => {
    if (!user) return []
    const roles = []

    if (user.role === "super_admin") {
      roles.push("super_admin", "admin", "manager", "agent")
    } else if (user.role === "admin") {
      roles.push("admin", "manager", "agent")
    } else if (user.role === "manager") {
      roles.push("agent")
    }

    return roles
  }

  const canEditRole = () => {
    if (!user || !targetUser) return false
    return roleHierarchy[targetUser.role] < roleHierarchy[user.role]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setSubmitting(true)
    try {
      const response = await fetch(`/api/user-management/update/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          role: formData.role,
        }),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.message || "Failed to update user")
        return
      }

      toast.success("User updated successfully")
      router.push("/team/users")
    } catch (error) {
      console.error("[v0] Error updating user:", error)
      toast.error("An error occurred while updating user")
    } finally {
      setSubmitting(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords don't match")
      return
    }

    setPasswordSubmitting(true)
    try {
      const response = await fetch("/api/password/team/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: userId,
          newPassword: passwordForm.newPassword,
        }),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.message || "Failed to change password")
        return
      }

      toast.success("Password changed successfully")
      setPasswordDialogOpen(false)
      setPasswordForm({ newPassword: "", confirmPassword: "" })
    } catch (error) {
      console.error("[v0] Error changing password:", error)
      toast.error("An error occurred while changing password")
    } finally {
      setPasswordSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/user-management/delete/${userId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        toast.error("Failed to delete user")
        return
      }

      toast.success("User deleted successfully")
      router.push("/team/users")
    } catch (error) {
      console.error("[v0] Error deleting user:", error)
      toast.error("An error occurred while deleting user")
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!user || !targetUser) return null

  const availableRoles = getAvailableRoles()

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <TeamNav user={user} onLogout={handleLogout} />
        <main className="flex-1 overflow-auto">
          <div className="p-8 max-w-2xl">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="ghost" asChild>
                <Link href="/team/users">
                  <ArrowLeft size={20} />
                </Link>
              </Button>
              <h1 className="text-3xl font-bold">Edit User</h1>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
                <CardDescription>Update user details and role</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={formData.email} disabled />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value })}
                      disabled={!canEditRole()}
                    >
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role.replace("_", " ").toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!canEditRole() && (
                      <p className="text-sm text-muted-foreground">You can only edit users with lower roles</p>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Updating..." : "Update User"}
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/team/users">Cancel</Link>
                    </Button>
                  </div>
                </form>

                <div className="mt-8 pt-8 border-t space-y-4">
                  {["super_admin", "admin"].includes(user.role) && (
                    <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2 bg-transparent">
                          <Lock size={20} />
                          Change Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change User Password</DialogTitle>
                          <DialogDescription>Set a new password for {targetUser.full_name}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                              placeholder="Enter new password"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                              placeholder="Confirm password"
                            />
                          </div>
                          <div className="flex gap-4 justify-end">
                            <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={passwordSubmitting}>
                              {passwordSubmitting ? "Changing..." : "Change Password"}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      {user.role === "super_admin" && (
                        <Button variant="destructive" className="gap-2">
                          <Trash2 size={20} />
                          Delete User
                        </Button>
                      )}
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {targetUser.full_name}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="flex gap-4 justify-end">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                          Delete
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
