import connectDB from "@/lib/mongodb"
import Customer from "@/models/Customer"
import CustomerUser from "@/models/CustomerUser"
import CustomerProduct from "@/models/CustomerProduct"
import Product from "@/models/Product"
import { logActivity } from "@/lib/activity-logger"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { hashPassword } from "@/lib/auth"
import { sendSMS, formatNewUserSMS } from "@/lib/sms"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    await connectDB()
    
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(teamSession)

    // Only team members can create customers
    if (!["super_admin", "admin", "manager", "agent"].includes(session.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const { companyName, contactPerson, email, phone, customerAdmin, customerAgents, productIds } = await request.json()

    if (!companyName || !contactPerson || !email) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Check if customer email exists
    const existingCustomer = await Customer.findOne({ email: email.toLowerCase() })
    if (existingCustomer) {
      return NextResponse.json({ message: "Customer with this email already exists" }, { status: 400 })
    }

    // Generate random password for customer
    const generatedPassword = crypto.randomBytes(8).toString("hex")
    const passwordHash = hashPassword(generatedPassword)

    const customer = await Customer.create({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      company_name: companyName,
      contact_person: contactPerson,
      phone: phone || null,
      is_active: true,
    })

    // Create customer admin user if provided
    let adminUser = null
    if (customerAdmin && customerAdmin.email && customerAdmin.mobileNumber) {
      const adminPassword = crypto.randomBytes(8).toString("hex")
      const adminPasswordHash = hashPassword(adminPassword)

      adminUser = await CustomerUser.create({
        customer_id: customer._id,
        email: customerAdmin.email.toLowerCase(),
        password_hash: adminPasswordHash,
        full_name: customerAdmin.fullName || contactPerson,
        mobile_number: customerAdmin.mobileNumber,
        role: "customer_admin",
        is_active: true,
      })

      // Send SMS to customer admin with credentials
      if (customerAdmin.mobileNumber) {
        await sendSMS({
          to: customerAdmin.mobileNumber,
          message: formatNewUserSMS(customerAdmin.fullName || contactPerson, adminPassword),
          type: "user_created",
          relatedId: adminUser._id.toString(),
        })
      }
    }

    // Create customer agents if provided
    const agentUsers = []
    if (customerAgents && Array.isArray(customerAgents)) {
      for (const agent of customerAgents) {
        if (agent.email && agent.mobileNumber) {
          const agentPassword = crypto.randomBytes(8).toString("hex")
          const agentPasswordHash = hashPassword(agentPassword)

          const agentUser = await CustomerUser.create({
            customer_id: customer._id,
            email: agent.email.toLowerCase(),
            password_hash: agentPasswordHash,
            full_name: agent.fullName,
            mobile_number: agent.mobileNumber,
            role: "customer_agent",
            is_active: true,
          })

          agentUsers.push(agentUser)

          // Send SMS to customer agent with credentials
          if (agent.mobileNumber) {
            await sendSMS({
              to: agent.mobileNumber,
              message: formatNewUserSMS(agent.fullName, agentPassword),
              type: "user_created",
              relatedId: agentUser._id.toString(),
            })
          }
        }
      }
    }

    // Assign products if provided
    let productsAssigned = 0
    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      for (const productId of productIds) {
        try {
          // Check if product exists
          const product = await Product.findById(productId)
          if (product) {
            // Check if assignment already exists
            const existingAssignment = await CustomerProduct.findOne({
              customer_id: customer._id,
              product_id: productId,
            })
            
            if (!existingAssignment) {
              await CustomerProduct.create({
                customer_id: customer._id,
                product_id: productId,
                assigned_by: session.userId,
                status: "active",
              })
              productsAssigned++

              // Log product assignment
              await logActivity({
                entityType: "customer_product",
                entityId: customer._id,
                action: "assign",
                performedBy: session.userId,
                performedByType: "user",
                performedByName: session.fullName,
                newValues: { product_id: productId, product_code: product.product_code },
                details: `Assigned product ${product.product_code} to customer ${companyName}`,
              })
            }
          }
        } catch (err) {
          console.error(`[v0] Error assigning product ${productId}:`, err)
        }
      }
    }

    // Log activity
    await logActivity({
      entityType: "customer",
      entityId: customer._id,
      action: "create",
      performedBy: session.userId,
      performedByType: "user",
      performedByName: session.fullName,
      newValues: {
        company_name: companyName,
        contact_person: contactPerson,
        email,
        customer_users_created: (adminUser ? 1 : 0) + agentUsers.length,
        products_assigned: productsAssigned,
      },
      details: `Created customer ${companyName}`,
    })

    return NextResponse.json(
      {
        message: "Customer created successfully",
        customer: {
          id: customer._id.toString(),
          email: customer.email,
          company_name: customer.company_name,
          contact_person: customer.contact_person,
          phone: customer.phone,
          created_at: customer.created_at,
        },
        generatedPassword,
        customerUsersCreated: (adminUser ? 1 : 0) + agentUsers.length,
        productsAssigned,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Error creating customer:", error)
    return NextResponse.json({ message: "Internal server error", error: String(error) }, { status: 500 })
  }
}
