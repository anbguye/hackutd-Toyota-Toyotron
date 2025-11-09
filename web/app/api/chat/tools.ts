import { tool, type ToolSet, type InferUITools } from "ai";
import { z } from "zod";
import { searchToyotaTrims } from "@/lib/cars/searchToyotaTrims";
import {
  searchToyotaTrimsInputSchema,
  displayCarRecommendationsInputSchema,
  scheduleTestDriveInputSchema,
} from "@/lib/cars/schemas";
import type { CarCard } from "@/lib/cars/types";
import { sendEmailHtmlInputSchema } from "@/lib/email/schemas";
import { sendEmailHtml } from "@/lib/email/resend";
import { createSsrClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { sendBookingConfirmationEmail } from "@/lib/email/booking-confirmation";

const searchToyotaTrimsTool = tool({
  description:
    "Search Toyota's database for vehicles matching the user's criteria. Use this to find cars by budget, type, seats, powertrain, or other specifications. Returns up to 24 results. Call this BEFORE making any claims about vehicle availability, pricing, or features.",
  inputSchema: searchToyotaTrimsInputSchema,
  execute: async (input) => {
    console.log("[searchToyotaTrims] Tool called with:", JSON.stringify(input, null, 2));
    const result = await searchToyotaTrims(input);
    console.log("[searchToyotaTrims] Tool returned:", result.count, "items");
    return result;
  },
});

const displayCarRecommendationsTool = tool({
  description:
    "Display car recommendations as visual cards. Use this after finding vehicles that match the user's criteria. Pass 1-3 car objects from your search results. The items parameter must be an array of car objects.",
  inputSchema: displayCarRecommendationsInputSchema,
  execute: async (input) => {
    if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
      return {
        error: "Items array is required and must contain at least one car object from searchToyotaTrims results.",
        items: [],
        count: 0,
      };
    }

    const items = input.items.slice(0, 3);
    return {
      items,
      count: items.length,
    };
  },
});

