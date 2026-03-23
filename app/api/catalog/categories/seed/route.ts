import connectDB from "@/lib/mongodb"
import ProductCategory from "@/models/ProductCategory"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ROLES } from "@/lib/constants"

const defaultCategories = [
  { name: "Computer", description: "Desktop computers, laptops, and workstations", slug: "computer" },
  { name: "Printer", description: "Printers, multifunction devices, and plotters", slug: "printer" },
  { name: "Network Hardware", description: "Routers, switches, access points, and network devices", slug: "network_hardware" },
  { name: "Server", description: "Physical servers, rack servers, and server components", slug: "server" },
  { name: "Storage", description: "Hard drives, SSDs, NAS, and storage solutions", slug: "storage" },
  { name: "Monitor", description: "Computer monitors, displays, and projectors", slug: "monitor" },
  { name: "Peripheral", description: "Keyboards, mice, webcams, and other peripherals", slug: "peripheral" },
  { name: "Software", description: "Software licenses, subscriptions, and applications", slug: "software" },
  { name: "Security", description: "Firewalls, security cameras, and security devices", slug: "security" },
  { name: "Communication", description: "VoIP phones, headsets, and communication devices", slug: "communication" },
]

// POST - Seed default categories (super_admin and admin only)
export async function POST() {
  try {
    await connectDB()
    
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const sessionData = JSON.parse(teamSession)
    
    if (![ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(sessionData.role)) {
      return NextResponse.json({ message: "Only super admin and admin can seed categories" }, { status: 403 })
    }

    const results = {
      created: [] as string[],
      existing: [] as string[],
    }

    for (const category of defaultCategories) {
      const existing = await ProductCategory.findOne({
        $or: [
          { slug: category.slug },
          { name: { $regex: new RegExp(`^${category.name}$`, "i") } }
        ]
      })

      if (!existing) {
        await ProductCategory.create({
          ...category,
          is_custom: false,
        })
        results.created.push(category.name)
      } else {
        results.existing.push(category.name)
      }
    }

    return NextResponse.json({
      message: `Seeded ${results.created.length} categories`,
      created: results.created,
      existing: results.existing,
    })
  } catch (error) {
    console.error("[v0] Seed categories error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
