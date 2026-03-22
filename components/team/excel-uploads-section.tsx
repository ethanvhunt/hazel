"use client"

import { AlertDialogFooter } from "@/components/ui/alert-dialog"

import type React from "react"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"
import { Upload, Trash2, FileSpreadsheet, Replace, Eye } from "lucide-react"

interface ExcelUpload {
  id: string
  file_name: string
  file_size: number
  file_type: string
  description?: string
  created_at: string
  uploaded_by_name: string
}

export function ExcelUploadsSection({ customerId }: { customerId: string }) {
  const [uploads, setUploads] = useState<ExcelUpload[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [replaceId, setReplaceId] = useState<string | null>(null)
  const router = useRouter()
  const fileInputRef: React.RefObject<HTMLInputElement> = { current: null }
  const replaceInputRef: React.RefObject<HTMLInputElement> = { current: null }

  useEffect(() => {
    fetchUploads()
  }, [customerId])

  const fetchUploads = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/excel-uploads?customerId=${customerId}`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setUploads(data.uploads || [])
      } else {
        toast.error("Failed to load Excel files")
      }
    } catch (error) {
      console.error("[v0] Error fetching uploads:", error)
      toast.error("Error loading Excel files")
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    await uploadFile(file)
  }

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !replaceId) return

    try {
      await handleDelete(replaceId)
      await uploadFile(file)
      setReplaceId(null)
    } catch (error) {
      console.error("[v0] Error replacing file:", error)
      toast.error("Error replacing file")
    }
  }

  const uploadFile = async (file: File) => {
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("customerId", customerId)
      formData.append("description", `Customer Excel file - ${new Date().toLocaleDateString()}`)

      const response = await fetch("/api/excel-uploads", {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      if (response.ok) {
        toast.success("Excel file uploaded successfully")
        fetchUploads()
      } else {
        const data = await response.json()
        toast.error(data.message || "Failed to upload file")
      }
    } catch (error) {
      console.error("[v0] Error uploading file:", error)
      toast.error("Error uploading file")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      if (replaceInputRef.current) {
        replaceInputRef.current.value = ""
      }
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/excel-uploads/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        toast.success("File deleted successfully")
        setDeleteId(null)
        fetchUploads()
      } else {
        toast.error("Failed to delete file")
      }
    } catch (error) {
      console.error("[v0] Error deleting file:", error)
      toast.error("Error deleting file")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  return (
    <>
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Excel Files
              </CardTitle>
              <CardDescription>Product and service Excel files for this customer</CardDescription>
            </div>
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} size="sm" className="gap-2">
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading..." : "Upload Excel"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={replaceInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleReplaceFile}
              className="hidden"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading files...</div>
          ) : uploads.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No Excel files uploaded yet</div>
          ) : (
            <div className="space-y-3">
              {uploads.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{upload.file_name}</p>
                      <p className="text-xs text-gray-600">
                        {formatFileSize(upload.file_size)} • Uploaded by {upload.uploaded_by_name} •{" "}
                        {new Date(upload.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/team/excel-view/${upload.id}`)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      title="View file"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReplaceId(upload.id)
                        replaceInputRef.current?.click()
                      }}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      title="Replace this file"
                    >
                      <Replace className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(upload.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Excel File</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The file will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && handleDelete(deleteId)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </>
  )
}
