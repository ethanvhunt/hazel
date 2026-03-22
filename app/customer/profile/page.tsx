"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { CustomerNav } from "@/components/customer/customer-nav"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

export default function CustomerProfile() {
  const router = useRouter()
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editData, setEditData] = useState({ contactPerson: "", phone: "" })
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
          router.push("/customer/login")
          return
        }

        const sessionData = await sessionResponse.json()
        if (sessionData.type !== "customer") {
          router.push("/customer/login")
          return
        }

        setCustomer(sessionData.session)
        setEditData({
          contactPerson: sessionData.session.contactPerson || "",
          phone: sessionData.session.phone || "",
        })
      } catch (error) {
        console.error("[v0] Profile load error:", error)
        router.push("/customer/login")
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  const handleUpdateProfile = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch("/api/profile/customer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editData),
      })

      if (response.ok) {
        toast.success("Profile updated successfully")
        setCustomer({ ...customer, ...editData })
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
      const response = await fetch("/api/password/customer/change", {
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
    router.push("/customer/login")
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!customer) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <CustomerNav customer={customer} onLogout={handleLogout} />
        <SidebarInset>
          <header className="flex items-center gap-2 border-b p-4 md:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Profile Settings</h1>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-8 w-full max-w-3xl mx-auto">
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
                      setEditData({
                        contactPerson: customer.contactPerson || "",
                        phone: customer.phone || "",
                      })
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
                        <Input value={customer?.email} disabled className="mt-1 bg-muted" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Company Name</label>
                        <Input value={customer?.company_name || ""} disabled className="mt-1 bg-muted" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Contact Person</label>
                        <Input
                          value={editData.contactPerson}
                          onChange={(e) => setEditData({ ...editData, contactPerson: e.target.value })}
                          disabled={!isEditMode}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Phone</label>
                        <Input
                          value={editData.phone}
                          onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                          disabled={!isEditMode}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground text-xs">
                          Account created: {new Date(customer?.created_at).toLocaleDateString()}
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
