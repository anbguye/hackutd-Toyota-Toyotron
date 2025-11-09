import { atom } from "jotai"

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

export const preferencesAtom = atom<UserPreferences | null>(null)

export const setPreferencesAtom = atom(
  null,
  (get, set, preferences: UserPreferences) => {
    set(preferencesAtom, preferences)
  }
)

