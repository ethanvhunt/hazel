"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Send, Loader2 } from "lucide-react"

export function ChatView({
  ticketId,
  senderType,
  senderId,
}: {
  ticketId: string
  senderType: "agent" | "customer"
  senderId: string
}) {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 2000)
    return () => clearInterval(interval)
  }, [ticketId])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages?ticketId=${ticketId}`, {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    setSending(true)
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ticketId,
          senderType,
          senderId,
          message: newMessage,
        }),
      })

      if (response.ok) {
        setNewMessage("")
        fetchMessages()
        toast.success("Message sent")
      } else {
        toast.error("Failed to send message")
      }
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Support Chat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-muted/50 flex flex-col">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 m-auto">No messages yet</p>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-4 flex ${msg.sender_type === senderType ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-4 py-2 rounded-lg max-w-xs ${
                      msg.sender_type === senderType ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-800"
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs mt-1 opacity-70">{new Date(msg.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => e.key === "Enter" && !sending && handleSendMessage()}
            disabled={sending}
          />
          <Button onClick={handleSendMessage} disabled={sending} size="icon">
            {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
