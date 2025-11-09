/**
 * NVIDIA Nemotron API Client
 * Handles communication with NVIDIA Nemotron API for AI agent chat
 */

export interface NemotronMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface NemotronToolCall {
  id: string
  type: "function"
  function: {
    name: string
    arguments: string // JSON string
  }
}

export interface NemotronResponse {
  id: string
  choices: Array<{
    index: number
    message: {
      role: "assistant"
      content: string
      tool_calls?: NemotronToolCall[]
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface NemotronChatRequest {
  model: string
  messages: NemotronMessage[]
  tools?: Array<{
    type: "function"
    function: {
      name: string
      description: string
      parameters: {
        type: "object"
        properties: Record<string, any>
        required?: string[]
      }
    }
  }>
  tool_choice?: "auto" | "none" | { type: "function"; function: { name: string } }
  temperature?: number
  max_tokens?: number
}

export class NemotronClient {
  private apiKey: string
  private apiUrl: string
  private model: string

  constructor() {
    this.apiKey = process.env.NEMOTRON_API_KEY || ""
    this.apiUrl = process.env.NEMOTRON_API_URL || "https://api.nvcf.nvidia.com/v1/nemotron"
    this.model = process.env.NEMOTRON_MODEL || "meta/nemotron-70b-instruct"

    if (!this.apiKey) {
      throw new Error("NEMOTRON_API_KEY environment variable is required")
    }
  }

  /**
   * Send a chat request to Nemotron API
   */
  async chat(request: NemotronChatRequest): Promise<NemotronResponse> {
    const url = `${this.apiUrl}/chat/completions`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // NVIDIA API uses Authorization header with Bearer token
        "Authorization": `Bearer ${this.apiKey}`,
        // Alternative: Some NVIDIA endpoints may use X-Auth-Token
        ...(this.apiKey.startsWith("nvapi-") ? {} : {
          "X-Auth-Token": this.apiKey,
        }),
      },
      body: JSON.stringify({
        ...request,
        model: this.model,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Nemotron API error: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    return await response.json()
  }

  /**
   * Create a chat request with system prompt for Toyota car recommendations
   */
  createToyotaAgentRequest(
    userMessage: string,
    chatHistory: Array<{ role: "user" | "assistant"; content: string }>,
    preferences?: {
      budget_min?: number
      budget_max?: number
      car_types?: string[]
      seats?: number
      mpg_priority?: string
      use_case?: string
    }
  ): NemotronChatRequest {
    const systemPrompt = `You are a friendly Toyota car shopping assistant. Your role is to help users find the perfect Toyota vehicle based on their preferences and needs.

Key Guidelines:
- Be conversational, friendly, and approachable (not robotic)
- Ask clarifying questions when needed
- Use the search_cars tool to find matching vehicles from the Toyota inventory
- Explain why specific cars match the user's needs
- Focus on helping users make informed decisions
- Guide users toward scheduling test drives when appropriate

User Preferences:
${preferences ? JSON.stringify(preferences, null, 2) : "No preferences set yet"}

When the user asks about cars, use the search_cars tool to find matching vehicles. Always explain your reasoning for recommendations.`

    const messages: NemotronMessage[] = [
      { role: "system", content: systemPrompt },
      ...chatHistory.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })),
      { role: "user", content: userMessage },
    ]

    return {
      model: this.model,
      messages,
      tools: [
        {
          type: "function",
          function: {
            name: "search_cars",
            description:
              "Search for Toyota cars matching specific criteria. Use this when the user asks about cars, wants recommendations, or specifies preferences.",
            parameters: {
              type: "object",
              properties: {
                budget_min: {
                  type: "number",
                  description: "Minimum budget in cents (e.g., 3000000 = $30,000)",
                },
                budget_max: {
                  type: "number",
                  description: "Maximum budget in cents (e.g., 5000000 = $50,000)",
                },
                car_types: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of car types (e.g., ['SUV', 'Sedan', 'Truck'])",
                },
                seats: {
                  type: "number",
                  description: "Number of seats required",
                },
                mpg_priority: {
                  type: "string",
                  enum: ["high", "medium", "low"],
                  description: "Priority for fuel efficiency",
                },
                use_case: {
                  type: "string",
                  description: "Primary use case (e.g., 'commute', 'family', 'weekend')",
                },
              },
            },
          },
        },
      ],
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 1000,
    }
  }
}

