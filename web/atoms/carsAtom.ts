import { atom } from "jotai"

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

export const carsAtom = atom<Car[]>([])

export const setCarsAtom = atom(
  null,
  (get, set, cars: Car[]) => {
    set(carsAtom, cars)
  }
)

