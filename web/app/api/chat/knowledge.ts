/**
 * Static Toyota Knowledge Base
 * Used for generic queries that don't require database retrieval
 */

export const TOYOTA_KNOWLEDGE = {
  models: {
    sedans: {
      camry: {
        description: "The Toyota Camry is a mid-size sedan known for reliability, fuel efficiency, and comfort. Available in gas and hybrid powertrains.",
        price_range: "$26,420 - $35,380",
        mpg: "28-53 MPG combined (varies by trim and powertrain)",
        highlights: ["Reliable", "Fuel efficient", "Comfortable ride", "Available in hybrid"],
      },
      corolla: {
        description: "The Toyota Corolla is a compact sedan offering excellent fuel economy and value. Available in gas and hybrid versions.",
        price_range: "$21,900 - $28,310",
        mpg: "32-50 MPG combined",
        highlights: ["Affordable", "Great fuel economy", "Reliable", "Compact size"],
      },
      prius: {
        description: "The Toyota Prius is a hybrid compact car known for exceptional fuel economy and eco-friendly driving.",
        price_range: "$27,450 - $35,535",
        mpg: "52-57 MPG combined",
        highlights: ["Best-in-class fuel economy", "Hybrid technology", "Eco-friendly", "Low emissions"],
      },
    },
    suvs: {
      rav4: {
        description: "The Toyota RAV4 is a compact SUV offering versatility, capability, and available hybrid powertrain. Great for families and adventure.",
        price_range: "$28,275 - $40,330",
        mpg: "28-40 MPG combined",
        highlights: ["Versatile", "Available AWD", "Hybrid option", "Spacious interior"],
      },
      highlander: {
        description: "The Toyota Highlander is a mid-size SUV with three rows of seating, perfect for larger families. Available in gas and hybrid.",
        price_range: "$36,420 - $52,350",
        mpg: "24-36 MPG combined",
        highlights: ["Three-row seating", "Spacious", "Available hybrid", "Family-friendly"],
      },
      "4runner": {
        description: "The Toyota 4Runner is a body-on-frame SUV built for off-road adventure and towing capability.",
        price_range: "$38,760 - $52,200",
        mpg: "17-19 MPG combined",
        highlights: ["Off-road capable", "Strong towing", "Durable", "Adventure-ready"],
      },
    },
    trucks: {
      tacoma: {
        description: "The Toyota Tacoma is a mid-size pickup truck known for off-road capability and reliability.",
        price_range: "$28,400 - $48,200",
        mpg: "20-22 MPG combined",
        highlights: ["Off-road capable", "Reliable", "Versatile", "Strong resale value"],
      },
      tundra: {
        description: "The Toyota Tundra is a full-size pickup truck with powerful V6 and V8 engine options, ideal for towing and hauling.",
        price_range: "$38,765 - $60,000+",
        mpg: "18-20 MPG combined",
        highlights: ["Powerful engines", "Strong towing", "Spacious", "Full-size capability"],
      },
    },
  },
  general: {
    brand: "Toyota is known for reliability, quality, and value retention. The brand offers a wide range of vehicles from compact cars to full-size trucks.",
    hybrid_technology: "Toyota's hybrid technology combines a gasoline engine with an electric motor for improved fuel economy and reduced emissions. Many models offer hybrid variants.",
    safety: "Toyota Safety Sense is a suite of active safety features including Pre-Collision System, Lane Departure Alert, Dynamic Radar Cruise Control, and more. Available on most models.",
    warranty: "Toyota offers a 3-year/36,000-mile basic warranty and 5-year/60,000-mile powertrain warranty. Hybrid components have an 8-year/100,000-mile warranty.",
    financing: "Toyota offers various financing options including traditional loans, leases, and special APR offers. Monthly payments depend on vehicle price, down payment, loan term, and credit score.",
  },
  common_questions: {
    "best suv": "The best Toyota SUV depends on your needs. The RAV4 is great for most people, the Highlander offers three rows for larger families, and the 4Runner is built for off-road adventure.",
    "best sedan": "The Camry is Toyota's flagship sedan offering comfort and reliability. The Corolla is more affordable and fuel-efficient, while the Prius offers the best fuel economy.",
    "most reliable": "Toyota vehicles are consistently ranked among the most reliable. The Camry, Corolla, and RAV4 are particularly known for long-term reliability and low maintenance costs.",
    "best fuel economy": "The Prius offers the best fuel economy with up to 57 MPG combined. Hybrid versions of the Camry, Corolla, and RAV4 also offer excellent fuel economy.",
    "best for families": "The Highlander is ideal for larger families with its three-row seating. The RAV4 is great for smaller families, and the Sienna minivan offers maximum space and versatility.",
  },
};

