"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Filter, X } from "lucide-react"

export function ActivityLog() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ total: 0, limit: 50, offset: 0, hasMore: false })
  const [filters, setFilters] = useState({ entityTypes: [], actions: [] })
  
  // Filter states
  const [entityTypeFilter, setEntityTypeFilter] = useState("")
  const [actionFilter, setActionFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchActivityLogs()
  }, [entityTypeFilter, actionFilter, startDate, endDate, pagination.offset])

  const fetchActivityLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append("limit", pagination.limit.toString())
      params.append("offset", pagination.offset.toString())
      
      if (entityTypeFilter) params.append("entity_type", entityTypeFilter)
      if (actionFilter) params.append("action", actionFilter)
      if (startDate) params.append("start_date", startDate)
      if (endDate) params.append("end_date", endDate)

      const response = await fetch(`/api/activity-logs?${params}`, {
        credentials: "include",
      })
      
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
        setPagination(prev => ({ ...prev, ...data.pagination }))
        setFilters(data.filters)
      }
    } catch (error) {
      toast.error("Failed to fetch activity logs")
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setEntityTypeFilter("")
    setActionFilter("")
    setStartDate("")
    setEndDate("")
    setPagination(prev => ({ ...prev, offset: 0 }))
  }

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      create: "bg-green-100 text-green-800",
      update: "bg-blue-100 text-blue-800",
      delete: "bg-red-100 text-red-800",
      approve: "bg-emerald-100 text-emerald-800",
      reject: "bg-orange-100 text-orange-800",
      assign: "bg-purple-100 text-purple-800",
      unassign: "bg-pink-100 text-pink-800",
      login: "bg-cyan-100 text-cyan-800",
      logout: "bg-slate-100 text-slate-800",
      close: "bg-gray-100 text-gray-800",
      reopen: "bg-sky-100 text-sky-800",
    }
    return colors[action] || "bg-gray-100 text-gray-800"
  }

  const getEntityTypeBadge = (entityType: string) => {
    const colors: Record<string, string> = {
      ticket: "bg-yellow-100 text-yellow-800",
      product: "bg-indigo-100 text-indigo-800",
      customer: "bg-teal-100 text-teal-800",
      user: "bg-violet-100 text-violet-800",
      customer_user: "bg-rose-100 text-rose-800",
      product_assignment: "bg-amber-100 text-amber-800",
    }
    return colors[entityType] || "bg-gray-100 text-gray-800"
  }

  const formatDetails = (details: any) => {
    if (!details) return "—"
    try {
      const parsed = typeof details === "string" ? JSON.parse(details) : details
      return Object.entries(parsed)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ")
    } catch {
      return String(details)
    }
  }

  const handlePrevPage = () => {
    setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))
  }

  const handleNextPage = () => {
    if (pagination.hasMore) {
      setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <CardTitle>Activity Logs</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter size={16} />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>
          
          {showFilters && (
            <div className="flex flex-wrap gap-4 p-4 bg-muted rounded-lg">
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium mb-1 block">Entity Type</label>
                <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {filters.entityTypes.map((type: string) => (
                      <SelectItem key={type} value={type}>
                        {type.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium mb-1 block">Action</label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {filters.actions.map((action: string) => (
                      <SelectItem key={action} value={action}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium mb-1 block">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium mb-1 block">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="gap-2">
                  <X size={16} />
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading activity logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No activities found</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge className={getEntityTypeBadge(log.entity_type)}>
                        {log.entity_type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionBadge(log.action)}>{log.action}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                      {formatDetails(log.details)}
                    </TableCell>
                    <TableCell>{log.performed_by_name || "System"}</TableCell>
                    <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {pagination.offset + 1} to {Math.min(pagination.offset + logs.length, pagination.total)} of {pagination.total} entries
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={pagination.offset === 0}
                >
                  <ChevronLeft size={16} />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!pagination.hasMore}
                >
                  Next
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
