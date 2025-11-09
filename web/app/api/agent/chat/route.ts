import { NextRequest, NextResponse } from "next/server"
import { NemotronClient } from "@/lib/agents/nemotron"
import { createServerClient } from "@/lib/supabase/server"
import type { Car } from "@/lib/supabase/types"

/**
 * POST /api/agent/chat
 * Send message to Nemotron agent with user context
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userMessage, preferences, chatHistory } = body

    if (!userMessage || typeof userMessage !== "string") {
      return NextResponse.json(
        { error: "userMessage is required" },
        { status: 400 }
      )
    }

    // Initialize Nemotron client
    const nemotronClient = new NemotronClient()

    // Convert chat history to Nemotron format
    const history = (chatHistory || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    }))

    // Create chat request
    const chatRequest = nemotronClient.createToyotaAgentRequest(
      userMessage,
      history,
      preferences
    )

    // Send request to Nemotron
    const nemotronResponse = await nemotronClient.chat(chatRequest)

    // Handle tool calls (e.g., search_cars)
    let finalResponse = nemotronResponse.choices[0]?.message
    let carSuggestions: Array<{ carId: string; name: string; reasoning: string }> = []

    if (finalResponse?.tool_calls && finalResponse.tool_calls.length > 0) {
      // Process tool calls
      const toolResults: any[] = []

      for (const toolCall of finalResponse.tool_calls) {
        if (toolCall.function.name === "search_cars") {
          try {
            const toolArgs = JSON.parse(toolCall.function.arguments)
            const cars = await searchCarsInSupabase(toolArgs)

            toolResults.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(cars),
            })

            // Create car suggestions from results
            carSuggestions = cars.slice(0, 5).map((car) => ({
              carId: car.id,
              name: `${car.name} ${car.year}`,
              reasoning: `Matches your preferences: ${car.type}, ${car.seats} seats, $${(car.msrp / 100).toLocaleString()} MSRP`,
            }))
          } catch (error) {
            console.error("[AGENT] Error executing search_cars tool:", error)
            toolResults.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: "Failed to search cars" }),
            })
          }
        }
      }

      // If we have tool results, send them back to Nemotron for final response
      if (toolResults.length > 0) {
        const followUpRequest = nemotronClient.createToyotaAgentRequest(
          "",
          [
            ...history,
            { role: "user", content: userMessage },
            {
              role: "assistant",
              content: finalResponse.content || "",
            },
            ...toolResults,
          ],
          preferences
        )

        // Remove the user message from follow-up since we're continuing the conversation
        followUpRequest.messages = followUpRequest.messages.slice(0, -1)

        const followUpResponse = await nemotronClient.chat(followUpRequest)
        finalResponse = followUpResponse.choices[0]?.message
      }
    }

    // Format response
    const response = {
      message: finalResponse?.content || "I apologize, but I couldn't generate a response.",
      suggestions: carSuggestions,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error("[AGENT] Error in chat endpoint:", error)
    return NextResponse.json(
      {
        error: "Failed to process chat message",
        message: error.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * Search cars in Supabase based on tool call parameters
 */
async function searchCarsInSupabase(filters: {
  budget_min?: number
  budget_max?: number
  car_types?: string[]
  seats?: number
  mpg_priority?: "high" | "medium" | "low"
  use_case?: string
}): Promise<Car[]> {
  const supabase = createServerClient()

  let query = supabase.from("cars").select("*")

  // Apply filters
  if (filters.budget_min !== undefined) {
    query = query.gte("msrp", filters.budget_min)
  }

  if (filters.budget_max !== undefined) {
    query = query.lte("msrp", filters.budget_max)
  }

  if (filters.car_types && filters.car_types.length > 0) {
    query = query.in("type", filters.car_types)
  }

  if (filters.seats !== undefined) {
    query = query.eq("seats", filters.seats)
  }

  // MPG priority - order by mpg_city if high priority
  if (filters.mpg_priority === "high") {
    query = query.order("mpg_city", { ascending: false })
  } else {
    query = query.order("name", { ascending: true })
  }

  const { data, error } = await query.limit(20)

  if (error) {
    console.error("[AGENT] Supabase query error:", error)
    throw new Error(`Failed to search cars: ${error.message}`)
  }

  return (data || []) as Car[]
}

