import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { searchToyotaTrims } from "@/lib/cars/searchToyotaTrims";
import type { CarCard } from "@/lib/cars/types";

const apiKey = process.env.OPENROUTER_API_KEY!;
const openrouter = createOpenRouter({
  apiKey,
  headers: {
    ...(process.env.OPENROUTER_SITE_URL ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL } : {}),
    ...(process.env.OPENROUTER_APP_NAME ? { "X-Title": process.env.OPENROUTER_APP_NAME } : {}),
  },
});

export type IntentTask = {
  goal: string;
  constraints: {
    budget?: number;
    budgetMin?: number;
    budgetMax?: number;
    type?: string;
    powertrain?: string;
    seats?: number;
    model?: string;
    year?: number;
  };
  needs_finance?: boolean;
  needs_comparison?: boolean;
  needs_test_drive?: boolean;
};

/**
 * Intent Agent - Parses user's messy request into structured task
 */
export async function intentAgent(userMessage: string, preferences?: any): Promise<IntentTask> {
  const systemPrompt = `You are an Intent Agent. Your job is to parse the user's natural language request and extract structured information.

Extract:
- goal: What the user wants (e.g., "find_vehicle", "compare_vehicles", "get_finance_info", "schedule_test_drive")
- constraints: Budget, vehicle type, powertrain, seats, model, year, etc.
- needs_finance: Boolean indicating if user wants financing information
- needs_comparison: Boolean indicating if user wants to compare vehicles
- needs_test_drive: Boolean indicating if user wants to schedule a test drive

User preferences (if available):
${preferences ? JSON.stringify(preferences, null, 2) : "None"}

Return ONLY valid JSON in this exact format:
{
  "goal": "find_vehicle",
  "constraints": {
    "budget": 40000,
    "budgetMin": 30000,
    "budgetMax": 50000,
    "type": "SUV",
    "powertrain": "Hybrid",
    "seats": 4
  },
  "needs_finance": true,
  "needs_comparison": false,
  "needs_test_drive": false
}`;

  try {
    const result = await generateText({
      model: openrouter.chat("nvidia/llama-3.3-nemotron-super-49b-v1.5"),
      system: systemPrompt,
      prompt: `User message: ${userMessage}\n\nExtract the intent and constraints. Return ONLY valid JSON, no other text.`,
      temperature: 0.3,
    });

    const text = result.text.trim();
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : text;
    
    const task = JSON.parse(jsonText) as IntentTask;
    
    // Apply user preferences as defaults if not specified
    if (preferences) {
      if (!task.constraints.budgetMin && preferences.budget_min) {
        task.constraints.budgetMin = preferences.budget_min;
      }
      if (!task.constraints.budgetMax && preferences.budget_max) {
        task.constraints.budgetMax = preferences.budget_max;
      }
      if (!task.constraints.type && preferences.car_types && preferences.car_types.length > 0) {
        task.constraints.type = preferences.car_types[0];
      }
      if (!task.constraints.seats && preferences.seats) {
        task.constraints.seats = preferences.seats;
      }
    }

    return task;
  } catch (error) {
    console.error("[intentAgent] Error:", error);
    // Return default task
    return {
      goal: "find_vehicle",
      constraints: {
        budgetMin: preferences?.budget_min || 15000,
        budgetMax: preferences?.budget_max || 80000,
        type: preferences?.car_types?.[0] || undefined,
        seats: preferences?.seats || undefined,
      },
      needs_finance: false,
    };
  }
}

/**
 * Vehicle Agent - Takes constraints and searches for vehicles
 */
