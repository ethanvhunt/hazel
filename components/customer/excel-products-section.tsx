"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileSpreadsheet, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface ExcelUpload {
  id: string
  file_name: string
  file_size: number
  file_type: string
  created_at: string
  uploaded_by_name: string
}

export function ExcelProductsSection({ customerId }: { customerId: string }) {
  const [uploads, setUploads] = useState<ExcelUpload[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchUploads()
  }, [customerId])

  const fetchUploads = async () => {
    try {
      setLoading(false)
      const response = await fetch(`/api/excel-uploads?customerId=${customerId}`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setUploads(data.uploads || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching uploads:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  if (loading) {
    return <div className="text-center text-gray-500 py-8">Loading Excel files...</div>
  }

  if (uploads.length === 0) {
    return null
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Product Excel Files
        </CardTitle>
        <CardDescription>Product and service files shared with you</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {uploads.map((upload) => (
            <div key={upload.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3 flex-1">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{upload.file_name}</p>
                  <p className="text-xs text-gray-600">
                    {formatFileSize(upload.file_size)} • {new Date(upload.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/customer/excel-view/${upload.id}`)}
                className="ml-2 gap-2"
              >
                <Eye className="h-4 w-4" />
                View
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