/**
 * Check if query has structured constraints that require database search
 */
export function hasStructuredConstraints(query: string): boolean {
  const constraintKeywords = [
    // Budget constraints
    /\$\d+[kK]?/,
    /\d+[kK]\s*(budget|price|cost|under|below|less than|max|maximum)/i,
    /under\s*\$\d+/i,
    /below\s*\$\d+/i,
    /less than\s*\$\d+/i,
    /budget.*\$\d+/i,
    /price.*\$\d+/i,
    
    // Specific constraints
    /\d+\s*seats?/i,
    /\d+\s*passengers?/i,
    /(hybrid|electric|gas|gasoline|diesel)/i,
    /(AWD|FWD|RWD|4WD|all wheel|front wheel|rear wheel)/i,
    /(automatic|manual)\s*transmission/i,
    /\d+\s*mpg/i,
    /(min|minimum|max|maximum)\s*\d+/i,
    
    // Specific models with constraints
    /(camry|corolla|rav4|highlander|4runner|tacoma|tundra|prius|sienna).*\d+/i,
  ];

  return constraintKeywords.some(pattern => pattern.test(query));
}

/**
 * Check if query mentions payment/finance/lease
 */
export function mentionsFinance(query: string): boolean {
  const financeKeywords = [
    /(monthly|payment|payments?)/i,
    /(finance|financing|financed)/i,
    /(lease|leasing|leased)/i,
    /(loan|loans?)/i,
    /(down payment|downpayment)/i,
    /(interest|apr|rate)/i,
    /(afford|affordable|affordability)/i,
    /(cost per month|monthly cost)/i,
    /(how much.*month)/i,
    /(what.*monthly)/i,
  ];

  return financeKeywords.some(pattern => pattern.test(query));
}

/**
 * Get static knowledge response for generic queries
 */
export function getStaticKnowledgeResponse(query: string): string | null {
  const lowerQuery = query.toLowerCase();

  // Check for specific model questions
  for (const [category, models] of Object.entries(TOYOTA_KNOWLEDGE.models)) {
    for (const [model, info] of Object.entries(models)) {
      if (lowerQuery.includes(model)) {
        return `The **${model.charAt(0).toUpperCase() + model.slice(1)}** ${category === "sedans" ? "sedan" : category === "suvs" ? "SUV" : "truck"} ${info.description}\n\n**Price Range:** ${info.price_range}\n**Fuel Economy:** ${info.mpg}\n**Highlights:** ${info.highlights.join(", ")}`;
      }
    }
  }

  // Check common questions
  for (const [key, answer] of Object.entries(TOYOTA_KNOWLEDGE.common_questions)) {
    if (lowerQuery.includes(key)) {
      return answer;
    }
  }

  // Check for category questions
  if (lowerQuery.includes("suv") && !hasStructuredConstraints(query)) {
    return TOYOTA_KNOWLEDGE.common_questions["best suv"];
  }
  if (lowerQuery.includes("sedan") && !hasStructuredConstraints(query)) {
    return TOYOTA_KNOWLEDGE.common_questions["best sedan"];
  }
  if (lowerQuery.includes("reliable") || lowerQuery.includes("reliability")) {
    return TOYOTA_KNOWLEDGE.common_questions["most reliable"];
  }
  if (lowerQuery.includes("fuel") || lowerQuery.includes("mpg") || lowerQuery.includes("economy")) {
    return TOYOTA_KNOWLEDGE.common_questions["best fuel economy"];
  }
  if (lowerQuery.includes("family") || lowerQuery.includes("families")) {
    return TOYOTA_KNOWLEDGE.common_questions["best for families"];
  }

  // Generic Toyota information
  if (lowerQuery.includes("toyota") || lowerQuery.includes("brand")) {
    return TOYOTA_KNOWLEDGE.general.brand;
  }
  if (lowerQuery.includes("hybrid")) {
    return TOYOTA_KNOWLEDGE.general.hybrid_technology;
  }
  if (lowerQuery.includes("safety") || lowerQuery.includes("safety sense")) {
    return TOYOTA_KNOWLEDGE.general.safety;
  }
  if (lowerQuery.includes("warranty")) {
    return TOYOTA_KNOWLEDGE.general.warranty;
  }

  return null;
}

