import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Users, Ticket, Package, Shield } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">H</span>
            </div>
            <span className="text-xl font-semibold tracking-tight">Hazel</span>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/team/login">Team Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/customer/login">Customer Portal</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container max-w-7xl mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground mb-6">
              <Shield className="h-4 w-4 text-primary" />
              Enterprise-grade CRM Platform
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance mb-6">
              Streamline Your
              <span className="text-primary"> Customer Support</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-pretty mb-8 max-w-2xl mx-auto">
              Manage IT support tickets, products, and teams efficiently with our comprehensive CRM platform designed for modern businesses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link href="/customer/login">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/team/login">Team Access</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30">
        <div className="container max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A complete suite of tools to manage customer relationships, support tickets, and product catalogs.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group p-6 rounded-xl border bg-card card-hover">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Ticket className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ticket Management</h3>
              <p className="text-muted-foreground text-sm">
                Multi-level approval workflows, priority tracking, and automated responses for efficient support.
              </p>
            </div>
            <div className="group p-6 rounded-xl border bg-card card-hover">
              <div className="h-12 w-12 rounded-lg bg-chart-2/10 flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-chart-2" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Product Catalog</h3>
              <p className="text-muted-foreground text-sm">
                Organize products with categories, auto-generated codes, and customer-specific assignments.
              </p>
            </div>
            <div className="group p-6 rounded-xl border bg-card card-hover">
              <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-warning" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Team Management</h3>
              <p className="text-muted-foreground text-sm">
                Role-based access control, activity logging, and comprehensive user management features.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t">
        <div className="container max-w-7xl mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join the platform trusted by businesses for managing customer support and product relationships.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link href="/customer/login">
                  Customer Portal
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/team/login">Team Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">H</span>
              </div>
              <span className="font-semibold">Hazel CRM</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with care for modern businesses.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
