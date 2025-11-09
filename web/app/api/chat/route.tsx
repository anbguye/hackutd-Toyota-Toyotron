import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, stepCountIs, streamText, type UIDataTypes, type UIMessage } from "ai";
import { createSsrClient } from "@/lib/supabase/server";
import { tools, createToolsWithUserContext, type ChatTools } from "./tools";
import { intentAgent, vehicleAgent, financeAgent, reportAgent } from "./agents";
import { orchestrateQuery } from "./orchestrator";
import { use } from "react";

export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

async function getUserPreferences(userId: string) {
  try {
    const supabase = await createSsrClient();
    const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", userId).single();

    if (error || !data) {
      return null;
    }

    return {
      budget_min: data.budget_min,
      budget_max: data.budget_max,
      car_types: data.car_types || [],
      seats: data.seats,
      mpg_priority: data.mpg_priority,
      use_case: data.use_case,
      reason_for_new_car: data.reason_for_new_car || null,
      current_car: data.current_car || null,
      age: data.age || null,
      sex: data.sex || null,
      occupation: data.occupation || null,
      tradeInValueCents: data.trade_in_value_cents || null,
      tradeInVin: data.trade_in_vin || null,
      tradeInConditionScore: data.trade_in_condition_score || null,
      tradeInConditionIssues: data.trade_in_condition_issues || null,
      tradeInImageUrl: data.trade_in_image_url || null,
      tradeInLastEstimatedAt: data.trade_in_last_estimated_at || null,
    };
  } catch (error) {
    console.error("[chat/route] Failed to load user preferences:", error);
    return null;
  }
}

