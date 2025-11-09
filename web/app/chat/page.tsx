"use client";

import { useState, useEffect, useRef } from "react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { Send, User, Bot, Sparkles, Loader2, Phone, Calendar, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { CarRecommendations } from "@/components/chat/CarRecommendations";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { VoiceButton } from "@/components/chat/VoiceButton";
import { AgentWorkflow } from "@/components/chat/AgentWorkflow";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { SpeechRecognitionManager } from "@/lib/voice/speechRecognition";
import { SpeechSynthesisManager } from "@/lib/voice/speechSynthesis";
import { SilenceDetector } from "@/lib/voice/silenceDetector";
import { toast } from "sonner";

type DisplayMessage = {
  id?: string;
  role: "user" | "agent";
  content: string;
  suggestions?: string[];
  parts?: Array<{ type: string; [key: string]: any }>;
  hasToolParts?: boolean;
};

type UserPreferences = {
  budget_min: number | null;
  budget_max: number | null;
  car_types: string[] | null;
  seats: number | null;
  mpg_priority: string | null;
  use_case: string | null;
};

function formatBudget(min: number | null, max: number | null): string {
  if (!min && !max) return "your budget";
  if (min && max) {
    const minFormatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(min);
    const maxFormatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(max);
    return `${minFormatted} to ${maxFormatted}`;
  }
  if (max) {
    const maxFormatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(max);
    return `up to ${maxFormatted}`;
  }
  return "your budget";
}

function formatCarTypes(carTypes: string[] | null): string {
  if (!carTypes || carTypes.length === 0) return "any type of vehicle";
  if (carTypes.length === 1) {
    const type = carTypes[0];
    return type === "suv" ? "an SUV" : type === "sedan" ? "a sedan" : type === "truck" ? "a truck" : type === "hybrid" ? "a hybrid" : `a ${type}`;
  }
  return carTypes.join(", ");
}

function formatUseCase(useCase: string | null): string {
  if (!useCase) return "your needs";
  const useCaseMap: Record<string, string> = {
    commute: "daily commutes",
    family: "family trips",
    adventure: "adventures",
    business: "business use",
  };
  return useCaseMap[useCase] || useCase;
}

