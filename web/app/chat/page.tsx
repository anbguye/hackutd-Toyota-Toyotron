"use client"

import { useState, useEffect } from "react"
import { useAtom, useAtomValue } from "jotai"
import { Send, User, Bot, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ToyotaHeader } from "@/components/layout/toyota-header"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { LogoutButton } from "@/components/auth/LogoutButton"
import { chatAtom, addMessageAtom, type ChatMessage } from "@/atoms/chatAtom"
import { preferencesAtom } from "@/atoms/preferencesAtom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function ChatPage() {
  const [messages, setMessages] = useAtom(chatAtom)
  const preferences = useAtomValue(preferencesAtom)
  const [, addMessage] = useAtom(addMessageAtom)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize with welcome message if chat is empty
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        role: "agent",
        content:
          "Hi! I'm your Toyota shopping companion. I can help you find the perfect Toyota vehicle based on your preferences. What are you looking for in your next car?",
        timestamp: new Date().toISOString(),
        suggestions: [
          "I need a family SUV",
          "Show me fuel-efficient options",
          "What's in my budget?",
        ],
      }
      addMessage(welcomeMessage)
    }
  }, [messages.length, addMessage])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setIsLoading(true)
    setError(null)

    // Add user message to chat
    const userMsg: ChatMessage = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    }
    addMessage(userMsg)

    try {
      // Prepare chat history for API (include the new user message)
      const chatHistory = [...messages, userMsg].map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      }))

      // Call API endpoint
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userMessage,
          preferences: preferences || undefined,
          chatHistory,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || "Failed to get response")
      }

      const data = await response.json()

      // Add agent response to chat
      const agentMsg: ChatMessage = {
        role: "agent",
        content: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
        carSuggestions: data.suggestions || [],
        suggestions: data.suggestions?.length
          ? ["Tell me more", "Compare options", "Schedule test drive"]
          : undefined,
      }
      addMessage(agentMsg)
    } catch (err: any) {
      console.error("[CHAT] Error sending message:", err)
      setError(err.message || "Failed to send message. Please try again.")

      // Add error message to chat
      const errorMsg: ChatMessage = {
        role: "agent",
        content: `I apologize, but I encountered an error: ${err.message || "Unknown error"}. Please try again.`,
        timestamp: new Date().toISOString(),
      }
      addMessage(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <RequireAuth>
      <div className="flex h-screen flex-col bg-background text-foreground">
        <ToyotaHeader
          navItems={[
            { label: "Browse", href: "/browse" },
            { label: "Compare", href: "/compare" },
            { label: "Test Drive", href: "/test-drive" },
          ]}
          actions={[
            { label: "Browse models", href: "/browse", variant: "secondary" },
          ]}
          rightSlot={<LogoutButton />}
          translucent={false}
        />

        <main className="flex-1">
          <div className="toyota-container flex h-full max-w-4xl flex-col py-8">
            <div className="mb-8 rounded-3xl border border-border/70 bg-card/70 px-6 py-5 backdrop-blur">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    Toyota agent live
                  </p>
                  <h2 className="text-lg font-semibold text-secondary">
                    Ask anything about Toyota pricing, trims, or ownership. Responses adapt to your quiz and browsing.
                  </h2>
                </div>
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden rounded-[2rem] border border-border/70 bg-card/60 backdrop-blur">
              <ScrollArea className="h-full p-8">
                <div className="space-y-6">
                  {messages.map((message, i) => {
                    const isUser = message.role === "user"
                    return (
                      <div key={i} className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}>
                        {!isUser && (
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Bot className="h-5 w-5" />
                          </div>
                        )}
                        <div className={`flex max-w-[82%] flex-col gap-3 ${isUser ? "items-end" : "items-start"}`}>
                          <div
                            className={`rounded-3xl px-6 py-4 text-sm leading-relaxed ${
                              isUser
                                ? "bg-primary text-primary-foreground shadow-[0_24px_48px_-32px_rgba(235,10,30,0.6)]"
                                : "border border-border/70 bg-background/90"
                            }`}
                          >
                            {message.content}
                          </div>
                          {message.suggestions && (
                            <div className="flex flex-wrap gap-2">
                              {message.suggestions.map((suggestion) => (
                                <Button
                                  key={suggestion}
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full border-border/60 text-xs font-semibold text-muted-foreground hover:border-primary/70 hover:text-primary"
                                  onClick={() => setInput(suggestion)}
                                  disabled={isLoading}
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          )}
                          {message.carSuggestions && message.carSuggestions.length > 0 && (
                            <div className="mt-4 space-y-3">
                              {message.carSuggestions.map((suggestion) => (
                                <Card
                                  key={suggestion.carId}
                                  className="border-border/60 hover:border-primary/70 transition-colors"
                                >
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold">
                                      {suggestion.name}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                      {suggestion.reasoning}
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent className="pt-0">
                                    <div className="flex gap-2">
                                      <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                      >
                                        <Link href={`/car/${suggestion.carId}`}>View Details</Link>
                                      </Button>
                                      <Button
                                        asChild
                                        variant="default"
                                        size="sm"
                                        className="flex-1"
                                      >
                                        <Link href={`/test-drive?car=${suggestion.carId}`}>
                                          Test Drive
                                        </Link>
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                        {isUser && (
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                            <User className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>

              <div className="border-t border-border/60 bg-background/80 px-6 py-4">
                {error && (
                  <div className="mb-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <div className="flex gap-3">
                  <Input
                    placeholder="Ask about Toyota models, deals, or ownership..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSend()}
                    className="h-12 flex-1 rounded-full border-border/70 bg-card/80 px-5"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSend}
                    size="icon"
                    disabled={isLoading || !input.trim()}
                    className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-[0_24px_48px_-32px_rgba(235,10,30,0.6)] hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Toyota Agent cross-checks real Toyota data—pricing, incentives, safety, and availability.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  )
}
