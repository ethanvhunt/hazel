"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
import { Plus, Trash2, Pencil, UserCheck, UserX, Search, Filter, X } from "lucide-react"

interface CustomerUsersListProps {
  customerId: string
  userRole: string
}

export function CustomerUsersList({ customerId, userRole }: CustomerUsersListProps) {
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

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

  useEffect(() => {
    applyFilters()
  }, [users, searchQuery, roleFilter, statusFilter])

  const applyFilters = () => {
    let filtered = [...users]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.mobile_number?.toLowerCase().includes(query)
      )
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(u => u.role === roleFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(u => 
        statusFilter === "active" ? u.is_active : !u.is_active
      )
    }

    setFilteredUsers(filtered)
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}/users`, {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
        setFilteredUsers(data)
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

  const clearFilters = () => {
    setSearchQuery("")
    setRoleFilter("all")
    setStatusFilter("all")
  }

  const hasActiveFilters = searchQuery || roleFilter !== "all" || statusFilter !== "all"

  const canManageUsers = ["super_admin", "admin", "manager"].includes(userRole)
  const canDeleteUsers = userRole === "super_admin"

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-10 flex-1 min-w-[200px]" />
            <Skeleton className="h-10 w-[120px]" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle>Customer Users</CardTitle>
          <CardDescription>
            {filteredUsers.length} of {users.length} users
          </CardDescription>
        </div>
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
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="customer_admin">Admin</SelectItem>
              <SelectItem value="customer_agent">Agent</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {hasActiveFilters ? "No users match your filters" : "No users found for this customer"}
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell">Email</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">Mobile</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  {canManageUsers && <TableHead className="font-semibold">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.mobile_number}</TableCell>
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
                    {canManageUsers && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditDialog(user)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleToggleStatus(user)}
                          >
                            {user.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                          </Button>
                          {canDeleteUsers && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
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
          </div>
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