function generateInitialMessage(preferences: UserPreferences | null): DisplayMessage {
  if (!preferences) {
    return {
  role: "agent",
      content: "Hi! I'm your Toyota shopping companion. I can help you find the perfect Toyota vehicle based on your preferences. What are you looking for today?",
      suggestions: ["Find my perfect Toyota", "Show me SUVs", "What's my best match?"],
    };
  }

  const budget = formatBudget(preferences.budget_min, preferences.budget_max);
  const carType = formatCarTypes(preferences.car_types);
  const useCase = formatUseCase(preferences.use_case);
  const seats = preferences.seats ? `${preferences.seats} seats` : null;
  
  let content = `Hi! I'm your Toyota shopping companion. `;
  
  // Build personalized message based on available preferences
  const parts: string[] = [];
  if (preferences.budget_max) {
    parts.push(`a budget around ${budget}`);
  }
  if (preferences.car_types && preferences.car_types.length > 0) {
    parts.push(`looking for ${carType}`);
  }
  if (seats) {
    parts.push(`need ${seats}`);
  }
  if (preferences.use_case) {
    parts.push(`for ${useCase}`);
  }
  if (preferences.mpg_priority === "high") {
    parts.push("with excellent fuel efficiency");
  } else if (preferences.mpg_priority === "medium") {
    parts.push("with good fuel efficiency");
  }

  if (parts.length > 0) {
    content += `Based on your preferences, I can help you find the perfect match. `;
    if (parts.length === 1) {
      content += `You're looking for ${parts[0]}, right?`;
    } else if (parts.length === 2) {
      content += `You're looking for ${parts[0]} and ${parts[1]}, right?`;
    } else {
      const lastPart = parts[parts.length - 1];
      const otherParts = parts.slice(0, -1);
      content += `You're looking for ${otherParts.join(", ")}, and ${lastPart}, right?`;
    }
  } else {
    content += `I'm here to help you find the perfect Toyota vehicle. What are you looking for today?`;
  }

  return {
    role: "agent",
    content,
    suggestions: ["Let's find my Toyota", "Show me matches", "I want to explore"],
};
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [initialMessage, setInitialMessage] = useState<DisplayMessage | null>(null);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const authTokenRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice mode state
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [agentWorkflowSteps, setAgentWorkflowSteps] = useState<Array<{ name: string; description: string; status: "pending" | "active" | "completed" }> | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionManager | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisManager | null>(null);
  const silenceDetectorRef = useRef<SilenceDetector | null>(null);
  const lastSpokenMessageIdRef = useRef<string | null>(null);
  const voiceMessageBufferRef = useRef<string>("");
  const streamingTextRef = useRef<string>("");
  const lastProcessedMessageIdRef = useRef<string | null>(null);

  // Get auth token from Supabase session and load preferences
  // Initialize voice managers
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      speechRecognitionRef.current = new SpeechRecognitionManager();
    } catch (error) {
      console.error("[ChatPage] Failed to initialize speech recognition:", error);
    }

    try {
      speechSynthesisRef.current = new SpeechSynthesisManager();
    } catch (error) {
      console.error("[ChatPage] Failed to initialize speech synthesis:", error);
    }

    // Initialize silence detector (callback will be set up in handleVoiceToggle)
    // We'll create it with a placeholder callback that gets updated

    return () => {
      // Cleanup
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.abort();
      }
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
      if (silenceDetectorRef.current) {
        silenceDetectorRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const getAuthTokenAndPreferences = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        authTokenRef.current = session.access_token;
      }

      // Load preferences for initial message
      if (session?.user) {
        try {
          const { data: preferences, error } = await supabase
            .from("user_preferences")
            .select("budget_min, budget_max, car_types, seats, mpg_priority, use_case")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (mounted) {
            if (error && error.code !== "PGRST116") {
              console.error("Failed to load preferences:", error);
            }
            setInitialMessage(generateInitialMessage(preferences));
            setLoadingPreferences(false);
          }
        } catch (error) {
          console.error("Error loading preferences:", error);
          if (mounted) {
            setInitialMessage(generateInitialMessage(null));
            setLoadingPreferences(false);
          }
        }
      } else {
        if (mounted) {
          setInitialMessage(generateInitialMessage(null));
          setLoadingPreferences(false);
        }
      }
    };

    getAuthTokenAndPreferences();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authTokenRef.current = session?.access_token ?? null;
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const { messages: chatMessages, sendMessage, status, error } = useChat({
    id: "toyota-agent-chat",
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: (url, options) => {
        const headers = new Headers(options?.headers);
        if (authTokenRef.current) {
          headers.set("Authorization", `Bearer ${authTokenRef.current}`);
        }
        return fetch(url, {
          ...options,
          headers,
          credentials: "include",
        });
      },
    }),
  });

  const isStreaming = status === "streaming" || status === "submitted";

  // Check if the last assistant message has tool calls in progress
  const lastAssistantMessage = chatMessages.filter((m) => m.role === "assistant").at(-1);
  const hasActiveToolCalls =
    lastAssistantMessage?.parts.some(
      (part) =>
        (part.type === "tool-displayCarRecommendations" || part.type === "tool-searchToyotaTrims") &&
        part.state === "input-available"
    ) ?? false;

  const aiMessages: DisplayMessage[] = chatMessages.map((message) => {
    // Extract text parts and deduplicate them within the same message
    const textPartsArray = message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text || "")
      .filter((text) => text.trim().length > 0);
    
    // Remove duplicate consecutive text parts
    const uniqueTextParts: string[] = [];
    textPartsArray.forEach((text) => {
      if (uniqueTextParts.length === 0 || uniqueTextParts[uniqueTextParts.length - 1] !== text.trim()) {
        uniqueTextParts.push(text.trim());
      }
    });
    
    let textParts = uniqueTextParts.join(" ").trim();

    // Filter out tool-like JSON blocks that the LLM might output as text
    // Remove <displayCarRecommendations>...</displayCarRecommendations> blocks
    textParts = textParts.replace(/<displayCarRecommendations>[\s\S]*?<\/displayCarRecommendations>/gi, "");
    // Remove JSON code blocks that look like tool outputs
    textParts = textParts.replace(/```json\s*\{[\s\S]*?"items"[\s\S]*?\}\s*```/gi, "");
    // Remove any standalone JSON objects that look like tool outputs
    textParts = textParts.replace(/\{[\s\S]*?"trim_id"[\s\S]*?"image_url"[\s\S]*?\}/g, "");
    textParts = textParts.trim();

    const hasToolParts = message.parts.some(
      (part) => part.type === "tool-displayCarRecommendations" || part.type === "tool-searchToyotaTrims"
    );

    return {
      id: message.id,
      role: message.role === "user" ? "user" : "agent",
      content: textParts,
      parts: message.parts,
      hasToolParts,
      suggestions: undefined, // Explicitly set to undefined to match DisplayMessage type
    };
  });

  // Deduplicate messages: filter out consecutive messages with identical content
  const deduplicatedMessages = aiMessages.filter((message, index, array) => {
    // Always keep user messages
    if (message.role === "user") return true;
    
    // For agent messages, check if the previous message has the same content
    const previousMessage = array[index - 1];
    if (previousMessage && previousMessage.role === "agent" && previousMessage.content === message.content) {
      return false; // Skip duplicate
    }
    
    return true;
  });

  const displayMessages = initialMessage ? [initialMessage, ...deduplicatedMessages] : deduplicatedMessages;

  // Check if we should show typing indicator
  // Show when: streaming, no active tool calls, and either:
  // - last message is from user (waiting for bot to start), OR
  // - last assistant message has no content yet (bot is still processing)
  const lastDisplayMessage = displayMessages[displayMessages.length - 1];
  const lastDisplayAssistantMessage = displayMessages.filter((m) => m.role === "agent").at(-1);
  const isWaitingForBotResponse =
    isStreaming &&
    !hasActiveToolCalls &&
    (lastDisplayMessage?.role === "user" || (lastDisplayAssistantMessage && !lastDisplayAssistantMessage.content.trim()));

  // Auto-scroll to bottom when messages change or typing indicator appears
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [displayMessages, isWaitingForBotResponse]);

  const handleSend = async () => {
    const messageToSend = input.trim();
    if (!messageToSend || isStreaming) {
      return;
    }

    // Clear input immediately for better UX
    setInput("");

    try {
      await sendMessage({
        parts: [{ type: "text", text: messageToSend }],
      });
    } catch (sendError) {
      console.error("Failed to send message", sendError);
      // Optionally restore the input if sending failed
      // setInput(messageToSend);
    }
  };

  // Handle voice input - true voice mode with Web Audio API silence detection
  const handleVoiceToggle = async () => {
    if (!speechRecognitionRef.current) {
      toast.error("Voice recognition is not supported in this browser");
      return;
    }

    if (isListening) {
      // Stop listening and send final message
      speechRecognitionRef.current.stop();
      silenceDetectorRef.current?.stop();
      setIsListening(false);
      
      // Send accumulated message if any
      if (voiceMessageBufferRef.current.trim()) {
        void sendMessage({
          parts: [{ type: "text", text: voiceMessageBufferRef.current.trim() }],
        });
        voiceMessageBufferRef.current = "";
      }
      
      setIsVoiceMode(false);
    } else {
      // Start continuous listening with silence detection
      setIsVoiceMode(true);
      setIsListening(true);
      voiceMessageBufferRef.current = "";
      
      // Cancel any ongoing speech
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
        setIsSpeaking(false);
      }

      // Start Web Audio API silence detection
      try {
        // Stop existing detector if any
        if (silenceDetectorRef.current) {
          silenceDetectorRef.current.stop();
        }
        
        // Create new silence detector with callback that has access to current state
        silenceDetectorRef.current = new SilenceDetector(
          () => {
            // Silence detected - auto-send message
            if (voiceMessageBufferRef.current.trim()) {
              speechRecognitionRef.current?.stop();
              silenceDetectorRef.current?.stop();
              void sendMessage({
                parts: [{ type: "text", text: voiceMessageBufferRef.current.trim() }],
              });
              voiceMessageBufferRef.current = "";
              setIsListening(false);
              setIsVoiceMode(false);
            }
          },
          () => {
            // Audio detected - user is speaking, reset silence timer
            // This is handled automatically by SilenceDetector
          }
        );
        
        if (silenceDetectorRef.current.getSupported()) {
          await silenceDetectorRef.current.start();
        }
      } catch (error) {
        console.warn("[ChatPage] Silence detection not available:", error);
        // Continue without silence detection - user can manually stop
      }

      speechRecognitionRef.current.start({
        onStart: () => {
          setIsListening(true);
        },
        onResult: (text, isFinal) => {
          if (isFinal) {
            // Final result - add to buffer
            voiceMessageBufferRef.current += text + " ";
            // Silence detector will handle auto-send after 2 seconds of silence
          } else {
            // Interim result - could show in UI for feedback
            // For now, we'll wait for final results
          }
        },
        onError: (error) => {
          setIsListening(false);
          setIsVoiceMode(false);
          voiceMessageBufferRef.current = "";
          silenceDetectorRef.current?.stop();
          toast.error(error);
        },
        onEnd: () => {
          setIsListening(false);
          silenceDetectorRef.current?.stop();
          // Don't disable voice mode on end - allow re-starting
        },
      });
    }
  };

  // Handle voice output - stream speech as text arrives (true voice mode)
  useEffect(() => {
    if (!speechSynthesisRef.current || !isVoiceMode) {
      return;
    }

    const lastAssistantMessage = displayMessages
      .filter((m) => m.role === "agent")
      .at(-1);

    if (!lastAssistantMessage || !lastAssistantMessage.content) {
      return;
    }

    // Skip if we've already processed this message
    if (lastAssistantMessage.id === lastSpokenMessageIdRef.current) {
      return;
    }

    // Extract plain text from markdown for speech
    const currentText = lastAssistantMessage.content
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
      .replace(/\*(.*?)\*/g, "$1") // Remove italic
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Remove links
      .replace(/#{1,6}\s+/g, "") // Remove headers
      .replace(/```[\s\S]*?```/g, "") // Remove code blocks
      .replace(/`([^`]+)`/g, "$1") // Remove inline code
      .trim();

    if (!currentText) {
      return;
    }

    // If streaming, speak new chunks as they arrive
    if (isStreaming) {
      const previousText = streamingTextRef.current;
      if (currentText.length > previousText.length) {
        // New text arrived - speak the new chunk
        const newChunk = currentText.slice(previousText.length);
        if (newChunk.trim().length > 0) {
          // Only speak if we have a complete sentence or significant chunk
          const words = newChunk.trim().split(/\s+/);
          if (words.length >= 3 || newChunk.includes(".") || newChunk.includes("!")) {
            setIsSpeaking(true);
            speechSynthesisRef.current.speak(newChunk.trim(), {
              priority: "normal",
            });
          }
        }
        streamingTextRef.current = currentText;
      }
    } else {
      // Streaming complete - speak remaining text if any
      const remainingText = currentText.slice(streamingTextRef.current.length);
      if (remainingText.trim().length > 0) {
        setIsSpeaking(true);
        speechSynthesisRef.current.speak(remainingText.trim(), {
          priority: "normal",
        });
      }
      
      // Mark message as spoken
      lastSpokenMessageIdRef.current = lastAssistantMessage.id ?? null;
      streamingTextRef.current = "";
      
      // Reset speaking state after delay
      const speakTimeout = setTimeout(() => {
        setIsSpeaking(false);
      }, Math.max(1000, currentText.length * 50));

      return () => clearTimeout(speakTimeout);
    }
  }, [displayMessages, isVoiceMode, isStreaming]);

  // Update agent workflow steps based on tool states in messages
  useEffect(() => {
    const lastMessage = displayMessages[displayMessages.length - 1];
    if (!lastMessage) {
      return;
    }

    // Skip if we've already processed this message
    if (lastMessage.id === lastProcessedMessageIdRef.current) {
      return;
    }

    // Only process agent messages with tool parts
    if (lastMessage.role === "user" || !lastMessage.parts) {
      // Clear workflow if no active tool calls
      if (agentWorkflowSteps && lastMessage.role === "user") {
        setAgentWorkflowSteps(null);
        lastProcessedMessageIdRef.current = lastMessage.id;
      }
      return;
    }

    const parts = lastMessage.parts;
    
    // Check for searchToyotaTrims tool
    const searchPart = parts.find((p: any) => p.type === "tool-searchToyotaTrims");
    if (searchPart) {
      if (searchPart.state === "input-available") {
        setAgentWorkflowSteps([
          { name: "Intent Agent", description: "Understanding your request", status: "completed" },
          { name: "Vehicle Agent", description: "Searching Toyota database", status: "active" },
          { name: "Finance Agent", description: "Calculating financing options", status: "pending" },
          { name: "Report Agent", description: "Preparing recommendations", status: "pending" },
        ]);
        lastProcessedMessageIdRef.current = lastMessage.id;
        return;
      } else if (searchPart.state === "output-available") {
        setAgentWorkflowSteps([
          { name: "Intent Agent", description: "Understanding your request", status: "completed" },
          { name: "Vehicle Agent", description: "Searching Toyota database", status: "completed" },
          { name: "Finance Agent", description: "Calculating financing options", status: "active" },
          { name: "Report Agent", description: "Preparing recommendations", status: "pending" },
        ]);
        lastProcessedMessageIdRef.current = lastMessage.id;
        return;
      }
    }

    // Check for displayCarRecommendations tool
    const displayPart = parts.find((p: any) => p.type === "tool-displayCarRecommendations");
    if (displayPart) {
      if (displayPart.state === "input-available") {
        setAgentWorkflowSteps([
          { name: "Intent Agent", description: "Understanding your request", status: "completed" },
          { name: "Vehicle Agent", description: "Searching Toyota database", status: "completed" },
          { name: "Finance Agent", description: "Calculating financing options", status: "completed" },
          { name: "Report Agent", description: "Preparing recommendations", status: "active" },
        ]);
        lastProcessedMessageIdRef.current = lastMessage.id;
        return;
      } else if (displayPart.state === "output-available") {
        setAgentWorkflowSteps([
          { name: "Intent Agent", description: "Understanding your request", status: "completed" },
          { name: "Vehicle Agent", description: "Searching Toyota database", status: "completed" },
          { name: "Finance Agent", description: "Calculating financing options", status: "completed" },
          { name: "Report Agent", description: "Preparing recommendations", status: "completed" },
        ]);
        lastProcessedMessageIdRef.current = lastMessage.id;
        // Clear after delay
        setTimeout(() => setAgentWorkflowSteps(null), 3000);
        return;
      }
    }
  }, [displayMessages]);

  return (
    <RequireAuth>
      <div className="flex h-[calc(100vh-var(--header-h,80px))] flex-col bg-background text-foreground overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="toyota-container flex flex-col h-full max-w-4xl mx-auto w-full py-6 px-4 overflow-hidden">
            {/* Fixed header section */}
            <div className="mb-6 space-y-4 flex-shrink-0">
              <div className="rounded-3xl border border-border/70 bg-card/70 px-6 py-5 backdrop-blur">
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
              
              {/* Retell Voice Call Section */}
              <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 px-6 py-5 backdrop-blur">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/20 p-3 text-primary">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                      Prefer to talk?
                    </p>
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-secondary">
                        Chat or CALL our agent
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Call <a href="tel:1-800-TOYOTA" className="font-semibold text-primary hover:underline">1-800-TOYOTA</a> to speak with our voice agent powered by Retell. Ask about vehicles, get financing options, or schedule a test drive—all through natural conversation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable chat container with fixed height */}
            <div className="relative flex-1 min-h-0 flex flex-col rounded-4xl border border-border/70 bg-card/60 backdrop-blur">
              <div className="flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-8 space-y-6">
                  {/* Persistent Agent Workflow Display */}
                  {agentWorkflowSteps && (
                    <div className="mb-4">
                      <AgentWorkflow steps={agentWorkflowSteps} />
                    </div>
                  )}
                  {loadingPreferences && (
                    <div className="flex gap-4 justify-start items-center">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div className="flex max-w-[82%] flex-col gap-3 items-start">
                        <div className="rounded-3xl border border-border/70 bg-background/90 px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Loading your preferences...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {displayMessages.map((message, i) => {
                    const isUser = message.role === "user";
                    const isLastMessage = i === displayMessages.length - 1;
                    const showBotIcon = !isUser && (message.content || message.parts?.length) && !(isLastMessage && isWaitingForBotResponse);
                    return (
                      <div key={message.id ?? i} className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}>
                        {showBotIcon && (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Bot className="h-5 w-5" />
                          </div>
                        )}
                        {!isUser && !showBotIcon && (
                          <div className="flex h-10 w-10 shrink-0" />
                        )}
                        <div className={`flex max-w-[82%] flex-col gap-3 ${isUser ? "items-end" : "items-start"}`}>
                          {message.content && (
                            <div
                              className={`rounded-3xl px-6 py-4 text-sm leading-relaxed prose prose-sm max-w-none ${
                                isUser
                                  ? "bg-primary text-primary-foreground shadow-[0_24px_48px_-32px_rgba(235,10,30,0.6)]"
                                  : "border border-border/70 bg-background/90"
                              }`}
                            >
                              {isUser ? (
                                message.content
                              ) : (
                                <MemoizedMarkdown content={message.content} id={message.id ?? `msg-${i}`} />
                              )}
                            </div>
                          )}
                          {message.parts && !isUser && (
                            <div className="w-full space-y-4">
                              {message.parts.map((part, partIndex) => {
                                // Handle searchToyotaTrims tool
                                if (part.type === "tool-searchToyotaTrims") {
                                  switch (part.state) {
                                    case "input-available":
                                      return (
                                        <div key={partIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                          <span>Searching for cars...</span>
                                        </div>
                                      );
                                    case "output-available":
                                      // Search completed, but we don't display the results here
                                      // The LLM will call displayCarRecommendations with selected items
                                      return null;
                                    case "output-error":
                                      return (
                                        <div key={partIndex} className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                                          <p className="font-semibold">Error searching for cars</p>
                                          <p className="mt-1 text-xs">{part.errorText || "Unknown error"}</p>
                                        </div>
                                      );
                                    default:
                                      return null;
                                  }
                                }

                                // Handle displayCarRecommendations tool
                                if (part.type === "tool-displayCarRecommendations") {
                                  switch (part.state) {
                                    case "input-available":
                                      return (
                                        <div key={partIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                          <span>Loading car recommendations...</span>
                                        </div>
                                      );
                                    case "output-available":
                                      if (part.output?.items) {
                                        return (
                                          <div key={partIndex} className="w-full">
                                            <CarRecommendations items={part.output.items} />
                                          </div>
                                        );
                                      }
                                      return null;
                                    case "output-error":
                                      const errorMsg = part.errorText || "Unknown error";
                                      const isValidationError = errorMsg.includes("validation") || errorMsg.includes("Required") || errorMsg.includes("items");
                                      return (
                                        <div key={partIndex} className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                                          <p className="font-semibold">Error loading car recommendations</p>
                                          <p className="mt-1 text-xs">{errorMsg}</p>
                                          {isValidationError && (
                                            <p className="mt-2 text-xs text-muted-foreground">
                                              The assistant needs to first search for cars, then select items from the results to display.
                                            </p>
                                          )}
                                        </div>
                                      );
                                    default:
                                      return null;
                                  }
                                }

                                // Handle scheduleTestDrive tool
                                if (part.type === "tool-scheduleTestDrive") {
                                  switch (part.state) {
                                    case "input-available":
                                      return (
                                        <div key={partIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                          <span>Scheduling test drive...</span>
                                        </div>
                                      );
                                    case "output-available":
                                      const output = part.output as any;
                                      if (output?.success) {
                                        return (
                                          <div key={partIndex} className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
                                            <div className="flex items-start gap-3">
                                              <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                              <div className="flex-1 space-y-2">
                                                <p className="font-semibold text-secondary">Test drive scheduled!</p>
                                                {output.details && (
                                                  <div className="space-y-1 text-xs text-muted-foreground">
                                                    <p><span className="font-medium">Vehicle:</span> {output.details.vehicle}</p>
                                                    <p><span className="font-medium">Date:</span> {output.details.date}</p>
                                                    <p><span className="font-medium">Time:</span> {output.details.time}</p>
                                                    <p><span className="font-medium">Location:</span> {output.details.location}</p>
                                                  </div>
                                                )}
                                                {output.link && (
                                                  <Link href={output.link} className="inline-flex items-center gap-2 mt-3 text-xs font-semibold text-primary hover:underline">
                                                    <Calendar className="h-4 w-4" />
                                                    View test drive details
                                                  </Link>
                                                )}
                                                <p className="text-xs text-muted-foreground mt-2">You'll receive a confirmation email shortly.</p>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      } else {
                                        return (
                                          <div key={partIndex} className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                                            <p className="font-semibold">Error scheduling test drive</p>
                                            <p className="mt-1 text-xs">{output?.error || "Unknown error"}</p>
                                            {output?.link && (
                                              <Link href={output.link} className="mt-2 inline-block text-xs underline">
                                                Sign in to continue
                                              </Link>
                                            )}
                                          </div>
                                        );
                                      }
                                    case "output-error":
                                      return (
                                        <div key={partIndex} className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                                          <p className="font-semibold">Error scheduling test drive</p>
                                          <p className="mt-1 text-xs">{part.errorText || "Unknown error"}</p>
                                        </div>
                                      );
                                    default:
                                      return null;
                                  }
                                }
                                return null;
                              })}
                            </div>
                          )}
                          {/* Show loading indicator if streaming and no content yet, or if there are active tool calls */}
                          {!isUser && isStreaming && !message.content && !message.parts?.length && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Thinking...</span>
                            </div>
                          )}
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
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                            <User className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Show typing indicator when bot is processing and waiting for response */}
                  {isWaitingForBotResponse && (
                    <TypingIndicator />
                  )}
                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>

              {/* Fixed input section at bottom */}
              <div className="border-t border-border/60 bg-background/80 px-6 py-4 flex-shrink-0">
                <div className="flex gap-3">
                  <Input
                    placeholder="Ask about Toyota models, deals, or ownership..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                    disabled={isListening}
                    className="h-12 flex-1 rounded-full border-border/70 bg-card/80 px-5 disabled:opacity-60"
                  />
                  <VoiceButton
                    isListening={isListening}
                    isProcessing={isStreaming}
                    isSpeaking={isSpeaking}
                    isSupported={speechRecognitionRef.current?.getSupported() ?? false}
                    onClick={handleVoiceToggle}
                  />
                  <Button
                    onClick={() => {
                      void handleSend();
                    }}
                    size="icon"
                    disabled={isStreaming || isListening}
                    className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-[0_24px_48px_-32px_rgba(235,10,30,0.6)] hover:bg-primary/90 disabled:opacity-60"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
                {error && (
                  <p className="mt-3 text-center text-xs text-destructive">
                    Something went wrong. Please try again.
                  </p>
                )}
                {!error && (
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Toyota Agent cross-checks real Toyota data—pricing, incentives, safety, and availability.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
