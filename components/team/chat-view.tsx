"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Send } from "lucide-react"

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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 2000)
    return () => clearInterval(interval)
  }, [ticketId])

  // users can now scroll freely in the chat popup

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages?ticketId=${ticketId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      }
    } catch (error) {
      toast.error("Failed to send message")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-muted/50">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No messages yet</p>
          ) : (
            messages.map((msg) => (
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
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <Button onClick={handleSendMessage} disabled={loading} size="icon">
            <Send size={20} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
