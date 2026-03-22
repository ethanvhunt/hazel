import nodemailer from "nodemailer"

interface EmailOptions {
  to: string
  subject: string
  html: string
}

// Initialize transporter (configure with environment variables)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendTicketEmail(
  agentEmail: string,
  ticketTitle: string,
  ticketDescription: string,
  customerName: string,
  ticketId: string,
) {
  const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL}/team/tickets/${ticketId}`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Ticket Created</h2>
      <p>Hello,</p>
      <p>A new support ticket has been created for you.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>From:</strong> ${customerName}</p>
        <p><strong>Title:</strong> ${ticketTitle}</p>
        <p><strong>Description:</strong> ${ticketDescription}</p>
      </div>
      
      <p>
        <a href="${ticketUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Ticket
        </a>
      </p>
      
      <p>Best regards,<br>Support System</p>
    </div>
  `

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: agentEmail,
      subject: `New Ticket: ${ticketTitle}`,
      html,
    })
    console.log("[v0] Ticket email sent to:", agentEmail)
  } catch (error) {
    console.error("[v0] Error sending ticket email:", error)
    throw error
  }
}

export async function sendMessageEmail(
  agentEmail: string,
  senderName: string,
  message: string,
  ticketTitle: string,
  ticketId: string,
) {
  const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL}/team/tickets/${ticketId}`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Message on Ticket</h2>
      <p>Hello,</p>
      <p><strong>${senderName}</strong> replied to ticket: <strong>${ticketTitle}</strong></p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
        <p>${message}</p>
      </div>
      
      <p>
        <a href="${ticketUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Ticket
        </a>
      </p>
      
      <p>Best regards,<br>Support System</p>
    </div>
  `

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: agentEmail,
      subject: `Reply on: ${ticketTitle}`,
      html,
    })
    console.log("[v0] Message email sent to:", agentEmail)
  } catch (error) {
    console.error("[v0] Error sending message email:", error)
    throw error
  }
}
