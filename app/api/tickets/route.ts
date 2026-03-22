import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ROLES, TICKET_STATUS } from "@/lib/constants"
import { sendTicketEmail } from "@/lib/email-service"
import { sendSMS, formatTicketCreatedSMS, formatTicketApprovedSMS } from "@/lib/sms"

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")
    const customerSession = cookieStore.get("customer-session")

    if (!teamSession && !customerSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    let sessionData
    let userType = "team"
    
    try {
      if (teamSession) {
        sessionData = JSON.parse(teamSession.value)
        userType = "team"
      } else if (customerSession) {
        sessionData = JSON.parse(customerSession.value)
        userType = "customer"
      }
    } catch {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")
    const agentId = searchParams.get("agentId")
    const status = searchParams.get("status")
    const pendingApproval = searchParams.get("pendingApproval")

    let tickets

    if (userType === "customer") {
      // Customer users can only see their own company's tickets
      const custId = sessionData.customerId
      
      // customer_agent can only see approved/open tickets, not pending_approval (unless they created them)
      // customer_admin can see all including pending_approval
      if (sessionData.role === "customer_agent") {
        if (status) {
          tickets = await sql`
            SELECT t.*, cp.name as product_name, cp.product_code, c.company_name,
                   u.full_name as assigned_to_name
            FROM tickets t
            LEFT JOIN catalog_products cp ON t.product_id = cp.id
            LEFT JOIN customers c ON t.customer_id = c.id
            LEFT JOIN users u ON t.assigned_agent_id = u.id
            WHERE t.customer_id = ${custId} 
              AND t.status = ${status}
              AND (t.status != 'pending_approval' OR t.created_by_customer_user = ${sessionData.userId})
            ORDER BY t.created_at DESC
          `
        } else {
          tickets = await sql`
            SELECT t.*, cp.name as product_name, cp.product_code, c.company_name,
                   u.full_name as assigned_to_name
            FROM tickets t
            LEFT JOIN catalog_products cp ON t.product_id = cp.id
            LEFT JOIN customers c ON t.customer_id = c.id
            LEFT JOIN users u ON t.assigned_agent_id = u.id
            WHERE t.customer_id = ${custId}
              AND (t.status != 'pending_approval' OR t.created_by_customer_user = ${sessionData.userId})
            ORDER BY t.created_at DESC
          `
        }
      } else {
        // customer_admin or regular customer login can see all tickets
        if (pendingApproval === "true") {
          tickets = await sql`
            SELECT t.*, cp.name as product_name, cp.product_code, c.company_name, cu.full_name as created_by_name,
                   u.full_name as assigned_to_name
            FROM tickets t
            LEFT JOIN catalog_products cp ON t.product_id = cp.id
            LEFT JOIN customers c ON t.customer_id = c.id
            LEFT JOIN customer_users cu ON t.created_by_customer_user = cu.id
            LEFT JOIN users u ON t.assigned_agent_id = u.id
            WHERE t.customer_id = ${custId} AND t.status = 'pending_approval'
            ORDER BY t.created_at DESC
          `
        } else if (status) {
          tickets = await sql`
            SELECT t.*, cp.name as product_name, cp.product_code, c.company_name,
                   u.full_name as assigned_to_name
            FROM tickets t
            LEFT JOIN catalog_products cp ON t.product_id = cp.id
            LEFT JOIN customers c ON t.customer_id = c.id
            LEFT JOIN users u ON t.assigned_agent_id = u.id
            WHERE t.customer_id = ${custId} AND t.status = ${status}
            ORDER BY t.created_at DESC
          `
        } else {
          tickets = await sql`
            SELECT t.*, cp.name as product_name, cp.product_code, c.company_name,
                   u.full_name as assigned_to_name
            FROM tickets t
            LEFT JOIN catalog_products cp ON t.product_id = cp.id
            LEFT JOIN customers c ON t.customer_id = c.id
            LEFT JOIN users u ON t.assigned_agent_id = u.id
            WHERE t.customer_id = ${custId}
            ORDER BY t.created_at DESC
          `
        }
      }
    } else if (sessionData.role === ROLES.AGENT) {
      // Team agents only see tickets that are open (approved) and assigned to customers they manage
      const assignedCustomers = await sql`
        SELECT customer_id FROM customer_agent_assignment WHERE agent_id = ${sessionData.userId}
      `
      const customerIds = assignedCustomers.map((row: any) => row.customer_id)

      if (customerIds.length === 0) {
        return NextResponse.json([])
      }

      // Agents should NOT see pending_approval tickets
      if (status) {
        tickets = await sql`
          SELECT t.*, cp.name as product_name, cp.product_code, c.company_name,
                 u.full_name as assigned_to_name
          FROM tickets t
          LEFT JOIN catalog_products cp ON t.product_id = cp.id
          LEFT JOIN customers c ON t.customer_id = c.id
          LEFT JOIN users u ON t.assigned_agent_id = u.id
          WHERE t.customer_id = ANY(${customerIds}) 
            AND t.status = ${status}
            AND t.status NOT IN ('pending_approval', 'rejected')
          ORDER BY t.created_at DESC
        `
      } else {
        tickets = await sql`
          SELECT t.*, cp.name as product_name, cp.product_code, c.company_name,
                 u.full_name as assigned_to_name
          FROM tickets t
          LEFT JOIN catalog_products cp ON t.product_id = cp.id
          LEFT JOIN customers c ON t.customer_id = c.id
          LEFT JOIN users u ON t.assigned_agent_id = u.id
          WHERE t.customer_id = ANY(${customerIds})
            AND t.status NOT IN ('pending_approval', 'rejected')
          ORDER BY t.created_at DESC
        `
      }
    } else {
      // Super admin, admin, manager can see all tickets
      if (customerId && status) {
        tickets = await sql`
          SELECT t.*, cp.name as product_name, cp.product_code, c.company_name,
                 u.full_name as assigned_to_name
          FROM tickets t
          LEFT JOIN catalog_products cp ON t.product_id = cp.id
          LEFT JOIN customers c ON t.customer_id = c.id
          LEFT JOIN users u ON t.assigned_agent_id = u.id
          WHERE t.customer_id = ${customerId} AND t.status = ${status}
          ORDER BY t.created_at DESC
        `
      } else if (customerId) {
        tickets = await sql`
          SELECT t.*, cp.name as product_name, cp.product_code, c.company_name,
                 u.full_name as assigned_to_name
          FROM tickets t
          LEFT JOIN catalog_products cp ON t.product_id = cp.id
          LEFT JOIN customers c ON t.customer_id = c.id
          LEFT JOIN users u ON t.assigned_agent_id = u.id
          WHERE t.customer_id = ${customerId}
          ORDER BY t.created_at DESC
        `
      } else if (agentId) {
        tickets = await sql`
          SELECT t.*, cp.name as product_name, cp.product_code, c.company_name,
                 u.full_name as assigned_to_name
          FROM tickets t
          LEFT JOIN catalog_products cp ON t.product_id = cp.id
          LEFT JOIN customers c ON t.customer_id = c.id
          LEFT JOIN users u ON t.assigned_agent_id = u.id
          WHERE t.assigned_agent_id = ${agentId}
          ORDER BY t.created_at DESC
        `
      } else if (status) {
        tickets = await sql`
          SELECT t.*, cp.name as product_name, cp.product_code, c.company_name,
                 u.full_name as assigned_to_name
          FROM tickets t
          LEFT JOIN catalog_products cp ON t.product_id = cp.id
          LEFT JOIN customers c ON t.customer_id = c.id
          LEFT JOIN users u ON t.assigned_agent_id = u.id
          WHERE t.status = ${status}
          ORDER BY t.created_at DESC
        `
      } else {
        tickets = await sql`
          SELECT t.*, cp.name as product_name, cp.product_code, c.company_name,
                 u.full_name as assigned_to_name
          FROM tickets t
          LEFT JOIN catalog_products cp ON t.product_id = cp.id
          LEFT JOIN customers c ON t.customer_id = c.id
          LEFT JOIN users u ON t.assigned_agent_id = u.id
          ORDER BY t.created_at DESC
        `
      }
    }

    return NextResponse.json(tickets)
  } catch (error) {
    console.error("[v0] Error fetching tickets:", error)
    return NextResponse.json({ message: "Error fetching tickets" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const customerSession = cookieStore.get("customer-session")

    if (!customerSession) {
      return NextResponse.json({ message: "Unauthorized. Please login." }, { status: 401 })
    }

    let sessionData
    try {
      sessionData = JSON.parse(customerSession.value)
    } catch {
      return NextResponse.json({ message: "Invalid session. Please login again." }, { status: 401 })
    }

    const { productId, title, description, priority } = await request.json()

    if (!title || !description) {
      return NextResponse.json(
        { message: "Missing required fields. Title and description are required." },
        { status: 400 },
      )
    }

    const customerId = sessionData.customerId
    const isCustomerUser = sessionData.role === "customer_agent" || sessionData.role === "customer_admin"
    const customerUserId = isCustomerUser ? sessionData.userId : null
    
    // Determine initial status based on who creates the ticket
    // customer_agent tickets need approval, others go directly to open
    const initialStatus = sessionData.role === "customer_agent" ? TICKET_STATUS.PENDING_APPROVAL : TICKET_STATUS.OPEN

    const result = await sql`
      INSERT INTO tickets (
        customer_id, product_id, title, description, priority, status, 
        created_by_customer_user
      )
      VALUES (
        ${customerId}, ${productId || null}, ${title}, ${description}, 
        ${priority || "medium"}, ${initialStatus}, ${customerUserId}
      )
      RETURNING *
    `

    const ticket = result[0]

    // Get customer info
    const customer = await sql`
      SELECT company_name FROM customers WHERE id = ${customerId}
    `

    // Get product info if exists
    let productName = "General Inquiry"
    let productCode = ""
    if (productId) {
      const product = await sql`SELECT name, product_code FROM catalog_products WHERE id = ${productId}`
      if (product.length > 0) {
        productName = product[0].name
        productCode = product[0].product_code
      }
    }

    if (initialStatus === TICKET_STATUS.PENDING_APPROVAL) {
      // SMS notification to customer_admin for approval
      const customerAdmins = await sql`
        SELECT id, full_name, mobile_number FROM customer_users 
        WHERE customer_id = ${customerId} AND role = 'customer_admin' AND is_active = true
      `

      for (const admin of customerAdmins) {
        if (admin.mobile_number) {
          // Send SMS
          await sendSMS({
            to: admin.mobile_number,
            message: formatTicketCreatedSMS(
              ticket.id.toString().slice(0, 8), 
              productCode ? `${productCode} - ${productName}` : productName, 
              sessionData.fullName || "Agent"
            ),
            type: "ticket_created",
            relatedId: ticket.id,
          })
        }

        // Create notification
        await sql`
          INSERT INTO notifications (user_id, user_type, event_type, entity_type, entity_id, title, message, read)
          VALUES (
            ${admin.id},
            'customer_user',
            'ticket_pending_approval',
            'ticket',
            ${ticket.id},
            'New Ticket Pending Approval',
            ${"A new ticket \"" + title + "\" requires your approval."},
            false
          )
        `
      }

      return NextResponse.json({ 
        ...ticket, 
        message: "Ticket submitted for approval. Your customer admin will be notified via SMS." 
      }, { status: 201 })
    } else {
      // Direct ticket - notify team agent
      const assignment = await sql`
        SELECT agent_id FROM customer_agent_assignment WHERE customer_id = ${customerId} LIMIT 1
      `

      if (assignment.length > 0 && assignment[0].agent_id) {
        try {
          const agent = await sql`
            SELECT id, full_name, gmail_address, mobile_number FROM users WHERE id = ${assignment[0].agent_id}
          `

          if (agent.length > 0) {
            // Send email if available
            if (agent[0].gmail_address) {
              await sendTicketEmail(
                agent[0].gmail_address,
                title,
                description,
                customer[0]?.company_name || "Customer",
                ticket.id,
              )
            }

            // Send SMS if mobile available
            if (agent[0].mobile_number) {
              await sendSMS({
                to: agent[0].mobile_number,
                message: `New ticket from ${customer[0]?.company_name}: ${title}. ID: ${ticket.id.toString().slice(0, 8)}`,
                type: "ticket_created",
                relatedId: ticket.id,
              })
            }

            // Create notification
            await sql`
              INSERT INTO notifications (user_id, user_type, event_type, entity_type, entity_id, title, message, read)
              VALUES (
                ${agent[0].id},
                'team',
                'ticket_created',
                'ticket',
                ${ticket.id},
                ${"New Ticket from " + (customer[0]?.company_name || "Customer")},
                ${"Customer " + (customer[0]?.company_name || "Customer") + " created a new ticket: " + title},
                false
              )
            `
          }
        } catch (emailError) {
          console.error("[v0] Failed to send ticket notifications:", emailError)
        }
      }

      return NextResponse.json({ 
        ...ticket, 
        message: "Ticket created successfully" 
      }, { status: 201 })
    }
  } catch (error) {
    console.error("[v0] Error creating ticket:", error)
    return NextResponse.json({ message: "Error creating ticket" }, { status: 500 })
  }
}
