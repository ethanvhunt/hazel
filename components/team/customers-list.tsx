"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Trash2, Eye, Search, Building, UserPlus } from "lucide-react"

export function CustomersList({ userRole }: { userRole: string }) {
  const router = useRouter()
  const [customers, setCustomers] = useState<any[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCustomers(customers)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = customers.filter(
        (customer) =>
          customer.company_name?.toLowerCase().includes(query) ||
          customer.contact_person?.toLowerCase().includes(query) ||
          customer.email?.toLowerCase().includes(query) ||
          customer.phone?.toLowerCase().includes(query) ||
          customer.assigned_to?.toLowerCase().includes(query)
      )
      setFilteredCustomers(filtered)
    }
  }, [searchQuery, customers])

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
        setFilteredCustomers(data)
      }
    } catch (error) {
      toast.error("Failed to fetch customers")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCustomer = async (customerId: string, companyName: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.message || "Failed to delete customer")
        return
      }

      toast.success(`Customer ${companyName} deleted successfully`)
      fetchCustomers()
    } catch (error) {
      console.error("[v0] Error deleting customer:", error)
      toast.error("An error occurred while deleting customer")
    }
  }

  const handleViewCustomer = (customerId: string) => {
    router.push(`/team/customers/${customerId}`)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading customers...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building size={20} />
              All Customers
            </CardTitle>
            <CardDescription>{filteredCustomers.length} customers found</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
            {["super_admin", "admin", "manager"].includes(userRole) && (
              <Button asChild>
                <Link href="/team/customers/assign">
                  <UserPlus size={16} className="mr-2" />
                  Assign Customer
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <Building className="mx-auto text-muted-foreground mb-4" size={48} />
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "No customers match your search" : "No customers found"}
            </p>
            {!searchQuery && (
              <Button asChild>
                <Link href="/team/customers/create">Add First Customer</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Phone</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{customer.company_name}</TableCell>
                    <TableCell>{customer.contact_person}</TableCell>
                    <TableCell className="hidden md:table-cell">{customer.email}</TableCell>
                    <TableCell className="hidden lg:table-cell">{customer.phone || "—"}</TableCell>
                    <TableCell>
                      {customer.assigned_to ? (
                        <Badge variant="outline">{customer.assigned_to}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleViewCustomer(customer.id)}
                        >
                          <Eye size={16} />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                        {userRole === "super_admin" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" className="gap-1">
                                <Trash2 size={16} />
                                <span className="hidden sm:inline">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {customer.company_name}? This will also delete all their
                                  products, tickets, messages, and users. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="flex gap-4 justify-end">
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCustomer(customer.id, customer.company_name)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
