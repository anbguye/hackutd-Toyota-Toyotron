"use client";

import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"

import type { Car } from "@/lib/supabase/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { scanLine, rowHover } from "@/lib/motion/variants"
import { useReducedMotion } from "@/lib/motion/useReducedMotion"
import { cn } from "@/lib/utils"

export function CompareClient() {
  const searchParams = useSearchParams()
  const [selectedCars, setSelectedCars] = useState<Car[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const compareParam = searchParams.get("compare")
    if (!compareParam) {
      setIsLoading(false)
      return
    }

    const carIds = compareParam.split(",").filter(Boolean)
    if (carIds.length === 0) {
      setIsLoading(false)
      return
    }

    const fetchCars = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(`/api/cars?page=1&page_size=100`)
        if (!response.ok) {
          throw new Error("Failed to fetch cars")
        }
        const data = (await response.json()) as { items?: Car[] }
        const allCars = data.items ?? []
        const cars = allCars.filter((car) => carIds.includes(car.id))
        setSelectedCars(cars.slice(0, 3))
      } catch (err) {
        console.error("Failed to fetch comparison cars:", err)
        setError("Unable to load comparison data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCars()
  }, [searchParams])

  return (
    <>
      {error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          {error}
        </div>
      ) : selectedCars.length === 0 && !isLoading ? (
        <div className="rounded-2xl border border-border/70 bg-card/70 p-10 text-center">
          <p className="text-lg font-semibold text-secondary">No vehicles selected for comparison</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Go to the <Link href="/browse" className="text-primary hover:underline">browse page</Link> and select vehicles to compare.
          </p>
        </div>
      ) : selectedCars.length > 0 && (
        <motion.div
          className="overflow-hidden rounded-[2.5rem] border border-border/70 bg-card/80 shadow-[0_36px_80px_-64px_rgba(15,20,26,0.85)] backdrop-blur-md border-white/10"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* Scan line animation */}
          {!prefersReducedMotion && (
            <motion.div
              className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-primary to-transparent z-10"
              variants={scanLine}
              initial="hidden"
              animate="show"
            />
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border/60">
              <thead>
                <tr className="bg-background/60 backdrop-blur relative">
                  <th className="px-6 py-5 text-left text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                    Feature
                  </th>
                  {selectedCars.map((car) => (
                    <th key={car.id} className="px-6 py-5">
                      <div className="space-y-4">
                        <div className="relative overflow-hidden rounded-3xl border border-border/70">
                          <div className="relative aspect-[4/3]">
                            <Image
                              src={car.image || "/placeholder.svg"}
                              alt={car.name}
                              fill
                              className="object-contain"
                              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 45vw, 90vw"
                            />
                          </div>
                          <div className="absolute left-4 top-4">
                            <Badge className="rounded-full border-border/60 bg-background/85 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-secondary">
                              {car.year}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl font-semibold text-secondary">{car.name}</h3>
                          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">{car.type}</p>
                        </div>
                        <div className="text-2xl font-bold text-secondary">${car.msrp?.toLocaleString() || "—"}</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm">
                <CompareRow label="Starting price">
                  {selectedCars.map((car) => (
                    <span key={car.id} className="font-semibold text-secondary">
                      ${car.msrp?.toLocaleString() || "—"}
                    </span>
                  ))}
                </CompareRow>
                <CompareRow label="MPG (City/Hwy)" subtle>
                  {selectedCars.map((car) => (
                    <span key={car.id} className="font-semibold text-secondary">
                      {car.mpgCity || "—"}/{car.mpgHighway || "—"}
                    </span>
                  ))}
                </CompareRow>
                <CompareRow label="Seating">
                  {selectedCars.map((car) => (
                    <span key={car.id} className="font-semibold text-secondary">
                      {car.seats ? `${car.seats} seats` : "—"}
                    </span>
                  ))}
                </CompareRow>
                <CompareRow label="Drive type" subtle>
                  {selectedCars.map((car) => (
                    <span key={car.id} className="font-semibold text-secondary">
                      {car.drive || "—"}
                    </span>
                  ))}
                </CompareRow>
                <tr className="bg-background/70">
                  <td className="px-6 py-5"></td>
                  {selectedCars.map((car) => (
                    <td key={car.id} className="px-6 py-5">
                      <div className="flex flex-col gap-3">
                        <Link href={`/car/${car.id}`}>
                          <Button className="h-11 w-full rounded-full font-semibold">
                            View details
                          </Button>
                        </Link>
                        <Link href="/test-drive">
                          <Button
                            variant="outline"
                            className="h-11 w-full rounded-full border-border/70 font-semibold hover:border-primary/70 hover:text-primary"
                          >
                            Schedule test drive
                          </Button>
                        </Link>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {selectedCars.length > 0 && (
        <section className="toyota-container">
          <div className="toyota-gradient relative overflow-hidden rounded-[2.25rem] px-10 py-12 sm:px-16">
            <div className="absolute -left-16 bottom-10 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                  Next steps
                </span>
                <h2 className="text-pretty text-2xl font-semibold sm:text-3xl">
                  Ready to take the next step?
                </h2>
                <p className="text-sm text-white/85 sm:text-base">
                  You're comparing {selectedCars.length} vehicle{selectedCars.length !== 1 ? "s" : ""}. Let Toyota Agent help you explore financing options, schedule test drives, and make the right choice for your needs.
                </p>
              </div>
              <Link href="/chat">
                <Button className="h-12 rounded-full bg-white px-8 text-sm font-semibold text-secondary hover:bg-white/90">
                  Ask the agent for next steps
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  )
}

type CompareRowProps = {
  label: string
  children: ReactNode[]
  subtle?: boolean
}

function CompareRow({ label, children, subtle }: CompareRowProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return (
      <tr className={subtle ? "bg-background/55" : undefined}>
        <td className="px-6 py-5 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          {label}
        </td>
        {children.map((child, index) => (
          <td key={index} className="px-6 py-5 text-center">
            {child}
          </td>
        ))}
      </tr>
    )
  }

  return (
    <motion.tr
      className={cn("relative", subtle ? "bg-background/55" : undefined)}
      variants={rowHover}
      initial="rest"
      whileHover="hover"
    >
      <td className="px-6 py-5 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </td>
      {children.map((child, index) => (
        <td key={index} className="px-6 py-5 text-center">
          {child}
        </td>
      ))}
    </motion.tr>
  )
}
