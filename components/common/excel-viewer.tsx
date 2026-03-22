"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"

interface ExcelViewerProps {
  uploadId: string
  onClose?: () => void
}

export function ExcelViewer({ uploadId }: ExcelViewerProps) {
  const [loading, setLoading] = useState(true)
  const [fileName, setFileName] = useState("")
  const [sheets, setSheets] = useState<Record<string, any[]>>({})
  const [activeSheet, setActiveSheet] = useState("")

  useEffect(() => {
    fetchExcelData()
  }, [uploadId])

  const fetchExcelData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/excel-uploads/${uploadId}/data`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setFileName(data.fileName)
        setSheets(data.sheets)
        const sheetNames = Object.keys(data.sheets)
        if (sheetNames.length > 0) {
          setActiveSheet(sheetNames[0])
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching Excel data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const sheetNames = Object.keys(sheets)

  if (sheetNames.length === 0) {
    return <div className="text-center text-gray-500 p-8">No data available to display</div>
  }

  const currentSheetData = sheets[activeSheet] || []
  const headers = currentSheetData[0] || []
  const rows = currentSheetData.slice(1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{fileName}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeSheet} onValueChange={setActiveSheet}>
          <TabsList className="mb-4">
            {sheetNames.map((sheetName) => (
              <TabsTrigger key={sheetName} value={sheetName}>
                {sheetName}
              </TabsTrigger>
            ))}
          </TabsList>

          {sheetNames.map((sheetName) => (
            <TabsContent key={sheetName} value={sheetName}>
              <ScrollArea className="h-[500px] w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.map((header: any, idx: number) => (
                        <TableHead key={idx} className="font-semibold bg-gray-50">
                          {header || `Column ${idx + 1}`}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row: any[], rowIdx: number) => (
                      <TableRow key={rowIdx}>
                        {row.map((cell: any, cellIdx: number) => (
                          <TableCell key={cellIdx}>{cell}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
