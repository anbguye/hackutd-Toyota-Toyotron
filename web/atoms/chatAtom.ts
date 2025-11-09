import { atom } from "jotai"

export interface ChatMessage {
  role: "user" | "agent"
  content: string
  timestamp?: string
  suggestions?: string[]
  carSuggestions?: CarSuggestion[]
}

export interface CarSuggestion {
  carId: string
  name: string
  reasoning: string
  matchScore?: number
}

export const chatAtom = atom<ChatMessage[]>([])

export const addMessageAtom = atom(
  null,
  (get, set, message: ChatMessage) => {
    const currentMessages = get(chatAtom)
    set(chatAtom, [...currentMessages, message])
  }
)

export const clearChatAtom = atom(null, (get, set) => {
  set(chatAtom, [])
})

