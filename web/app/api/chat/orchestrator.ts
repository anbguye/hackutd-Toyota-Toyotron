import { hasStructuredConstraints, mentionsFinance, getStaticKnowledgeResponse } from "./knowledge";
import { intentAgent, vehicleAgent, financeAgent, reportAgent } from "./agents";
import type { IntentTask } from "./agents";

export type OrchestratorDecision = 
  | { type: "static_knowledge"; response: string }
  | { type: "vehicle_search"; task: IntentTask; needsFinance: boolean }
  | { type: "finance_only"; vehiclePrice: number }
  | { type: "standard_chat" };

/**
 * Orchestrator - Decides when to retrieve data vs use static knowledge
 */
export async function orchestrateQuery(
  userMessage: string,
  preferences?: any
): Promise<OrchestratorDecision> {
  const lowerMessage = userMessage.toLowerCase();

  // Check if query mentions finance/payment/lease
  if (mentionsFinance(userMessage)) {
    // Check if user is asking about finance for a specific vehicle
    const priceMatch = userMessage.match(/\$?(\d{1,3}(?:,\d{3})*(?:k|K)?)/);
    if (priceMatch) {
      let price = parseInt(priceMatch[1].replace(/,/g, "").replace(/[kK]/, "000"));
      if (price < 1000) {
        price = price * 1000; // Handle "40k" format
      }
      if (price > 10000 && price < 200000) {
        return { type: "finance_only", vehiclePrice: price };
      }
    }
  }

  // Check if query has structured constraints
  if (hasStructuredConstraints(userMessage)) {
    // Use multi-agent system for vehicle search
    try {
      const task = await intentAgent(userMessage, preferences);
      const needsFinance = task.needs_finance || mentionsFinance(userMessage);
      return { type: "vehicle_search", task, needsFinance };
    } catch (error) {
      console.error("[orchestrator] Error in intent agent:", error);
      // Fall through to static knowledge check
    }
  }

  // Check if we can answer from static knowledge
  const staticResponse = getStaticKnowledgeResponse(userMessage);
  if (staticResponse) {
    return { type: "static_knowledge", response: staticResponse };
  }

  // Default to standard chat (will use tools as needed)
  return { type: "standard_chat" };
}

