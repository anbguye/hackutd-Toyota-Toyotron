import { NextResponse } from "next/server";
import { z } from "zod";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { createSsrClient, createSupabaseServerClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  vin: z.string().min(17).max(17),
  imageUrl: z.string().url().optional(),
});

type NHTSAVinResponse = {
  Results: Array<{
    Make?: string;
    Model?: string;
    ModelYear?: string;
    Trim?: string;
    [key: string]: any;
  }>;
};

async function decodeVin(vin: string): Promise<{
  make: string;
  model: string;
  modelYear: number;
  trim?: string;
} | null> {
  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${vin}?format=json`,
      { headers: { Accept: "application/json" } }
    );

    if (!response.ok) {
      console.error("[tradein] NHTSA API error:", response.status);
      return null;
    }

    const data: NHTSAVinResponse = await response.json();
    const result = data.Results?.[0];

    if (!result) {
      return null;
    }

    const make = result.Make?.trim();
    const model = result.Model?.trim();
    const modelYearStr = result.ModelYear?.trim();
    const trim = result.Trim?.trim();

    if (!make || !model || !modelYearStr) {
      return null;
    }

    const modelYear = parseInt(modelYearStr, 10);
    if (isNaN(modelYear) || modelYear < 1900 || modelYear > new Date().getFullYear() + 1) {
      return null;
    }

    return {
      make,
      model,
      modelYear,
      trim: trim || undefined,
    };
  } catch (error) {
    console.error("[tradein] Error decoding VIN:", error);
    return null;
  }
}

async function getBaselinePrice(
  make: string,
  model: string,
  modelYear: number,
  trim?: string
): Promise<number | null> {
  const supabase = createSupabaseServerClient();

  let query = supabase
    .from("toyota_trim_specs")
    .select("msrp")
    .ilike("make", `%${make}%`)
    .ilike("model", `%${model}%`)
    .eq("model_year", modelYear);

  if (trim) {
    query = query.ilike("trim", `%${trim}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[tradein] Error querying catalog:", error);
    return null;
  }

  if (!data || data.length === 0) {
    // Try without trim filter
    if (trim) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("toyota_trim_specs")
        .select("msrp")
        .ilike("make", `%${make}%`)
        .ilike("model", `%${model}%`)
        .eq("model_year", modelYear);

      if (fallbackError) {
        console.error("[tradein] Error in fallback catalog query:", fallbackError);
      }

      if (fallbackData && fallbackData.length > 0) {
        const prices = fallbackData
          .map((row) => row.msrp)
          .filter((p): p is number => typeof p === "number" && p > 0)
          .sort((a, b) => a - b);

        if (prices.length > 0) {
          const median = prices[Math.floor(prices.length / 2)];
          return median;
        }
      }
    }
    return null;
  }

  const prices = data
    .map((row) => row.msrp)
    .filter((p): p is number => typeof p === "number" && p > 0)
    .sort((a, b) => a - b);

  if (prices.length === 0) {
    return null;
  }

  // Return median price
  const median = prices[Math.floor(prices.length / 2)];
  return median;
}

function calculateDepreciation(basePrice: number, modelYear: number): number {
  const currentYear = new Date().getFullYear();
  const age = currentYear - modelYear;

  if (age < 0) {
    // Future model year, use base price
    return basePrice;
  }

  if (age === 0) {
    // Current year, 20% depreciation
    return basePrice * 0.8;
  }

  // First year: -20%, then -10% per year, floor at 30% of original
  let depreciation = 0.2; // First year
  depreciation += Math.min(age - 1, 5) * 0.1; // Up to 5 more years at 10% each
  if (age > 6) {
    depreciation += (age - 6) * 0.05; // Additional years at 5% each
  }

  depreciation = Math.min(depreciation, 0.7); // Max 70% depreciation (floor at 30%)

  return basePrice * (1 - depreciation);
}