export async function vehicleAgent(task: IntentTask): Promise<{ items: CarCard[]; count: number }> {
  const searchParams: any = {};

  // Map constraints to search parameters
  if (task.constraints.budgetMin) {
    searchParams.budgetMin = task.constraints.budgetMin;
  }
  if (task.constraints.budgetMax) {
    searchParams.budgetMax = task.constraints.budgetMax;
  }
  if (task.constraints.budget && !task.constraints.budgetMax) {
    searchParams.budgetMax = task.constraints.budget;
  }
  if (task.constraints.type) {
    searchParams.bodyType = task.constraints.type;
  }
  if (task.constraints.seats) {
    searchParams.seatsMin = task.constraints.seats;
  }
  if (task.constraints.model) {
    searchParams.model = task.constraints.model;
  }
  if (task.constraints.year) {
    searchParams.modelYear = task.constraints.year;
  }
  if (task.constraints.powertrain) {
    // Map powertrain to engine_type
    const powertrainMap: Record<string, string> = {
      hybrid: "Hybrid",
      electric: "Electric",
      gas: "Gas",
      gasoline: "Gas",
    };
    searchParams.engineType = powertrainMap[task.constraints.powertrain.toLowerCase()] || task.constraints.powertrain;
  }

  // Limit to top 3 for recommendations
  searchParams.limit = 3;
  searchParams.sortBy = "msrp";
  searchParams.sortDir = "asc";

  try {
    const result = await searchToyotaTrims(searchParams);
    return {
      items: result.items.slice(0, 3),
      count: result.items.length,
    };
  } catch (error) {
    console.error("[vehicleAgent] Error:", error);
    return { items: [], count: 0 };
  }
}

/**
 * Finance Agent - Estimates finance options for each vehicle
 */
export async function financeAgent(vehicles: CarCard[]): Promise<Array<CarCard & { finance?: any }>> {
  const vehiclesWithFinance = vehicles.map((vehicle) => {
    const msrp = vehicle.msrp || vehicle.invoice || 0;
    
    // Simple finance calculation
    const financeOptions = {
      loan: {
        "36_months": {
          monthly: Math.round((msrp * 1.05) / 36), // 5% interest estimate
          total: Math.round(msrp * 1.05),
          down_payment: Math.round(msrp * 0.1), // 10% down
        },
        "60_months": {
          monthly: Math.round((msrp * 1.08) / 60), // 8% interest estimate
          total: Math.round(msrp * 1.08),
          down_payment: Math.round(msrp * 0.1),
        },
        "72_months": {
          monthly: Math.round((msrp * 1.1) / 72), // 10% interest estimate
          total: Math.round(msrp * 1.1),
          down_payment: Math.round(msrp * 0.1),
        },
      },
      lease: {
        "36_months": {
          monthly: Math.round(msrp * 0.012), // ~1.2% of MSRP per month
          total: Math.round(msrp * 0.012 * 36),
          down_payment: Math.round(msrp * 0.05), // 5% down
        },
      },
    };

    return {
      ...vehicle,
      finance: financeOptions,
    };
  });

  return vehiclesWithFinance;
}

/**
 * Report Agent - Formats the final response with narrative
 */
export async function reportAgent(
  task: IntentTask,
  vehicles: Array<CarCard & { finance?: any }>,
  userMessage: string
): Promise<string> {
  if (vehicles.length === 0) {
    return "I couldn't find any vehicles matching your criteria. Would you like to adjust your search parameters?";
  }

  const systemPrompt = `You are a Report Agent. Your job is to create a user-friendly narrative response based on the structured data.

Task: ${JSON.stringify(task, null, 2)}

Vehicles found: ${vehicles.length}

Format your response as:
1. A brief introduction acknowledging the user's request
2. Highlight the best match (first vehicle) with key details
3. Mention other options if available
4. Include finance information if needs_finance is true
5. Keep it conversational and helpful
6. Use Markdown formatting for clarity

Return ONLY the narrative text, no JSON or code blocks.`;

  const vehiclesSummary = vehicles
    .map(
      (v, i) =>
        `${i + 1}. ${v.year || ""} ${v.make || "Toyota"} ${v.model || ""} ${v.trim || ""} - $${(v.msrp || v.invoice || 0).toLocaleString()}`
    )
    .join("\n");

  try {
    const result = await generateText({
      model: openrouter.chat("nvidia/llama-3.3-nemotron-super-49b-v1.5"),
      system: systemPrompt,
      prompt: `User asked: "${userMessage}"

Vehicles found:
${vehiclesSummary}

${task.needs_finance ? "\nFinance information is available for these vehicles." : ""}

Create a helpful narrative response.`,
      temperature: 0.7,
    });

    return result.text;
  } catch (error) {
    console.error("[reportAgent] Error:", error);
    // Fallback response
    const bestMatch = vehicles[0];
    return `I found ${vehicles.length} vehicle${vehicles.length > 1 ? "s" : ""} matching your criteria. The best match is the **${bestMatch.year || ""} ${bestMatch.make || "Toyota"} ${bestMatch.model || ""} ${bestMatch.trim || ""}** at $${(bestMatch.msrp || bestMatch.invoice || 0).toLocaleString()}.`;
  }
}

