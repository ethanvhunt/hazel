"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { TeamNav } from "@/components/team/team-nav"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default function TeamProfile() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editName, setEditName] = useState("")
  const [gmailAddress, setGmailAddress] = useState("")
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const sessionResponse = await fetch("/api/auth/session", {
          credentials: "include",
        })

        if (!sessionResponse.ok) {
          router.push("/team/login")
          return
        }

        const sessionData = await sessionResponse.json()
        if (sessionData.type !== "team") {
          router.push("/team/login")
          return
        }

        setUser(sessionData.session)
        setEditName(sessionData.session.fullName || "")
        setGmailAddress(sessionData.session.gmailAddress || "")
      } catch (error) {
        console.error("[v0] Profile load error:", error)
        router.push("/team/login")
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  const handleUpdateProfile = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch("/api/profile/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fullName: editName, gmailAddress }),
      })

      if (response.ok) {
        toast.success("Profile updated successfully")
        setUser({ ...user, fullName: editName, gmailAddress })
      } else {
        toast.error("Failed to update profile")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch("/api/password/team/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ oldPassword, newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Password changed successfully")
        setOldPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        toast.error(data.message || "Failed to change password")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    })
    toast.success("Logged out successfully")
    router.push("/team/login")
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <TeamNav user={user} onLogout={handleLogout} />
        <SidebarInset>
          <main className="flex-1 overflow-auto w-full">
            <div className="p-8 max-w-2xl">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Profile Settings</h1>
                {!isEditMode && (
                  <Button variant="outline" onClick={() => setIsEditMode(true)}>
                    Edit Profile
                  </Button>
                )}
                {isEditMode && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsEditMode(false)
                      setEditName(user.fullName || "")
                      setGmailAddress(user.gmailAddress || "")
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>

              <Tabs defaultValue="profile" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="password">Change Password</TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                  <Card>
                    <CardHeader>
                      <CardTitle>{isEditMode ? "Edit Profile" : "Profile Information"}</CardTitle>
                      <CardDescription>
                        {isEditMode ? "Update your profile information" : "View your profile details"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input value={user?.email} disabled className="mt-1 bg-muted" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Full Name</label>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          disabled={!isEditMode}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Gmail Address (for notifications)</label>
                        <Input
                          type="email"
                          value={gmailAddress}
                          onChange={(e) => setGmailAddress(e.target.value)}
                          disabled={!isEditMode}
                          placeholder="your-email@gmail.com"
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter your Gmail address to receive ticket and message notifications
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Role</label>
                        <Input
                          value={user?.role?.replace(/_/g, " ") || ""}
                          disabled
                          className="mt-1 capitalize bg-muted"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground text-xs">
                          Account created: {new Date(user?.created_at).toLocaleDateString()}
                        </label>
                      </div>
                      {isEditMode && (
                        <Button
                          onClick={() => {
                            handleUpdateProfile()
                            setIsEditMode(false)
                          }}
                          disabled={isUpdating}
                          className="w-full"
                        >
                          {isUpdating ? "Updating..." : "Save Changes"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="password">
                  <Card>
                    <CardHeader>
                      <CardTitle>Change Password</CardTitle>
                      <CardDescription>Update your password</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Current Password</label>
                        <Input
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">New Password</label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Confirm Password</label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <Button onClick={handleChangePassword} disabled={isUpdating} className="w-full">
                        {isUpdating ? "Changing..." : "Change Password"}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