async function assessCondition(imageUrl: string): Promise<{
  conditionScore: number;
  issues: string[];
} | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("[tradein] Missing OPENROUTER_API_KEY");
    return null;
  }

  const openrouter = createOpenRouter({
    apiKey,
    headers: {
      ...(process.env.OPENROUTER_SITE_URL ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL } : {}),
      ...(process.env.OPENROUTER_APP_NAME ? { "X-Title": process.env.OPENROUTER_APP_NAME } : {}),
    },
  });

  try {
    const { text } = await generateText({
      model: openrouter("openai/gpt-4o-mini"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this car image and assess its condition. Provide a JSON response with:
- "condition_score": a number from 0-100 (100 = excellent, 0 = poor)
- "issues": an array of strings describing any visible damage, wear, or problems (e.g., "dents", "scratches", "rust", "paint damage", "broken lights", etc.)

Be thorough but realistic. A new car would score 90-100, a well-maintained used car 70-90, average condition 50-70, poor condition 30-50, and very poor condition 0-30.`,
            },
            {
              type: "image",
              image: imageUrl,
            },
          ],
        },
      ],
    });

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[tradein] No JSON found in vision response. Text received:", text.substring(0, 500));
      return null;
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("[tradein] Error parsing JSON from vision response:", parseError);
      console.error("[tradein] JSON string that failed to parse:", jsonMatch[0]);
      return null;
    }

    const conditionScore = typeof parsed.condition_score === "number" 
      ? Math.max(0, Math.min(100, parsed.condition_score))
      : 75; // Default if not found

    const issues = Array.isArray(parsed.issues) 
      ? parsed.issues.filter((i: unknown): i is string => typeof i === "string")
      : [];

    return { conditionScore, issues };
  } catch (error) {
    console.error("[tradein] Error assessing condition:", error);
    if (error instanceof Error) {
      console.error("[tradein] Error stack:", error.stack);
      console.error("[tradein] Error message:", error.message);
    }
    return null;
  }
}

function applyConditionDiscount(price: number, conditionScore: number, issues: string[]): number {
  // Base discount from condition score: (100 - score) * 0.006, max 40%
  const scoreDiscount = Math.min(0.4, (100 - conditionScore) * 0.006);
  let adjustedPrice = price * (1 - scoreDiscount);

  // Additional small discount per issue (2% per issue, max 10% total)
  const issueDiscount = Math.min(0.1, issues.length * 0.02);
  adjustedPrice = adjustedPrice * (1 - issueDiscount);

  return Math.max(0, Math.round(adjustedPrice));
}

export async function POST(req: Request) {
  // Log entry point
  console.log("[tradein] ===== POST /api/tradein called =====");
  console.log("[tradein] Timestamp:", new Date().toISOString());
  
  try {
    console.log("[tradein] Step 1: Parsing request body...");
    let body;
    try {
      body = await req.json();
      console.log("[tradein] Request body parsed successfully:", { vin: body?.vin?.substring(0, 5) + "...", hasImageUrl: !!body?.imageUrl });
    } catch (jsonError) {
      console.error("[tradein] ERROR: Failed to parse request JSON");
      console.error("[tradein] Error:", jsonError);
      if (jsonError instanceof Error) {
        console.error("[tradein] Error name:", jsonError.name);
        console.error("[tradein] Error message:", jsonError.message);
        console.error("[tradein] Error stack:", jsonError.stack);
      }
      // Also write to stderr as fallback
      process.stderr.write(`[tradein] JSON parse error: ${String(jsonError)}\n`);
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    console.log("[tradein] Step 2: Validating request schema...");
    const validated = requestSchema.parse(body);
    console.log("[tradein] Validation passed");

    const { vin, imageUrl } = validated;

    console.log("[tradein] Step 3: Decoding VIN...");
    // Decode VIN
    const vinData = await decodeVin(vin);
    if (!vinData) {
      console.error("[tradein] ERROR: Failed to decode VIN");
      process.stderr.write(`[tradein] VIN decode failed for: ${vin}\n`);
      return NextResponse.json(
        { error: "Failed to decode VIN. Please check the VIN number." },
        { status: 400 }
      );
    }
    console.log("[tradein] VIN decoded:", { make: vinData.make, model: vinData.model, year: vinData.modelYear });

    console.log("[tradein] Step 4: Getting baseline price from catalog...");
    // Get baseline price from catalog
    const basePrice = await getBaselinePrice(
      vinData.make,
      vinData.model,
      vinData.modelYear,
      vinData.trim
    );

    if (!basePrice) {
      console.error("[tradein] ERROR: No baseline price found");
      process.stderr.write(`[tradein] No price for: ${vinData.make} ${vinData.model} ${vinData.modelYear}\n`);
      return NextResponse.json(
        { error: `Could not find pricing for ${vinData.make} ${vinData.model} ${vinData.modelYear} in our catalog.` },
        { status: 404 }
      );
    }
    console.log("[tradein] Baseline price found:", basePrice);

    console.log("[tradein] Step 5: Calculating depreciation...");
    // Calculate depreciation
    let estimatedPrice = calculateDepreciation(basePrice, vinData.modelYear);
    console.log("[tradein] Price after depreciation:", estimatedPrice);

    // Assess condition if image provided
    let conditionScore: number | null = null;
    let issues: string[] = [];
    if (imageUrl) {
      console.log("[tradein] Step 6: Assessing condition from image...");
      const conditionResult = await assessCondition(imageUrl);
      if (conditionResult) {
        conditionScore = conditionResult.conditionScore;
        issues = conditionResult.issues;
        estimatedPrice = applyConditionDiscount(estimatedPrice, conditionScore, issues);
        console.log("[tradein] Condition assessed:", { score: conditionScore, issuesCount: issues.length, finalPrice: estimatedPrice });
      } else {
        console.warn("[tradein] Condition assessment returned null");
      }
    } else {
      console.log("[tradein] Step 6: Skipping condition assessment (no image)");
    }

    console.log("[tradein] Step 7: Getting user session...");
    // Get user ID from session
    let supabase;
    try {
      supabase = await createSsrClient();
      console.log("[tradein] Supabase client created");
    } catch (supabaseError) {
      console.error("[tradein] ERROR: Failed to create Supabase client");
      console.error("[tradein] Error:", supabaseError);
      process.stderr.write(`[tradein] Supabase client error: ${String(supabaseError)}\n`);
      throw supabaseError;
    }

    // Try to get user from cookies first
    const {
      data: { user: cookieUser },
      error: cookieUserError,
    } = await supabase.auth.getUser();

    let user = cookieUser;

    // If no user from cookies, try Authorization header
    if (!user) {
      console.log("[tradein] No user from cookies, checking Authorization header...");
      const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

      if (token) {
        console.log("[tradein] Found Authorization token, validating...");
        const {
          data: { user: headerUser },
          error: headerUserError,
        } = await supabase.auth.getUser(token);

        if (headerUserError) {
          console.error("[tradein] Error validating token from header:", headerUserError);
        }

        if (headerUser) {
          user = headerUser;
          console.log("[tradein] User authenticated via Authorization header");
        }
      } else {
        console.log("[tradein] No Authorization header found");
      }
    } else {
      console.log("[tradein] User authenticated via cookies");
    }

    if (!user) {
      console.error("[tradein] ERROR: Authentication failed - no user found");
      console.error("[tradein] Cookie error:", cookieUserError);
      process.stderr.write(`[tradein] Auth error: ${cookieUserError ? JSON.stringify(cookieUserError) : "No user"}\n`);
      return NextResponse.json(
        { error: "Authentication required. Please sign in." },
        { status: 401 }
      );
    }
    console.log("[tradein] User authenticated:", user.id);

    console.log("[tradein] Step 8: Updating user preferences...");
    // Update user preferences
    const tradeInValueCents = Math.round(estimatedPrice * 100);
    const updateData: Record<string, any> = {
      trade_in_value_cents: tradeInValueCents,
      trade_in_vin: vin,
      trade_in_last_estimated_at: new Date().toISOString(),
    };

    if (conditionScore !== null) {
      updateData.trade_in_condition_score = conditionScore;
      updateData.trade_in_condition_issues = issues.length > 0 ? issues : null;
    }

    if (imageUrl) {
      updateData.trade_in_image_url = imageUrl;
    }

    console.log("[tradein] Update data prepared:", Object.keys(updateData));

    // Upsert user preferences
    const { error: updateError } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: user.id,
          ...updateData,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (updateError) {
      console.error("[tradein] ERROR: Failed to update preferences");
      console.error("[tradein] Update error:", updateError);
      console.error("[tradein] Update error code:", updateError.code);
      console.error("[tradein] Update error message:", updateError.message);
      console.error("[tradein] Update error details:", JSON.stringify(updateError, null, 2));
      process.stderr.write(`[tradein] Update error: ${JSON.stringify(updateError)}\n`);
      // Don't fail the request, just log the error
    } else {
      console.log("[tradein] Preferences updated successfully");
    }

    console.log("[tradein] Step 9: Returning success response");
    return NextResponse.json({
      estimateUsd: estimatedPrice,
      details: {
        make: vinData.make,
        model: vinData.model,
        modelYear: vinData.modelYear,
        trim: vinData.trim,
        basePrice,
        conditionScore,
        issues: issues.length > 0 ? issues : undefined,
      },
    });
  } catch (error) {
    console.error("[tradein] ===== ERROR CAUGHT IN POST HANDLER =====");
    console.error("[tradein] Error type:", typeof error);
    console.error("[tradein] Error:", error);
    
    if (error instanceof z.ZodError) {
      console.error("[tradein] Validation error detected");
      console.error("[tradein] Validation errors:", error.errors);
      process.stderr.write(`[tradein] Validation error: ${JSON.stringify(error.errors)}\n`);
      return NextResponse.json(
        { error: "Invalid request. VIN must be 17 characters.", errors: error.errors },
        { status: 400 }
      );
    }

    console.error("[tradein] Unexpected error occurred");
    if (error instanceof Error) {
      console.error("[tradein] Error name:", error.name);
      console.error("[tradein] Error message:", error.message);
      console.error("[tradein] Error stack:", error.stack);
      process.stderr.write(`[tradein] Error: ${error.name}: ${error.message}\n`);
      process.stderr.write(`[tradein] Stack: ${error.stack}\n`);
    } else {
      console.error("[tradein] Error (non-Error object):", JSON.stringify(error, null, 2));
      process.stderr.write(`[tradein] Non-Error: ${JSON.stringify(error)}\n`);
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred while estimating trade-in value." },
      { status: 500 }
    );
  }
}

