import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, stepCountIs, streamText, tool, type InferUITools, type ToolSet, type UIDataTypes, type UIMessage } from "ai";
import z from "zod";


const tools = {
    getLocation: tool({
      description: 'Get the location of the user',
      inputSchema: z.object({}),
      execute: async () => {
        const location = { lat: 37.7749, lon: -122.4194 };
        return `Your location is at latitude ${location.lat} and longitude ${location.lon}`;
      },
    }),
    getWeather: tool({
      description: 'Get the weather for a location',
      inputSchema: z.object({
        city: z.string().describe('The city to get the weather for'),
        unit: z
          .enum(['C', 'F'])
          .describe('The unit to display the temperature in'),
      }),
      execute: async ({ city, unit }) => {
        const weather = {
          value: 24,
          description: 'Sunny',
        };
  
        return `It is currently ${weather.value}°${unit} and ${weather.description} in ${city}!`;
      },
    }),
  } satisfies ToolSet;
  
  export type ChatTools = InferUITools<typeof tools>;

export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

export async function POST(req: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return new Response("OPENROUTER_API_KEY is not configured.", { status: 500 });
  }

  let body: { messages?: UIMessage[] } = {};

  try {
    body = await req.json();
  } catch {
    return new Response("Invalid request body.", { status: 400 });
  }

  if (!body.messages) {
    return new Response("Missing messages in request body.", { status: 400 });
  }

  const openrouter = createOpenRouter({
    apiKey,
    headers: {
      ...(process.env.OPENROUTER_SITE_URL ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL } : {}),
      ...(process.env.OPENROUTER_APP_NAME ? { "X-Title": process.env.OPENROUTER_APP_NAME } : {}),
    },
  });

  try {
    const result = streamText({
      model: openrouter.chat("nvidia/nemotron-nano-12b-v2-vl:free"),
      system:
        "You are a helpful Toyota shopping assistant. Use a tool call to get the current weather and always include it in your responses. Provide accurate, concise answers about Toyota models, pricing, financing, and ownership. If you are unsure, encourage the user to check with a Toyota dealer.",
      messages: convertToModelMessages(body.messages),
      stopWhen: stepCountIs(10),
      tools,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat generation failed", error);
    return new Response("Failed to generate response.", { status: 500 });
  }
}