import { connectToDatabase } from "@/lib/mongodb"
import { User, Ticket, CustomerAgentAssignment, Message, Customer } from "@/models"
import ExcelUpload from "@/models/ExcelUpload"
import { cookies } from "next/headers"

export async function GET() {
  try {
    await connectToDatabase()
    
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("team-session")

    if (!sessionCookie?.value) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(decodeURIComponent(sessionCookie.value))

    if (session.role !== "super_admin") {
      return Response.json({ error: "Forbidden: Only super admins can access reports" }, { status: 403 })
    }

    // Get all agents
    const agents = await User.find({
      role: { $in: ["agent", "manager", "super_admin"] },
    })
      .sort({ createdAt: -1 })
      .lean()

    // Get ticket counts per agent
    const ticketAggregation = await Ticket.aggregate([
      { $match: { agentId: { $ne: null } } },
      {
        $group: {
          _id: "$agentId",
          totalTickets: { $sum: 1 },
          openTickets: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
          inProgressTickets: { $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] } },
          resolvedTickets: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
        },
      },
    ])

    // Get client assignments per agent
    const clientAggregation = await CustomerAgentAssignment.aggregate([
      {
        $group: {
          _id: "$agentId",
          totalClients: { $addToSet: "$customerId" },
        },
      },
      {
        $project: {
          _id: 1,
          totalClients: { $size: "$totalClients" },
        },
      },
    ])

    // Get excel uploads per agent
    const excelAggregation = await ExcelUpload.aggregate([
      { $match: { uploadedBy: { $ne: null } } },
      {
        $group: {
          _id: "$uploadedBy",
          totalExcelUploads: { $sum: 1 },
        },
      },
    ])

    // Calculate average response time per agent
    const responseTimeAggregation = await Ticket.aggregate([
      { $match: { agentId: { $ne: null } } },
      {
        $lookup: {
          from: "messages",
          let: { ticketId: "$_id", agentId: "$agentId", ticketCreated: "$createdAt" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$ticketId", "$$ticketId"] },
                    { $eq: ["$senderId", "$$agentId"] },
                    { $eq: ["$senderType", "agent"] },
                  ],
                },
              },
            },
            { $sort: { createdAt: 1 } },
            { $limit: 1 },
          ],
          as: "firstAgentMessage",
        },
      },
      { $unwind: { path: "$firstAgentMessage", preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: "$agentId",
          avgResponseTimeHours: {
            $avg: {
              $divide: [
                { $subtract: ["$firstAgentMessage.createdAt", "$createdAt"] },
                1000 * 60 * 60,
              ],
            },
          },
        },
      },
    ])

    // Combine agent data with metrics
    const agentMetrics = agents.map((agent: any) => {
      const tickets = ticketAggregation.find((t) => t._id?.toString() === agent._id.toString()) || {
        totalTickets: 0,
        openTickets: 0,
        inProgressTickets: 0,
        resolvedTickets: 0,
      }
      const clients = clientAggregation.find((c) => c._id?.toString() === agent._id.toString()) || {
        totalClients: 0,
      }
      const excel = excelAggregation.find((e) => e._id?.toString() === agent._id.toString()) || {
        totalExcelUploads: 0,
      }
      const response = responseTimeAggregation.find((r) => r._id?.toString() === agent._id.toString()) || {
        avgResponseTimeHours: 0,
      }

      return {
        id: agent._id,
        fullName: agent.fullName,
        email: agent.email,
        gmailAddress: agent.gmailAddress,
        role: agent.role,
        createdAt: agent.createdAt,
        ...tickets,
        ...clients,
        ...excel,
        avgResponseTimeHours: Number((response.avgResponseTimeHours || 0).toFixed(2)),
      }
    })

    // Get detailed agent-client information
    const assignments = await CustomerAgentAssignment.find()
      .populate("agentId", "fullName")
      .populate("customerId", "companyName contactPerson email")
      .lean()

    const agentClientDetails = await Promise.all(
      assignments.map(async (assignment: any) => {
        const tickets = await Ticket.find({
          customerId: assignment.customerId._id,
          agentId: assignment.agentId._id,
        }).lean()

        const excelCount = await ExcelUpload.countDocuments({
          uploadedBy: assignment.agentId._id,
          customerId: assignment.customerId._id,
        })

        const lastMessage = await Message.findOne({
          ticketId: { $in: tickets.map((t: any) => t._id) },
        })
          .sort({ createdAt: -1 })
          .lean()

        return {
          agentId: assignment.agentId._id,
          agentName: assignment.agentId.fullName,
          customerId: assignment.customerId._id,
          companyName: assignment.customerId.companyName,
          contactPerson: assignment.customerId.contactPerson,
          customerEmail: assignment.customerId.email,
          ticketsCount: tickets.length,
          resolvedCount: tickets.filter((t: any) => t.status === "resolved").length,
          inProgressCount: tickets.filter((t: any) => t.status === "in_progress").length,
          openCount: tickets.filter((t: any) => t.status === "open").length,
          excelFilesCount: excelCount,
          lastMessageTime: lastMessage?.createdAt || null,
        }
      })
    )

    // Calculate summary statistics
    const totalTickets = agentMetrics.reduce((sum, agent) => sum + (agent.totalTickets || 0), 0)
    const totalResolvedTickets = agentMetrics.reduce((sum, agent) => sum + (agent.resolvedTickets || 0), 0)
    const totalOpenTickets = agentMetrics.reduce((sum, agent) => sum + (agent.openTickets || 0), 0)
    const totalInProgressTickets = agentMetrics.reduce((sum, agent) => sum + (agent.inProgressTickets || 0), 0)
    const avgResponseTimeAcrossAgents =
      agentMetrics.reduce((sum, agent) => sum + (agent.avgResponseTimeHours || 0), 0) /
      Math.max(agentMetrics.length, 1)

    const uniqueCustomerIds = [...new Set(agentClientDetails.map((item) => item.customerId.toString()))]

    return Response.json({
      agentMetrics,
      agentClientDetails,
      summary: {
        totalAgents: agentMetrics.length,
        totalTickets,
        totalResolvedTickets,
        totalOpenTickets,
        totalInProgressTickets,
        totalClients: uniqueCustomerIds.length,
        avgResponseTimeHours: Number(avgResponseTimeAcrossAgents.toFixed(2)),
      },
    })
  } catch (error) {
    console.error("Error fetching agent performance metrics:", error)
    return Response.json(
      { error: "Failed to fetch agent performance metrics", details: String(error) },
      { status: 500 }
    )
  }
}
