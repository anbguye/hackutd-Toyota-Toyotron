"use client";

import { useState, useEffect, useRef } from "react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { Send, User, Bot, Sparkles, Loader2, Phone, Calendar, CheckCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

// Bucket used for storing trade-in photos. Must exist in Supabase Storage.
// Prefer an environment variable, fallback to a sensible default.
const TRADEIN_BUCKET =
  (process.env.NEXT_PUBLIC_SUPABASE_TRADEIN_BUCKET as string | undefined) ||
  "trade-ins";

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
  
  // Trade-in dialog state
  const [tradeInDialogOpen, setTradeInDialogOpen] = useState(false);
  const [tradeInVin, setTradeInVin] = useState("");
  const [tradeInImageUrl, setTradeInImageUrl] = useState("");
  const [tradeInLoading, setTradeInLoading] = useState(false);
  const [tradeInUploading, setTradeInUploading] = useState(false);
  const [tradeInResult, setTradeInResult] = useState<{
    id: string;
    timestamp: number;
    messageIndex: number; // Index in deduplicatedMessages when trade-in was generated
    attached: boolean; // Whether the trade-in data has been attached to a message
    estimateUsd: number;
    details: {
      make: string;
      model: string;
      modelYear: number;
      trim?: string;
      conditionScore?: number | null;
    };
  } | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionManager | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisManager | null>(null);
  const silenceDetectorRef = useRef<SilenceDetector | null>(null);
  const lastSpokenMessageIdRef = useRef<string | null>(null);
  const voiceMessageBufferRef = useRef<string>("");
  const streamingTextRef = useRef<string>("");

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
    // Remove trade-in metadata that was silently attached to user messages
    textParts = textParts.replace(/\n\n\[Trade-in estimate:[\s\S]*?\]/gi, "");
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

  // Insert trade-in card at the correct position (before messages sent after it was generated)
  let displayMessages: DisplayMessage[];
  if (tradeInResult) {
    const tradeInMessage: DisplayMessage = {
      id: tradeInResult.id,
      role: "agent",
      content: "",
      parts: [{
        type: "tool-estimateTradeIn",
        state: "output-available",
        output: {
          estimateUsd: tradeInResult.estimateUsd,
          details: tradeInResult.details,
        },
      }],
    };

    // Insert trade-in message at the position it was generated
    // messageIndex is the index in chatMessages when trade-in was generated
    // We need to insert it after that position in deduplicatedMessages
    // Since deduplicatedMessages may have fewer messages, we insert at the end if index is out of bounds
    const insertIndex = Math.min(tradeInResult.messageIndex + 1, deduplicatedMessages.length);
    const messagesBefore = deduplicatedMessages.slice(0, insertIndex);
    const messagesAfter = deduplicatedMessages.slice(insertIndex);
    
    displayMessages = initialMessage 
      ? [initialMessage, ...messagesBefore, tradeInMessage, ...messagesAfter]
      : [...messagesBefore, tradeInMessage, ...messagesAfter];
  } else {
    displayMessages = initialMessage 
      ? [initialMessage, ...deduplicatedMessages]
      : deduplicatedMessages;
  }

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

    // If there's a pending trade-in result that hasn't been attached yet, attach it to this message
    let finalMessage = messageToSend;
    if (tradeInResult && !tradeInResult.attached) {
      // Attach trade-in data silently to the message (will be filtered out in display)
      finalMessage += `\n\n[Trade-in estimate: ${tradeInResult.estimateUsd} USD for ${tradeInResult.details.modelYear} ${tradeInResult.details.make} ${tradeInResult.details.model}${tradeInResult.details.trim ? ` ${tradeInResult.details.trim}` : ""}${tradeInResult.details.conditionScore !== null ? ` (condition: ${tradeInResult.details.conditionScore}/100)` : ""}]`;
      
      // Mark trade-in as attached but keep it visible
      setTradeInResult({
        ...tradeInResult,
        attached: true,
      });
    }

    try {
      await sendMessage({
        parts: [{ type: "text", text: finalMessage }],
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

  // Upload selected image to Supabase Storage and set the public URL
  const uploadTradeInImage = async (file: File) => {
    if (!file) return;
    setTradeInUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id ?? "anon";

      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `tradein/${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(TRADEIN_BUCKET)
        .upload(filePath, file, {
          upsert: false,
          contentType: file.type || "image/jpeg",
        });

      if (uploadError) {
        console.error("[ChatPage] Trade-in image upload failed:", uploadError);
        toast.error("Failed to upload image. Please try again.");
        return;
      }

      const { data: publicData } = supabase.storage
        .from(TRADEIN_BUCKET)
        .getPublicUrl(filePath);

      if (!publicData?.publicUrl) {
        toast.error("Could not get image URL after upload.");
        return;
      }

      setTradeInImageUrl(publicData.publicUrl);
      toast.success("Image uploaded");
    } catch (err) {
      console.error("[ChatPage] Trade-in image upload exception:", err);
      toast.error("Image upload error. Please try again.");
    } finally {
      setTradeInUploading(false);
    }
  };

  // Handle trade-in estimation
  const handleTradeInEstimate = async () => {
    if (!tradeInVin || tradeInVin.length !== 17) {
      toast.error("Please enter a valid 17-character VIN");
      return;
    }

    setTradeInLoading(true);
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // Add auth token if available
      if (authTokenRef.current) {
        headers["Authorization"] = `Bearer ${authTokenRef.current}`;
      }

      const response = await fetch("/api/tradein", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          vin: tradeInVin.trim().toUpperCase(),
          imageUrl: tradeInImageUrl.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to estimate trade-in value");
        return;
      }

      const estimateFormatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(data.estimateUsd);

      // Close dialog and reset form
      setTradeInDialogOpen(false);
      setTradeInVin("");
      setTradeInImageUrl("");

      // Store trade-in result to display as agent card
      // Track the current message count to insert at correct position
      // Use chatMessages.length to get the current message count
      const currentMessageCount = chatMessages.length;
      setTradeInResult({
        ...data,
        id: `tradein-${Date.now()}`,
        timestamp: Date.now(),
        messageIndex: currentMessageCount - 1, // Insert after the last message
        attached: false, // Not yet attached to a message
      });
    } catch (error) {
      console.error("[ChatPage] Trade-in error:", error);
      toast.error("An error occurred while estimating trade-in value");
    } finally {
      setTradeInLoading(false);
    }
  };

  // Update agent workflow steps based on tool usage across the conversation
  useEffect(() => {
    if (displayMessages.length === 0) {
      if (agentWorkflowSteps !== null) {
        setAgentWorkflowSteps(null);
      }
      return;
    }

    type StepStatus = "pending" | "active" | "completed";
    type StepKey = "intent" | "vehicle" | "finance" | "report";

    const statuses: Record<StepKey, StepStatus> = {
      intent: "pending",
      vehicle: "pending",
      finance: "pending",
      report: "pending",
    };

    const latestToolStates: Record<"vehicle" | "finance" | "report", { state?: string; output?: any } | null> = {
      vehicle: null,
      finance: null,
      report: null,
    };

    const hadAgentTools = displayMessages.some(
      (message) => message.role === "agent" && Array.isArray(message.parts) && message.parts.length > 0,
    );

    if (hadAgentTools) {
      statuses.intent = "completed";
    }

    for (const message of displayMessages) {
      if (message.role !== "agent" || !message.parts) {
        continue;
      }

      for (const part of message.parts as any[]) {
        switch (part.type) {
          case "tool-searchToyotaTrims":
            latestToolStates.vehicle = { state: part.state, output: part.output };
            break;
          case "tool-estimateFinance":
            latestToolStates.finance = { state: part.state, output: part.output };
            break;
          case "tool-displayCarRecommendations":
          case "tool-sendEmailHtml":
          case "tool-scheduleTestDrive":
            latestToolStates.report = { state: part.state, output: part.output };
            break;
          default:
            break;
        }
      }
    }

    const mapToolStateToStatus = (entry: { state?: string; output?: any } | null): StepStatus | null => {
      if (!entry?.state) return null;
      const { state, output } = entry;

      if (state === "input-available" || state === "call-started" || state === "submitted") {
        return "active";
      }

      if (state === "output-available") {
        if (output && typeof output === "object" && "success" in output && output.success === false) {
          return "active";
        }
        return "completed";
      }

      if (state === "output-error" || state === "errored") {
        return "active";
      }

      return null;
    };

    const vehicleStatus = mapToolStateToStatus(latestToolStates.vehicle);
    if (vehicleStatus) {
      statuses.intent = "completed";
      statuses.vehicle = vehicleStatus;
    }

    const financeStatus = mapToolStateToStatus(latestToolStates.finance);
    if (financeStatus) {
      statuses.intent = "completed";
      if (statuses.vehicle === "pending") {
        statuses.vehicle = "completed";
      }
      statuses.finance = financeStatus;
    }

    const reportStatus = mapToolStateToStatus(latestToolStates.report);
    if (reportStatus) {
      statuses.intent = "completed";
      if (statuses.vehicle === "pending") {
        statuses.vehicle = "completed";
      }
      statuses.report = reportStatus;
    }

    const newSteps = [
      { name: "Intent Agent", description: "Understanding your request", status: statuses.intent },
      { name: "Vehicle Agent", description: "Searching Toyota database", status: statuses.vehicle },
      { name: "Finance Agent", description: "Calculating financing options", status: statuses.finance },
      { name: "Report Agent", description: "Preparing recommendations", status: statuses.report },
    ] as Array<{ name: string; description: string; status: StepStatus }>;

    const stepsChanged =
      !agentWorkflowSteps ||
      agentWorkflowSteps.length !== newSteps.length ||
      agentWorkflowSteps.some(
        (step, index) =>
          step.name !== newSteps[index].name ||
          step.description !== newSteps[index].description ||
          step.status !== newSteps[index].status,
      );

    if (stepsChanged) {
      setAgentWorkflowSteps(newSteps);
    }
  }, [agentWorkflowSteps, displayMessages]);

  return (
    <RequireAuth>
      <div className="flex h-[calc(100vh-var(--header-h,80px))] bg-background text-foreground overflow-hidden">
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Sidebar */}
          <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-border/70 bg-background/50 overflow-y-auto">
            <div className="p-5 space-y-5">
              <div className="rounded-2xl border border-border/70 bg-card/70 px-4 py-4 backdrop-blur">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary shrink-0">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                      Toyota agent live
                    </p>
                    <h2 className="text-xs font-semibold text-secondary leading-relaxed break-words">
                      Ask anything about Toyota pricing, trims, or ownership. Responses adapt to your quiz and browsing.
                    </h2>
                  </div>
                </div>
              </div>
              
              {/* Retell Voice Call Section */}
              <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 px-4 py-4 backdrop-blur">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/20 p-2 text-primary shrink-0">
                    <Phone className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                      Prefer to talk?
                    </p>
                    <div className="space-y-1">
                      <h3 className="text-xs font-semibold text-secondary">
                        Chat or CALL our agent
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed break-words">
                        Call <a href="tel:4052974640" className="font-semibold text-primary hover:underline">(405) 297-4640</a> to speak with our voice agent powered by Retell.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-Agent System Workflow */}
              <AgentWorkflow 
                steps={agentWorkflowSteps || [
                  { name: "Intent Agent", description: "Understanding your request", status: "pending" },
                  { name: "Vehicle Agent", description: "Searching Toyota database", status: "pending" },
                  { name: "Finance Agent", description: "Calculating financing options", status: "pending" },
                  { name: "Report Agent", description: "Preparing recommendations", status: "pending" },
                ]} 
              />
            </div>
          </aside>

          {/* Main chat area */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="toyota-container flex flex-col h-full max-w-7xl mx-auto w-full py-4 px-4 overflow-hidden">
              {/* Scrollable chat container with fixed height */}
              <div className="relative flex-1 min-h-0 flex flex-col rounded-4xl border border-border/70 bg-card/60 backdrop-blur">
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-3 space-y-2.5">
                      {loadingPreferences && (
                        <div className="flex gap-3 justify-start items-center">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Bot className="h-4 w-4" />
                          </div>
                          <div className="flex max-w-[82%] flex-col gap-2 items-start">
                            <div className="rounded-2xl border border-border/70 bg-background/90 px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Loading your preferences...</span>
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
                          <div key={message.id ?? i} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                            {showBotIcon && (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Bot className="h-4 w-4" />
                              </div>
                            )}
                            {!isUser && !showBotIcon && (
                              <div className="flex h-8 w-8 shrink-0" />
                            )}
                            <div className={`flex max-w-[90%] flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
                              {message.content && (
                                <div
                                  className={`rounded-2xl px-3 py-2.5 text-xs leading-relaxed prose prose-sm max-w-none ${
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
                                <div className="w-full space-y-2.5">
                                  {message.parts.map((part, partIndex) => {
                                    // Handle searchToyotaTrims tool
                                    if (part.type === "tool-searchToyotaTrims") {
                                      switch (part.state) {
                                        case "input-available":
                                          return (
                                            <div key={partIndex} className="flex items-center gap-2 text-xs text-muted-foreground">
                                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                              <span>Searching for cars...</span>
                                            </div>
                                          );
                                        case "output-available":
                                          // Search completed, but we don't display the results here
                                          // The LLM will call displayCarRecommendations with selected items
                                          return null;
                                        case "output-error":
                                          return (
                                            <div key={partIndex} className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
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
                                            <div key={partIndex} className="flex items-center gap-2 text-xs text-muted-foreground">
                                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
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
                                            <div key={partIndex} className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
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

                                    // Handle sendEmailHtml tool
                                    if (part.type === "tool-sendEmailHtml") {
                                      switch (part.state) {
                                        case "input-available":
                                          return (
                                            <div key={partIndex} className="flex items-center gap-2 text-xs text-muted-foreground">
                                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                              <span>Sending email...</span>
                                            </div>
                                          );
                                        case "output-available":
                                          const emailOutput = part.output as any;
                                          if (emailOutput?.success) {
                                            return (
                                              <div key={partIndex} className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
                                                <div className="flex items-start gap-2">
                                                  <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                                  <div className="flex-1 space-y-1">
                                                    <p className="font-semibold text-secondary">Email sent successfully!</p>
                                                    <p className="text-xs text-muted-foreground">
                                                      Sent to {Array.isArray(emailOutput.to) ? emailOutput.to.join(", ") : emailOutput.to}
                                                    </p>
                                                    {emailOutput.subject && (
                                                      <p className="text-xs text-muted-foreground">
                                                        Subject: {emailOutput.subject}
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          } else {
                                            return (
                                              <div key={partIndex} className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                                                <p className="font-semibold">Error sending email</p>
                                                <p className="mt-1 text-xs">{emailOutput?.error || "Unknown error"}</p>
                                              </div>
                                            );
                                          }
                                        case "output-error":
                                          return (
                                            <div key={partIndex} className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                                              <p className="font-semibold">Error sending email</p>
                                              <p className="mt-1 text-xs">{part.errorText || "Unknown error"}</p>
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
                                            <div key={partIndex} className="flex items-center gap-2 text-xs text-muted-foreground">
                                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                              <span>Scheduling test drive...</span>
                                            </div>
                                          );
                                        case "output-available":
                                          const output = part.output as any;
                                          if (output?.success) {
                                            return (
                                              <div key={partIndex} className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
                                                <div className="flex items-start gap-2">
                                                  <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                                  <div className="flex-1 space-y-1.5">
                                                    <p className="font-semibold text-secondary">Test drive scheduled!</p>
                                                    {output.details && (
                                                      <div className="space-y-0.5 text-xs text-muted-foreground">
                                                        <p><span className="font-medium">Vehicle:</span> {output.details.vehicle}</p>
                                                        <p><span className="font-medium">Date:</span> {output.details.date}</p>
                                                        <p><span className="font-medium">Time:</span> {output.details.time}</p>
                                                        <p><span className="font-medium">Location:</span> {output.details.location}</p>
                                                      </div>
                                                    )}
                                                    {output.link && (
                                                      <Link href={output.link} className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-primary hover:underline">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        View test drive details
                                                      </Link>
                                                    )}
                                                    <p className="text-xs text-muted-foreground mt-1.5">You'll receive a confirmation email shortly.</p>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          } else {
                                            return (
                                              <div key={partIndex} className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
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
                                            <div key={partIndex} className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                                              <p className="font-semibold">Error scheduling test drive</p>
                                              <p className="mt-1 text-xs">{part.errorText || "Unknown error"}</p>
                                            </div>
                                          );
                                        default:
                                          return null;
                                      }
                                    }

                                    // Handle estimateTradeIn tool
                                    if (part.type === "tool-estimateTradeIn") {
                                      switch (part.state) {
                                        case "input-available":
                                          return (
                                            <div key={partIndex} className="flex items-center gap-2 text-xs text-muted-foreground">
                                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                              <span>Estimating trade-in value...</span>
                                            </div>
                                          );
                                        case "output-available":
                                          const tradeInOutput = part.output as any;
                                          if (tradeInOutput?.estimateUsd) {
                                            const estimateFormatted = new Intl.NumberFormat("en-US", {
                                              style: "currency",
                                              currency: "USD",
                                              minimumFractionDigits: 0,
                                              maximumFractionDigits: 0,
                                            }).format(tradeInOutput.estimateUsd);

                                            const vehicleName = `${tradeInOutput.details?.modelYear || ""} ${tradeInOutput.details?.make || ""} ${tradeInOutput.details?.model || ""}${tradeInOutput.details?.trim ? ` ${tradeInOutput.details.trim}` : ""}`.trim();

                                            return (
                                              <div key={partIndex} className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs">
                                                <div className="flex items-start gap-2">
                                                  <DollarSign className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                                                  <div className="flex-1 space-y-1.5">
                                                    <p className="font-semibold text-destructive">Trade-in Estimate</p>
                                                    <div className="space-y-0.5 text-xs text-destructive/90">
                                                      <p><span className="font-medium">Vehicle:</span> {vehicleName}</p>
                                                      <p><span className="font-medium">Estimated Value:</span> {estimateFormatted}</p>
                                                      {tradeInOutput.details?.conditionScore !== null && tradeInOutput.details?.conditionScore !== undefined && (
                                                        <p><span className="font-medium">Condition Score:</span> {tradeInOutput.details.conditionScore}/100</p>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          }
                                          return null;
                                        case "output-error":
                                          return (
                                            <div key={partIndex} className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                                              <p className="font-semibold">Error estimating trade-in value</p>
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
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  <span>Thinking...</span>
                                </div>
                              )}
                              {message.suggestions && (
                                <div className="flex flex-wrap gap-1.5">
                                  {message.suggestions.map((suggestion) => (
                                    <Button
                                      key={suggestion}
                                      variant="outline"
                                      size="sm"
                                      className="rounded-full border-border/60 text-xs font-semibold text-muted-foreground hover:border-primary/70 hover:text-primary h-7 px-3"
                                      onClick={() => setInput(suggestion)}
                                    >
                                      {suggestion}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                            {isUser && (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                                <User className="h-4 w-4" />
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
              </div>

              {/* Fixed input section at bottom */}
              <div className="border-t border-border/60 bg-background/80 px-4 py-2.5 flex-shrink-0">
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
                    className="h-10 flex-1 rounded-full border-border/70 bg-card/80 px-4 text-sm disabled:opacity-60"
                  />
                  <VoiceButton
                    isListening={isListening}
                    isProcessing={isStreaming}
                    isSpeaking={isSpeaking}
                    isSupported={speechRecognitionRef.current?.getSupported() ?? false}
                    onClick={handleVoiceToggle}
                  />
                  <Dialog open={tradeInDialogOpen} onOpenChange={setTradeInDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="icon"
                        disabled={isStreaming || isListening}
                        className="h-10 w-10 rounded-full border border-border/70 bg-card/80 text-muted-foreground hover:bg-card hover:text-primary disabled:opacity-60"
                        title="Estimate trade-in value"
                      >
                        <DollarSign className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Estimate Trade-In Value</DialogTitle>
                        <DialogDescription>
                          Enter your vehicle's VIN and optionally upload an image to get an estimated trade-in value.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label htmlFor="vin" className="text-sm font-medium">
                            VIN <span className="text-destructive">*</span>
                          </label>
                          <Input
                            id="vin"
                            placeholder="Enter 17-character VIN"
                            value={tradeInVin}
                            onChange={(e) => setTradeInVin(e.target.value.toUpperCase())}
                            maxLength={17}
                            disabled={tradeInLoading}
                            className="font-mono"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="tradein-photo" className="text-sm font-medium">
                            Upload Photo <span className="text-muted-foreground">(optional)</span>
                          </label>
                          <input
                            id="tradein-photo"
                            type="file"
                            accept="image/*"
                            disabled={tradeInLoading || tradeInUploading}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                void uploadTradeInImage(file);
                              }
                            }}
                            className="block w-full text-sm file:mr-4 file:rounded-md file:border file:border-border/70 file:bg-card/80 file:px-3 file:py-1.5 file:text-sm file:text-foreground hover:file:bg-card/90 disabled:opacity-60"
                          />
                          {tradeInUploading && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading image to Supabase...
                            </div>
                          )}
                          {tradeInImageUrl && !tradeInUploading && (
                            <div className="space-y-2">
                              <div className="text-xs text-muted-foreground">
                                Image uploaded. A public URL will be used for condition assessment.
                              </div>
                              <div className="flex items-center gap-3">
                                <img
                                  src={tradeInImageUrl}
                                  alt="Trade-in preview"
                                  className="h-16 w-24 rounded-md border object-cover"
                                />
                                <Input value={tradeInImageUrl} readOnly className="text-xs" />
                              </div>
                            </div>
                          )}
                          {!tradeInImageUrl && (
                            <p className="text-xs text-muted-foreground">
                              Upload a vehicle photo to help the AI assess condition and refine the estimate.
                            </p>
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setTradeInDialogOpen(false);
                            setTradeInVin("");
                            setTradeInImageUrl("");
                          }}
                          disabled={tradeInLoading || tradeInUploading}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleTradeInEstimate}
                          disabled={tradeInLoading || tradeInUploading || tradeInVin.length !== 17}
                          className="bg-primary text-primary-foreground"
                        >
                          {tradeInLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Estimating...
                            </>
                          ) : (
                            "Get Estimate"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button
                    onClick={() => {
                      void handleSend();
                    }}
                    size="icon"
                    disabled={isStreaming || isListening}
                    className="h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-[0_24px_48px_-32px_rgba(235,10,30,0.6)] hover:bg-primary/90 disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {error && (
                  <p className="mt-2 text-center text-xs text-destructive">
                    Something went wrong. Please try again.
                  </p>
                )}
                {!error && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Powered by NVIDIA Nemotron™
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

