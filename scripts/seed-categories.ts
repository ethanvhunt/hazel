// Script to seed default product categories
// Run with: npx ts-node scripts/seed-categories.ts

import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI || ""

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

async function seedCategories() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI environment variable is not set")
    process.exit(1)
  }

  try {
    await mongoose.connect(MONGODB_URI)
    console.log("Connected to MongoDB")

    const ProductCategory = mongoose.models.ProductCategory || mongoose.model(
      "ProductCategory",
      new mongoose.Schema({
        name: { type: String, required: true, unique: true },
        slug: { type: String, required: true, unique: true },
        description: { type: String },
        is_custom: { type: Boolean, default: false },
        created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      }, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } })
    )

    for (const category of defaultCategories) {
      const existing = await ProductCategory.findOne({ slug: category.slug })
      if (!existing) {
        await ProductCategory.create({
          ...category,
          is_custom: false,
        })
        console.log(`Created category: ${category.name}`)
      } else {
        console.log(`Category already exists: ${category.name}`)
      }
    }

    console.log("Seeding complete!")
    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error("Error seeding categories:", error)
    await mongoose.disconnect()
    process.exit(1)
  }
}

seedCategories()
