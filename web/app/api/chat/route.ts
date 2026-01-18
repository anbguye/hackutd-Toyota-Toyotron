import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge' // Optional: Use edge runtime for better performance

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Get NeMo API configuration from environment variables
    const NEMO_API_URL = process.env.NEMO_API_URL || process.env.NIM_PROXY_BASE_URL
    const NEMO_API_KEY = process.env.NEMO_API_KEY
    const NEMO_MODEL = process.env.NEMO_MODEL || 'meta/llama-3.1-8b-instruct'

    if (!NEMO_API_URL) {
      console.error('NEMO_API_URL or NIM_PROXY_BASE_URL environment variable is not set')
      return NextResponse.json(
        { error: 'NeMo API configuration is missing' },
        { status: 500 }
      )
    }

    // Format messages for NeMo API (convert 'agent' role to 'assistant')
    const formattedMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'agent' ? 'assistant' : msg.role,
      content: msg.content,
    }))

    // Prepare the request to NeMo API
    const nemoRequest = {
      model: NEMO_MODEL,
      messages: formattedMessages,
      max_tokens: 512,
      temperature: 0.7,
      stream: false, // Set to true if you want streaming responses
    }

    // Call NeMo API
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    // Add API key if provided
    if (NEMO_API_KEY) {
      headers['Authorization'] = `Bearer ${NEMO_API_KEY}`
    }

    const response = await fetch(`${NEMO_API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(nemoRequest),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('NeMo API error:', response.status, errorText)
      return NextResponse.json(
        { error: `NeMo API error: ${response.statusText}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Extract the assistant's response
    const assistantMessage = data.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response.'

    return NextResponse.json({
      message: assistantMessage,
      usage: data.usage,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}