const sendEmailHtmlTool = tool({
  description:
    "Send an email with raw HTML content via Resend. Use this tool PROACTIVELY after providing car recommendations or when the user shows interest in vehicles. Always include: (1) Car recommendations with images and links, (2) Financing options (monthly payments, loan terms) calculated using estimateFinance tool, (3) Leasing options (monthly lease payments), (4) Personalization based on conversation context. Use when the user explicitly requests or agrees to your proactive suggestion. Provide the recipient email address(es), subject line, and HTML content.",
  inputSchema: sendEmailHtmlInputSchema,
  execute: async (input) => {
    console.log("[sendEmailHtml] Tool called with:", JSON.stringify({ ...input, html: input.html.substring(0, 100) + "..." }, null, 2));
    try {
      const result = await sendEmailHtml(input);
      console.log("[sendEmailHtml] Email sent successfully:", result?.id);
      return {
        success: true,
        id: result?.id,
        to: input.to,
        subject: input.subject,
      };
    } catch (error) {
      console.error("[sendEmailHtml] Error sending email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

const estimateFinanceTool = tool({
  description:
    "Calculate finance options (loan and lease) for a vehicle. Use this when the user asks about monthly payments, financing, or lease options. Provide the vehicle price (MSRP) in dollars.",
  inputSchema: z.object({
    vehiclePrice: z.number().min(0).describe("The vehicle price (MSRP) in dollars"),
    downPaymentPercent: z.number().min(0).max(100).optional().default(10).describe("Down payment percentage (default 10%)"),
    loanTermMonths: z.number().int().min(36).max(84).optional().describe("Loan term in months (36, 60, or 72)"),
  }),
  execute: async (input) => {
    const { vehiclePrice, downPaymentPercent = 10, loanTermMonths = 60 } = input;
    const downPayment = Math.round(vehiclePrice * (downPaymentPercent / 100));
    const loanAmount = vehiclePrice - downPayment;

    // Simple finance calculation with estimated interest rates
    const interestRates: Record<number, number> = {
      36: 0.05, // 5% for 36 months
      60: 0.08, // 8% for 60 months
      72: 0.10, // 10% for 72 months
    };

    const rate = interestRates[loanTermMonths] || 0.08;
    const totalWithInterest = Math.round(loanAmount * (1 + rate));
    const monthlyPayment = Math.round(totalWithInterest / loanTermMonths);

    // Lease estimate (typically 1.2% of MSRP per month for 36 months)
    const leaseMonthly = Math.round(vehiclePrice * 0.012);
    const leaseDownPayment = Math.round(vehiclePrice * 0.05); // 5% down for lease
    const leaseTotal = leaseMonthly * 36;

    return {
      vehiclePrice,
      downPayment,
      loanAmount,
      loanTermMonths,
      monthlyPayment,
      totalWithInterest,
      lease: {
        monthlyPayment: leaseMonthly,
        downPayment: leaseDownPayment,
        termMonths: 36,
        totalCost: leaseTotal,
      },
      note: "These are estimates. Actual rates depend on credit score, dealer offers, and current market conditions.",
    };
  },
});

const scheduleTestDriveTool = tool({
  description:
    "Schedule a test drive for a vehicle. Use this when the user wants to schedule a test drive or shows interest in test driving a specific vehicle. You should proactively suggest scheduling test drives after showing vehicle recommendations. Requires trim_id, preferred date/time, and optionally location and contact info.",
  inputSchema: scheduleTestDriveInputSchema,
  execute: async (input) => {
    console.log("[scheduleTestDrive] Tool called with:", JSON.stringify(input, null, 2));
    
    try {
      // Get user info from Supabase - tools execute in server context with cookie access
      // Note: createSsrClient() uses cookies() from Next.js which should work in server context
      const supabase = await createSsrClient();
      
      // Try to get session first (includes access token and user)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("[scheduleTestDrive] Session error:", sessionError);
      }
      
      // Get user from session (preferred) or directly via getUser()
      let user = session?.user || null;
      
      if (!user) {
        // Fallback: try getUser() directly
        const { data: { user: fetchedUser }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error("[scheduleTestDrive] User fetch error:", userError);
          console.error("[scheduleTestDrive] Error details:", JSON.stringify(userError, null, 2));
        }
        user = fetchedUser;
      }
      
      if (!user) {
        console.error("[scheduleTestDrive] No user found after all attempts. Session exists:", !!session, "Session error:", sessionError);
        // Check if this is a cookie access issue
        return {
          success: false,
          error: "Unable to verify your session. Please refresh the page and try again. If the issue persists, please sign out and sign back in.",
          link: "/login",
        };
      }
      
      console.log("[scheduleTestDrive] User found:", user.id, "Email:", user.email);

      // Parse date/time
      let bookingDateTime: Date;
      const now = new Date();
      
      // Handle relative dates
      if (input.preferredDate.toLowerCase().includes("tomorrow")) {
        bookingDateTime = new Date(now);
        bookingDateTime.setDate(bookingDateTime.getDate() + 1);
      } else if (input.preferredDate.toLowerCase().includes("next week")) {
        bookingDateTime = new Date(now);
        bookingDateTime.setDate(bookingDateTime.getDate() + 7);
      } else {
        // Try to parse ISO date
        bookingDateTime = new Date(input.preferredDate);
        if (isNaN(bookingDateTime.getTime())) {
          // Default to tomorrow if parsing fails
          bookingDateTime = new Date(now);
          bookingDateTime.setDate(bookingDateTime.getDate() + 1);
        }
      }

      // Set time
      if (input.preferredTime) {
        if (input.preferredTime.includes(":")) {
          // HH:MM format
          const [hours, minutes] = input.preferredTime.split(":").map(Number);
          bookingDateTime.setHours(hours || 10, minutes || 0, 0, 0);
        } else if (input.preferredTime.toLowerCase().includes("morning")) {
          bookingDateTime.setHours(10, 0, 0, 0);
        } else if (input.preferredTime.toLowerCase().includes("afternoon")) {
          bookingDateTime.setHours(14, 0, 0, 0);
        } else if (input.preferredTime.toLowerCase().includes("evening")) {
          bookingDateTime.setHours(17, 0, 0, 0);
        } else {
          bookingDateTime.setHours(10, 0, 0, 0); // Default to 10 AM
        }
      } else {
        bookingDateTime.setHours(10, 0, 0, 0); // Default to 10 AM
      }

      // Get vehicle details
      const { data: vehicleData, error: vehicleError } = await supabase
        .from("toyota_trim_specs")
        .select("trim_id, model_year, make, model, trim")
        .eq("trim_id", input.trimId)
        .maybeSingle();

      if (vehicleError || !vehicleData) {
        return {
          success: false,
          error: "Vehicle not found. Please select a valid vehicle.",
        };
      }

      // Get user profile for contact info
      const { data: profileData } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const contactName = input.contactName || user.user_metadata?.full_name || profileData?.contact_name || user.email?.split("@")[0] || "Customer";
      const contactEmail = input.contactEmail || user.email || "";
      const contactPhone = input.contactPhone || user.user_metadata?.phone || profileData?.contact_phone || "";

      if (!contactEmail) {
        return {
          success: false,
          error: "Email address is required. Please update your profile or provide an email.",
        };
      }

      // Insert booking directly into database (more reliable than calling API)
      const baseInsert = {
        user_id: user.id,
        car_id: vehicleData.trim_id,
        preferred_location: input.location || "downtown",
        booking_date: bookingDateTime.toISOString(),
        status: "pending" as const,
      };

      const extendedInsert = {
        ...baseInsert,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone || "000-000-0000",
        vehicle_make: vehicleData.make ?? null,
        vehicle_model: vehicleData.model ?? null,
        vehicle_year: typeof vehicleData.model_year === "number" ? vehicleData.model_year : null,
        vehicle_trim: vehicleData.trim ?? null,
      };

      const { data: booking, error: insertError } = await supabase
        .from("test_drive_bookings")
        .insert(extendedInsert)
        .select("*")
        .single();

      if (insertError) {
        console.error("[scheduleTestDrive] Database insert error:", insertError);
        // Try fallback insert
        const { data: fallbackBooking, error: fallbackError } = await supabase
          .from("test_drive_bookings")
          .insert(baseInsert)
          .select("*")
          .single();

        if (fallbackError) {
          return {
            success: false,
            error: "Failed to create booking. Please try again later.",
          };
        }

        // Send email for fallback booking
        try {
          await sendBookingConfirmationEmail({
            contactName,
            contactEmail,
            contactPhone: contactPhone || "000-000-0000",
            preferredLocation: input.location || "downtown",
            bookingDateTime: bookingDateTime.toISOString(),
            vehicleMake: vehicleData.make || "Vehicle",
            vehicleModel: vehicleData.model || "Model",
            vehicleYear: vehicleData.model_year || new Date().getFullYear(),
            vehicleTrim: vehicleData.trim || "Trim",
          });
        } catch (emailError) {
          console.error("[scheduleTestDrive] Email error:", emailError);
        }

        return {
          success: true,
          message: `Test drive scheduled successfully for ${bookingDateTime.toLocaleDateString()} at ${bookingDateTime.toLocaleTimeString()}`,
          bookingId: fallbackBooking?.id,
          link: `/test-drive?trim_id=${input.trimId}&year=${vehicleData.model_year}&make=${vehicleData.make}&model=${vehicleData.model}&trim=${vehicleData.trim}`,
          details: {
            date: bookingDateTime.toLocaleDateString(),
            time: bookingDateTime.toLocaleTimeString(),
            location: input.location || "downtown",
            vehicle: `${vehicleData.model_year} ${vehicleData.make} ${vehicleData.model} ${vehicleData.trim}`,
          },
        };
      }

      // Send confirmation email for successful booking
      try {
        await sendBookingConfirmationEmail({
          contactName,
          contactEmail,
          contactPhone: contactPhone || "000-000-0000",
          preferredLocation: input.location || "downtown",
          bookingDateTime: bookingDateTime.toISOString(),
          vehicleMake: vehicleData.make || "Vehicle",
          vehicleModel: vehicleData.model || "Model",
          vehicleYear: vehicleData.model_year || new Date().getFullYear(),
          vehicleTrim: vehicleData.trim || "Trim",
        });
      } catch (emailError) {
        console.error("[scheduleTestDrive] Email error:", emailError);
        // Don't fail the booking if email fails
      }

      return {
        success: true,
        message: `Test drive scheduled successfully for ${bookingDateTime.toLocaleDateString()} at ${bookingDateTime.toLocaleTimeString()}`,
        bookingId: booking?.id,
        link: `/test-drive?trim_id=${input.trimId}&year=${vehicleData.model_year}&make=${vehicleData.make}&model=${vehicleData.model}&trim=${vehicleData.trim}`,
        details: {
          date: bookingDateTime.toLocaleDateString(),
          time: bookingDateTime.toLocaleTimeString(),
          location: input.location || "downtown",
          vehicle: `${vehicleData.model_year} ${vehicleData.make} ${vehicleData.model} ${vehicleData.trim}`,
        },
      };
    } catch (error) {
      console.error("[scheduleTestDrive] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred while scheduling test drive",
      };
    }
  },
});

export const tools = {
  searchToyotaTrims: searchToyotaTrimsTool,
  displayCarRecommendations: displayCarRecommendationsTool,
  sendEmailHtml: sendEmailHtmlTool,
  estimateFinance: estimateFinanceTool,
  scheduleTestDrive: scheduleTestDriveTool,
} satisfies ToolSet;

export type ChatTools = InferUITools<typeof tools>;

// Re-export CarCard type for backward compatibility
export type { CarCard } from "@/lib/cars/types";

