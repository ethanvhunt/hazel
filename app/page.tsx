import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      <div className="text-center max-w-2xl">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 md:mb-8 leading-tight">
          Hazelnutcyborg CRM Platform
        </h1>
        <p className="text-sm sm:text-base text-slate-300 mb-8 md:mb-12">
          Manage your IT support tickets, products, and team efficiently
        </p>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
            <Link href="/team/login">Team Login</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-slate-900 bg-transparent w-full sm:w-auto"
          >
            <Link href="/customer/login">Customer Login</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