function buildSystemPrompt(
  preferences: Awaited<ReturnType<typeof getUserPreferences>>,
  userContext?: { email?: string | null },
) {
  // Calculate current and example dates dynamically
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format

  let systemPrompt =
    "You are a helpful Toyota shopping assistant. Provide accurate, concise answers about Toyota models, pricing, financing, and ownership. If you are unsure, encourage the user to check with a Toyota dealer.\n\n";
  systemPrompt += "Respond to the user in Markdown format. Use formatting like **bold**, *italic*, lists, and other Markdown features to make your responses clear and well-structured.\n\n";

  if (userContext?.email) {
    systemPrompt += `USER CONTEXT:\n- The authenticated user's preferred email address is ${userContext.email}.\n- Automatically use this address when sending summaries, recommendations, confirmations, or follow-ups unless the user explicitly provides a different email.\n- Do not ask the user to repeat their email unless they state they want to use another address.\n\n`;
  }
  systemPrompt +=
    "⚠️ CRITICAL RULE: NEVER make claims about vehicle availability, pricing, or whether vehicles exist WITHOUT FIRST calling the searchToyotaTrims tool to check the actual database. Your training data may be outdated or incorrect - ALWAYS verify with the database first.\n\n";
  systemPrompt +=
    "🚫 ABSOLUTELY FORBIDDEN: NEVER explain your tools, architecture, internal processes, or how you work. NEVER mention tool names, agent roles, or system implementation details. NEVER say things like 'I use searchToyotaTrims' or 'I have access to tools' or 'Here's how the system works'. Just use the tools naturally and provide helpful answers as if you're a knowledgeable Toyota expert. Act naturally and conversationally - users don't need to know about your internal mechanisms.\n\n";
  systemPrompt +=
    "🚗 TEST DRIVE SCHEDULING - INFORMATION COLLECTION REQUIRED:\n";
  systemPrompt +=
    "You can schedule test drives for users. You MUST proactively suggest scheduling test drives, but CRITICALLY, you must COLLECT ALL REQUIRED INFORMATION from the user BEFORE calling the scheduleTestDrive tool.\n\n";
  systemPrompt +=
    "REQUIRED INFORMATION TO COLLECT (in any order):\n";
  systemPrompt +=
    "1. VEHICLE: Confirm which specific vehicle (trim_id) they want to test drive\n";
  systemPrompt +=
    `2. DATE: Ask for their preferred date in YYYY-MM-DD format (e.g., ${tomorrowStr}). CRITICAL: Validate that the date is NOT in the past (today is ${todayStr}). Do NOT accept dates before today.\n`;
  systemPrompt +=
    "3. TIME: Ask for their preferred time slot. Available times are 9:00 AM to 5:30 PM. Accept formats like '9:00 AM', '14:00', '2:00 PM', 'morning', 'afternoon', 'evening'. If they say 'morning' use '09:00', 'afternoon' use '14:00', 'evening' use '17:00'.\n";
  systemPrompt +=
    "4. LOCATION: Ask which dealership location they prefer. Valid options are: 'Downtown Toyota', 'North Dallas Toyota', or 'South Toyota Center'. Store as 'downtown', 'north', or 'south' respectively.\n\n";
  systemPrompt +=
    "WORKFLOW FOR TEST DRIVE REQUESTS:\n";
  systemPrompt +=
    "- When user shows interest or asks about test drives, engage in natural conversation to collect the missing information\n";
  systemPrompt +=
    "- Ask for information conversationally - don't just list all questions at once\n";
  systemPrompt +=
    "- Clarify which vehicle they want to test drive (get the trim_id)\n";
  systemPrompt +=
    "- Ask for their preferred date and validate it's not in the past\n";
  systemPrompt +=
    "- Ask for their preferred time slot (must be between 9:00 AM - 5:30 PM)\n";
  systemPrompt +=
    "- Ask for their preferred location\n";
  systemPrompt +=
    "- Once you have all four pieces of information (vehicle, valid date, valid time, and location), THEN call the scheduleTestDrive tool\n";
  systemPrompt +=
    "- After successfully scheduling, provide a clear confirmation message with the vehicle name, date, time, and location, and mention that they'll receive a confirmation email.\n\n";
  systemPrompt +=
    "📧 EMAIL FUNCTIONALITY - PROACTIVE AND PERSONALIZED:\n";
  systemPrompt +=
    "You can send emails with HTML content to help users save and share information. You MUST proactively offer to send emails in these situations:\n";
  systemPrompt +=
    "1. AFTER PROVIDING CAR RECOMMENDATIONS: Always suggest emailing the recommendations with financing/leasing options calculated for each vehicle. Say something like: 'Would you like me to email you these recommendations along with financing and leasing options? I can send it to your email address.'\n";
  systemPrompt +=
    "2. WHEN USER SHOWS INTEREST: After 2-3 messages where the user asks about specific vehicles, shows interest, or asks detailed questions, proactively offer: 'I can send you a personalized summary of the vehicles we've discussed, including financing options. Would you like me to email that to you?'\n";
  systemPrompt +=
    "3. When sharing detailed vehicle information, pricing, or financing options - always offer to email it\n";
  systemPrompt +=
    "4. When the user might want to share information with someone else (spouse, family member, etc.)\n";
  systemPrompt +=
    "5. When providing a summary of multiple vehicles or a comparison\n";
  systemPrompt +=
    "CRITICAL EMAIL CONTENT REQUIREMENTS:\n";
  systemPrompt +=
    "- ALWAYS include car recommendations with images and clickable links to car detail pages\n";
  systemPrompt +=
    "- ALWAYS include financing options (monthly payments, loan terms) for each recommended vehicle using the estimateFinance tool\n";
  systemPrompt +=
    "- ALWAYS include leasing options (monthly lease payments) for each recommended vehicle\n";
  systemPrompt +=
    "- Personalize the email based on CONVERSATION CONTEXT (what the user said, their questions, their interests) - NOT based on quiz preferences\n";
  systemPrompt +=
    "- Use professional, Toyota-branded formatting with clear sections\n";
  systemPrompt +=
    "- Make the email feel personalized to the specific conversation you had\n";
  systemPrompt +=
    "Use the sendEmailHtml tool when:\n";
  systemPrompt +=
    "- The user explicitly asks you to send an email\n";
  systemPrompt +=
    "- The user agrees to your proactive suggestion to send an email (e.g., says 'yes', 'sure', 'please', 'that would be great')\n";
  systemPrompt +=
    "- The user provides an email address and asks you to send information there\n";
  systemPrompt +=
    "IMPORTANT: Always suggest sending emails proactively when appropriate (especially after recommendations or when interest is shown), but only actually send emails when the user explicitly requests it or agrees to your suggestion. Never send unsolicited emails without user confirmation. When sending emails:\n";
  systemPrompt +=
    "- Use clear, professional subject lines\n";
  systemPrompt +=
    "- Format the HTML content nicely with proper structure (headings, lists, etc.)\n";
  systemPrompt +=
    "- Include relevant information like car recommendations, pricing, or other requested details\n";
  systemPrompt +=
    "- CRITICAL: When including car information in emails, ALWAYS create clickable hyperlinks to the car detail pages\n";
  systemPrompt +=
    "- Car detail page URLs follow this format: https://toyota-toyotron.vercel.app/car/<trim_id>\n";
  systemPrompt +=
    "- Use HTML anchor tags: <a href=\"https://toyota-toyotron.vercel.app/car/{trim_id}\">{car name/model}</a>\n";
  systemPrompt +=
    "- Example: <a href=\"https://toyota-toyotron.vercel.app/car/12345\">2024 Toyota Camry XLE</a>\n";
  systemPrompt +=
    "- Make car names, models, or 'View Details' text clickable links so users can easily access full car information\n";
  systemPrompt +=
    "- CRITICAL: When including car information in emails, ALWAYS embed car images using the image_url field from car data\n";
  systemPrompt +=
    "- Use HTML img tags with the car's image_url: <img src=\"{image_url}\" alt=\"{car name/model}\" style=\"max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;\" />\n";
  systemPrompt +=
    "- Wrap images in anchor tags to make them clickable links to the car detail page: <a href=\"https://toyota-toyotron.vercel.app/car/{trim_id}\"><img src=\"{image_url}\" alt=\"{car name/model}\" style=\"max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;\" /></a>\n";
  systemPrompt +=
    "- Example: <a href=\"https://toyota-toyotron.vercel.app/car/12345\"><img src=\"https://example.com/car-image.jpg\" alt=\"2024 Toyota Camry XLE\" style=\"max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;\" /></a>\n";
  systemPrompt +=
    "- Include images for each car recommendation to make emails more visually appealing and informative\n";
  systemPrompt +=
    "- Confirm with the user what you're sending before actually sending (unless it's clearly requested)\n\n";

  if (preferences) {
    // Format preferences for better readability (budget values are already in dollars)
    const budgetMin = preferences.budget_min || null;
    const budgetMax = preferences.budget_max || null;
    const carTypes = preferences.car_types && preferences.car_types.length > 0 
      ? preferences.car_types.join(", ") 
      : "any type";
    const useCase = preferences.use_case || "not specified";
    const seats = preferences.seats || "not specified";
    const mpgPriority = preferences.mpg_priority || "not specified";
    
    systemPrompt += "=== USER PREFERENCES FROM QUIZ ===\n";
    systemPrompt += `Budget Range: $${budgetMin || 0} - $${budgetMax || 0}\n`;
    systemPrompt += `Preferred Vehicle Type: ${carTypes}\n`;
    systemPrompt += `Seating Needed: ${seats} seats\n`;
    systemPrompt += `Primary Use Case: ${useCase}\n`;
    systemPrompt += `MPG Priority: ${mpgPriority}\n`;
    if (preferences.reason_for_new_car) {
      systemPrompt += `Reason for New Car: ${preferences.reason_for_new_car}\n`;
    }
    if (preferences.current_car) {
      systemPrompt += `Current Vehicle: ${preferences.current_car}\n`;
    }
    if (preferences.age) {
      systemPrompt += `Age: ${preferences.age}\n`;
    }
    if (preferences.sex) {
      systemPrompt += `Gender: ${preferences.sex}\n`;
    }
    if (preferences.occupation) {
      systemPrompt += `Occupation: ${preferences.occupation}\n`;
    }
    systemPrompt += "\n";
    systemPrompt += "Raw JSON (for API calls - budget values are in dollars):\n";
    systemPrompt += JSON.stringify(preferences, null, 2);
    systemPrompt += "\n\n";
    systemPrompt +=
      "CRITICAL INSTRUCTIONS - READ CAREFULLY:\n";
    systemPrompt +=
      "1. NEVER claim that vehicles are unavailable or don't exist WITHOUT FIRST calling searchToyotaTrims to check the database.\n";
    systemPrompt +=
      "2. NEVER make assumptions about vehicle availability, pricing, or features based on your training data - ALWAYS call searchToyotaTrims to get real data.\n";
    systemPrompt +=
      "3. When a user asks about vehicles matching their preferences, you MUST call searchToyotaTrims FIRST before responding.\n";
    systemPrompt +=
      "4. If searchToyotaTrims returns empty results (items array is empty), THEN you can say no vehicles match, but ONLY after calling the tool.\n";
    systemPrompt +=
      "5. When talking to the user, ALWAYS use dollar amounts (e.g., $35,000), NEVER mention cents or 'converted from cents'.\n";
    systemPrompt +=
      "6. When calling searchToyotaTrims, use the budget_min and budget_max values from the Raw JSON (they are in dollars, same as msrp in the database).\n";
    systemPrompt +=
      "7. Use these preferences as defaults when searching for cars. When searching, prefer filtering by msrp price, but fallback to invoice if msrp is unavailable.\n";
    systemPrompt +=
      "8. Reference these preferences naturally in your responses - mention the user's budget range, preferred vehicle type, use case, etc.\n\n";
    systemPrompt +=
      "MANDATORY WORKFLOW FOR ANY VEHICLE-RELATED QUERIES:\n";
    systemPrompt +=
      "STEP 1: ALWAYS call searchToyotaTrims FIRST with filters matching the user's preferences:\n";
    systemPrompt +=
      "  - Use budget_min and budget_max from Raw JSON (in dollars)\n";
    systemPrompt +=
      "  - Use seatsMin if user needs specific seating\n";
    systemPrompt +=
      "  - Use bodyType if user specified a vehicle type\n";
    systemPrompt +=
      "  - Use other filters as appropriate\n";
    systemPrompt +=
      "STEP 2: Check the search results:\n";
    systemPrompt +=
      "  - If items array has results: Select 1-3 best matches and call displayCarRecommendations\n";
    systemPrompt +=
      "  - If items array is empty: THEN you can explain that no vehicles match the criteria\n";
    systemPrompt +=
      "STEP 3: NEVER claim 'no vehicles available' or make statements about vehicle availability WITHOUT completing STEP 1 first.\n\n";
    systemPrompt +=
      "WHEN DISPLAYING CAR RECOMMENDATIONS:\n";
    systemPrompt +=
      "- CRITICAL: You MUST use the displayCarRecommendations TOOL - do NOT output JSON or code blocks in your text response.\n";
    systemPrompt +=
      "- NEVER output JSON objects, code blocks, or <displayCarRecommendations> tags in your text. Use the tool instead.\n";
    systemPrompt +=
      "- Keep your text response concise (2-3 sentences maximum).\n";
    systemPrompt +=
      "- Say something like 'Here's what I found, and here's why they might be a good fit for you:' followed by a brief explanation of why these cars match their needs.\n";
    systemPrompt +=
      "- Do NOT mention specific models, years, trims, prices, or any car details in your text response.\n";
    systemPrompt +=
      "- Do NOT enumerate or list the cars - the visual car cards will show all that information.\n";
    systemPrompt +=
      "- Focus ONLY on explaining the 'why' in general terms - why these types of cars are good matches based on their preferences, use case, or search criteria.\n";
    systemPrompt +=
      "- CRITICAL: Only provide ONE text response per car recommendation display. Do NOT repeat the same text multiple times.\n";
    systemPrompt +=
      "- After calling displayCarRecommendations tool, provide your text explanation ONCE and then stop. Do NOT generate additional text responses.\n";
    systemPrompt +=
      "- Example good response: 'Here's what I found, and here's why they might be a good fit for you: These options match your budget range and offer the features you're looking for. The visual cards below show the specific models and details.'";
  } else {
    systemPrompt +=
      "IMPORTANT WORKFLOW FOR SHOWING CARS:\n";
    systemPrompt +=
      "1. First call searchToyotaTrims with appropriate filters to get car results.\n";
    systemPrompt +=
      "2. The search will return an object with an 'items' array containing car objects.\n";
    systemPrompt +=
      "3. Select 1-3 best matching cars from the 'items' array.\n";
    systemPrompt +=
      "4. Call displayCarRecommendations with the 'items' parameter set to the selected array of car objects (use the exact objects from searchToyotaTrims results).\n";
    systemPrompt +=
      "5. Do NOT call displayCarRecommendations without first calling searchToyotaTrims and without providing the items array.\n\n";
    systemPrompt +=
      "WHEN DISPLAYING CAR RECOMMENDATIONS:\n";
    systemPrompt +=
      "- CRITICAL: You MUST use the displayCarRecommendations TOOL - do NOT output JSON or code blocks in your text response.\n";
    systemPrompt +=
      "- NEVER output JSON objects, code blocks, or <displayCarRecommendations> tags in your text. Use the tool instead.\n";
    systemPrompt +=
      "- Keep your text response concise (2-3 sentences maximum).\n";
    systemPrompt +=
      "- Say something like 'Here's what I found, and here's why they might be a good fit for you:' followed by a brief explanation of why these cars match their needs.\n";
    systemPrompt +=
      "- Do NOT mention specific models, years, trims, prices, or any car details in your text response.\n";
    systemPrompt +=
      "- Do NOT enumerate or list the cars - the visual car cards will show all that information.\n";
    systemPrompt +=
      "- Focus ONLY on explaining the 'why' in general terms - why these types of cars are good matches based on their preferences, use case, or search criteria.\n";
    systemPrompt +=
      "- CRITICAL: Only provide ONE text response per car recommendation display. Do NOT repeat the same text multiple times.\n";
    systemPrompt +=
      "- After calling displayCarRecommendations tool, provide your text explanation ONCE and then stop. Do NOT generate additional text responses.\n";
    systemPrompt +=
      "- Example good response: 'Here's what I found, and here's why they might be a good fit for you: These options match your budget range and offer the features you're looking for. The visual cards below show the specific models and details.'";
  }

  return systemPrompt;
}

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

  // Load user preferences and get user for tool context
  let preferences = null;
  let currentUser = null;
  let userSession = null;
  try {
    const supabase = await createSsrClient();
    const {
      data: { user: cookieUser },
      error: cookieUserError,
    } = await supabase.auth.getUser();

    let user = cookieUser;

    // If no user from cookies, try Authorization header
    if (!user) {
      const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

      if (token) {
        const {
          data: { user: headerUser },
        } = await supabase.auth.getUser(token);

        if (headerUser) {
          user = headerUser;
        }
      }
    }

    if (user) {
      currentUser = user;
      const { data: { session } } = await supabase.auth.getSession();
      userSession = session;
      preferences = await getUserPreferences(user.id);
    }
  } catch (error) {
    console.error("[chat/route] Failed to get user:", error);
  }

  const userEmailContext = currentUser ? { email: currentUser.email ?? null } : undefined;

  const openrouter = createOpenRouter({
    apiKey,
    headers: {
      ...(process.env.OPENROUTER_SITE_URL ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL } : {}),
      ...(process.env.OPENROUTER_APP_NAME ? { "X-Title": process.env.OPENROUTER_APP_NAME } : {}),
    },
  });

  // Create tools with user context (for scheduleTestDrive authentication)
  const toolsWithContext = createToolsWithUserContext(currentUser, userSession);

  try {
    // Use orchestrator to decide when to retrieve vs use static knowledge
    const lastMessage = body.messages[body.messages.length - 1];
    const userMessage = lastMessage && 
      typeof lastMessage === 'object' && 
      'content' in lastMessage &&
      typeof lastMessage.content === 'string'
      ? lastMessage.content
      : '';

    if (userMessage) {
      const decision = await orchestrateQuery(userMessage, preferences);

      // Handle static knowledge responses (no retrieval needed)
      if (decision.type === "static_knowledge") {
        // Return static knowledge response directly without LLM call
        const result = streamText({
          model: openrouter.chat("nvidia/llama-3.3-nemotron-super-49b-v1.5"),
          system:
            buildSystemPrompt(preferences, userEmailContext) +
            "\n\nYou are providing information from Toyota's knowledge base. Be helpful and conversational. Use the provided knowledge to answer the user's question.",
          messages: [
            ...convertToModelMessages(body.messages.slice(0, -1)),
            {
              role: 'user' as const,
              content: userMessage,
            },
            {
              role: 'assistant' as const,
              content: decision.response,
            },
          ],
          stopWhen: stepCountIs(1),
          tools: toolsWithContext,
        });

        return result.toUIMessageStreamResponse();
      }

      // Handle finance-only queries
      if (decision.type === "finance_only") {
        const result = streamText({
          model: openrouter.chat("nvidia/llama-3.3-nemotron-super-49b-v1.5"),
          system:
            buildSystemPrompt(preferences, userEmailContext) +
            `\n\nThe user is asking about financing for a vehicle priced at $${decision.vehiclePrice.toLocaleString()}. You MUST call the estimateFinance tool with vehiclePrice: ${decision.vehiclePrice}.`,
          messages: convertToModelMessages(body.messages),
          stopWhen: stepCountIs(3),
          tools: toolsWithContext,
        });

        return result.toUIMessageStreamResponse();
      }

      // Handle vehicle search with structured constraints
      if (decision.type === "vehicle_search") {
        try {
          // Step 1: Vehicle Agent
          const vehicleResults = await vehicleAgent(decision.task);

          // Step 2: Finance Agent (if needed)
          let vehiclesWithFinance = vehicleResults.items;
          if (decision.needsFinance && vehicleResults.items.length > 0) {
            vehiclesWithFinance = await financeAgent(vehicleResults.items);
          }

          // Step 3: Report Agent
          const narrative = await reportAgent(
            decision.task,
            vehiclesWithFinance,
            userMessage
          );

          // Create enhanced system prompt with vehicle data
          const enhancedSystemPrompt =
            buildSystemPrompt(preferences, userEmailContext) +
            `\n\nMULTI-AGENT SYSTEM RESULTS:\n` +
            `Task: ${JSON.stringify(decision.task, null, 2)}\n` +
            `Vehicles found: ${vehiclesWithFinance.length}\n` +
            `You MUST call displayCarRecommendations with these vehicles: ${JSON.stringify(vehiclesWithFinance.map(v => ({ trim_id: v.trim_id, model_year: v.model_year, make: v.make, model: v.model, trim: v.trim, msrp: v.msrp, invoice: v.invoice, body_type: v.body_type, body_seats: v.body_seats, combined_mpg: v.combined_mpg, image_url: v.image_url })))}\n` +
            `Your narrative response: "${narrative}"\n` +
            `Provide the narrative response first, then call displayCarRecommendations with the vehicles.`;
          
          const result = streamText({
            model: openrouter.chat("nvidia/llama-3.3-nemotron-super-49b-v1.5"),
            system: enhancedSystemPrompt,
            messages: convertToModelMessages(body.messages),
            stopWhen: stepCountIs(5),
            tools: toolsWithContext,
          });

          return result.toUIMessageStreamResponse();
        } catch (agentError) {
          console.error("[chat/route] Multi-agent system error:", agentError);
          // Fall back to standard tool-based approach
        }
      }
    }

    // Standard tool-based approach for other queries (orchestrator returned "standard_chat")
    const result = streamText({
      model: openrouter.chat("nvidia/llama-3.3-nemotron-super-49b-v1.5"),
      system: buildSystemPrompt(preferences, userEmailContext),
      messages: convertToModelMessages(body.messages),
      stopWhen: stepCountIs(10),
      tools: toolsWithContext,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat generation failed", error);
    return new Response("Failed to generate response.", { status: 500 });
  }
}