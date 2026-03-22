"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
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
import { toast } from "sonner"
import { Plus, Trash2, Pencil, UserCheck, UserX } from "lucide-react"
import { CUSTOMER_ROLES } from "@/lib/constants"

interface CustomerUsersListProps {
  customerId: string
  userRole: string
}

export function CustomerUsersList({ customerId, userRole }: CustomerUsersListProps) {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    mobile_number: "",
    role: "customer_agent",
    password: "",
  })
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    mobile_number: "",
    is_active: true,
    password: "",
  })

  useEffect(() => {
    fetchUsers()
  }, [customerId])

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}/users`, {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Failed to fetch customer users:", error)
      toast.error("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async () => {
    if (!formData.full_name || !formData.email || !formData.mobile_number) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const response = await fetch(`/api/customers/${customerId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`User created successfully. Temporary password: ${data.tempPassword}`)
        setIsAddDialogOpen(false)
        setFormData({
          full_name: "",
          email: "",
          mobile_number: "",
          role: "customer_agent",
          password: "",
        })
        fetchUsers()
      } else {
        toast.error(data.message || "Failed to create user")
      }
    } catch (error) {
      toast.error("Failed to create user")
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/customers/${customerId}/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editFormData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("User updated successfully")
        setIsEditDialogOpen(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        toast.error(data.message || "Failed to update user")
      }
    } catch (error) {
      toast.error("Failed to update user")
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`User ${userName} deleted successfully`)
        fetchUsers()
      } else {
        toast.error(data.message || "Failed to delete user")
      }
    } catch (error) {
      toast.error("Failed to delete user")
    }
  }

  const handleToggleStatus = async (user: any) => {
    try {
      const response = await fetch(`/api/customers/${customerId}/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_active: !user.is_active }),
      })

      if (response.ok) {
        toast.success(`User ${user.is_active ? "deactivated" : "activated"} successfully`)
        fetchUsers()
      } else {
        const data = await response.json()
        toast.error(data.message || "Failed to update user status")
      }
    } catch (error) {
      toast.error("Failed to update user status")
    }
  }

  const openEditDialog = (user: any) => {
    setSelectedUser(user)
    setEditFormData({
      full_name: user.full_name,
      mobile_number: user.mobile_number,
      is_active: user.is_active,
      password: "",
    })
    setIsEditDialogOpen(true)
  }

  const canManageUsers = ["super_admin", "admin", "manager"].includes(userRole)
  const canDeleteUsers = userRole === "super_admin"

  if (loading) {
    return <div>Loading users...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Customer Users</CardTitle>
        {canManageUsers && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus size={16} />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Customer User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="mobile_number">Mobile Number *</Label>
                  <Input
                    id="mobile_number"
                    value={formData.mobile_number}
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                    placeholder="Enter mobile number"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer_admin">Customer Admin</SelectItem>
                      <SelectItem value="customer_agent">Customer Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="password">Password (optional)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Leave empty for auto-generated"
                  />
                </div>
                <Button onClick={handleAddUser} className="w-full">
                  Create User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No users found for this customer</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                {canManageUsers && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.mobile_number}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {user.role === "customer_admin" ? "Admin" : "Agent"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  {canManageUsers && (
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 bg-transparent"
                          onClick={() => openEditDialog(user)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 bg-transparent"
                          onClick={() => handleToggleStatus(user)}
                        >
                          {user.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                        </Button>
                        {canDeleteUsers && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" className="gap-1">
                                <Trash2 size={14} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {user.full_name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="flex gap-4 justify-end">
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.id, user.full_name)}
                                  className="bg-destructive"
                                >
                                  Delete
                                </AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_full_name">Full Name</Label>
              <Input
                id="edit_full_name"
                value={editFormData.full_name}
                onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_mobile_number">Mobile Number</Label>
              <Input
                id="edit_mobile_number"
                value={editFormData.mobile_number}
                onChange={(e) => setEditFormData({ ...editFormData, mobile_number: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_password">New Password (optional)</Label>
              <Input
                id="edit_password"
                type="password"
                value={editFormData.password}
                onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                placeholder="Leave empty to keep current"
              />
            </div>
            <Button onClick={handleEditUser} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
