import { tool, type ToolSet, type InferUITools } from "ai";
import { z } from "zod";
import { searchToyotaTrims } from "@/lib/cars/searchToyotaTrims";
import {
  searchToyotaTrimsInputSchema,
  displayCarRecommendationsInputSchema,
} from "@/lib/cars/schemas";
import type { CarCard } from "@/lib/cars/types";
import { sendEmailHtmlInputSchema } from "@/lib/email/schemas";
import { sendEmailHtml } from "@/lib/email/resend";

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
    "Send an email with raw HTML content via Resend. Use this tool when the user requests to send an email. Provide the recipient email address(es), subject line, and HTML content. Use responsibly and only when explicitly requested by the user.",
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

export const tools = {
  searchToyotaTrims: searchToyotaTrimsTool,
  displayCarRecommendations: displayCarRecommendationsTool,
  sendEmailHtml: sendEmailHtmlTool,
  estimateFinance: estimateFinanceTool,
} satisfies ToolSet;

export type ChatTools = InferUITools<typeof tools>;

// Re-export CarCard type for backward compatibility
export type { CarCard } from "@/lib/cars/types";

