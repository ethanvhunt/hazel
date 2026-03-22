"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ExcelViewer } from "@/components/common/excel-viewer"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TeamNav } from "@/components/team/team-nav"

export default function TeamExcelViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <TeamNav />
        <div className="flex-1 p-8">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <ExcelViewer uploadId={id} />
        </div>
      </div>
    </SidebarProvider>
  )
}
