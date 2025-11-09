// Shared types for Supabase data structures

export interface Car {
  id: string
  name: string
  year: number
  type: string
  seats: number
  powertrain?: string
  msrp: number // in cents
  mpg_city?: number
  mpg_hwy?: number
  drive?: string
  tags?: string[]
  reliability_score?: number
}

export interface UserPreferences {
  id?: string
  user_id?: string
  budget_min?: number // in cents
  budget_max?: number // in cents
  car_types?: string[]
  seats?: number
  mpg_priority?: "high" | "medium" | "low"
  use_case?: string
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp?: string
  suggestions?: CarSuggestion[]
}

export interface CarSuggestion {
  carId: string
  name: string
  reasoning: string
  matchScore?: number
}

export interface TestDriveBooking {
  id: string
  user_id: string
  car_id: string
  preferred_location: string
  booking_date: string // ISO 8601
  status: "pending" | "confirmed" | "completed"
}

