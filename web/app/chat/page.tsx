"use client";

import { useState } from "react"
import { Send, User, Bot, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RequireAuth } from "@/components/auth/RequireAuth"

type Message = {
  role: "user" | "agent"
  content: string
  suggestions?: string[]
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "agent",
      content:
        "Hi! I'm your Toyota shopping companion. Based on your preferences, I found some excellent matches for you. You're looking for an SUV around $35,000 for daily commutes with good fuel efficiency, right?",
      suggestions: ["Yes, that's right", "I want to adjust my budget", "Show me the options"],
    },
  ])
  const [input, setInput] = useState("")

  const handleSend = () => {
    if (!input.trim()) return

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: input },
      {
        role: "agent",
        content:
          "Great! Based on what you've told me, I recommend the 2025 Toyota RAV4 Hybrid. It's perfect for daily commuting with an impressive 41 MPG city, seats 5 comfortably, and falls within your budget at $36,000. Would you like to see a detailed breakdown of total costs including insurance and financing?",
        suggestions: ["Show me total costs", "Compare with other models", "Schedule a test drive"],
      },
    ]
    setMessages(newMessages)
    setInput("")
  }

  return (
    <RequireAuth>
      <div className="flex min-h-full flex-col bg-background text-foreground">
        <div className="flex-1">
          <div className="toyota-container flex h-full max-w-4xl flex-col py-6">
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
                                >
                                  {suggestion}
                                </Button>
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
                <div className="flex gap-3">
                  <Input
                    placeholder="Ask about Toyota models, deals, or ownership..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    className="h-12 flex-1 rounded-full border-border/70 bg-card/80 px-5"
                  />
                  <Button
                    onClick={handleSend}
                    size="icon"
                    className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-[0_24px_48px_-32px_rgba(235,10,30,0.6)] hover:bg-primary/90"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Toyota Agent cross-checks real Toyota data—pricing, incentives, safety, and availability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
