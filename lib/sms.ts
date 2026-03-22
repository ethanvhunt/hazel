import { sql } from "@/lib/db"

interface SendSMSParams {
  to: string
  message: string
  type: "ticket_created" | "ticket_approved" | "ticket_rejected" | "user_created" | "general"
  relatedId?: string
}

interface SMSResponse {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendSMS({ to, message, type, relatedId }: SendSMSParams): Promise<SMSResponse> {
  const apiKey = process.env.FAST2SMS_API_KEY

  // Clean phone number - remove spaces, dashes, and country code if present
  const cleanPhone = to.replace(/[\s-]/g, "").replace(/^\+91/, "")

  // Log the SMS attempt
  const logResult = await sql`
    INSERT INTO sms_logs (phone_number, message, sms_type, related_id, status)
    VALUES (${cleanPhone}, ${message}, ${type}, ${relatedId || null}, 'pending')
    RETURNING id
  `
  const logId = logResult[0]?.id

  // If no API key, log and return mock success
  if (!apiKey) {
    console.log(`[SMS Mock] To: ${cleanPhone}, Message: ${message}`)
    await sql`UPDATE sms_logs SET status = 'mock_sent' WHERE id = ${logId}`
    return { success: true, messageId: `mock-${logId}` }
  }

  try {
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({
        route: "q", // Quick SMS route
        message,
        language: "english",
        flash: 0,
        numbers: cleanPhone,
      }),
    })

    const data = await response.json()

    if (data.return === true) {
      await sql`
        UPDATE sms_logs 
        SET status = 'sent', provider_response = ${JSON.stringify(data)}, sent_at = NOW()
        WHERE id = ${logId}
      `
      return { success: true, messageId: data.request_id }
    } else {
      await sql`
        UPDATE sms_logs 
        SET status = 'failed', provider_response = ${JSON.stringify(data)}
        WHERE id = ${logId}
      `
      return { success: false, error: data.message || "Failed to send SMS" }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    await sql`
      UPDATE sms_logs 
      SET status = 'failed', provider_response = ${JSON.stringify({ error: errorMessage })}
      WHERE id = ${logId}
    `
    console.error("[SMS Error]", error)
    return { success: false, error: errorMessage }
  }
}

export function formatTicketCreatedSMS(ticketId: string, productName: string, customerName: string): string {
  return `New ticket #${ticketId} created for ${productName} by ${customerName}. Please review and approve.`
}

export function formatTicketApprovedSMS(ticketId: string, productName: string): string {
  return `Ticket #${ticketId} for ${productName} has been approved and is now assigned to the support team.`
}

export function formatTicketRejectedSMS(ticketId: string, reason: string): string {
  return `Ticket #${ticketId} has been rejected. Reason: ${reason}`
}

export function formatNewUserSMS(userName: string, tempPassword: string): string {
  return `Welcome ${userName}! Your account has been created. Temp password: ${tempPassword}. Please change it on first login.`
}
