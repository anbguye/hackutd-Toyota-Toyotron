"use client";

import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Check } from "lucide-react"

import { ToyotaFooter } from "@/components/layout/toyota-footer"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { LogoutButton } from "@/components/auth/LogoutButton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const availableCars = [
  {
    id: 1,
    name: "RAV4 Hybrid",
    year: 2025,
    type: "SUV",
    seats: 5,
    mpg: { city: 41, highway: 38 },
    msrp: 36000,
    drive: "AWD",
    insurance: 145,
    image: "/toyota-rav4-hybrid.jpg",
  },
  {
    id: 2,
    name: "Camry",
    year: 2025,
    type: "Sedan",
    seats: 5,
    mpg: { city: 32, highway: 41 },
    msrp: 28000,
    drive: "FWD",
    insurance: 120,
    image: "/toyota-camry-modern.png",
  },
  {
    id: 3,
    name: "Highlander",
    year: 2025,
    type: "SUV",
    seats: 8,
    mpg: { city: 21, highway: 29 },
    msrp: 45000,
    drive: "AWD",
    insurance: 165,
    image: "/toyota-highlander.png",
  },
]

export default function ComparePage() {
  const [selectedCars] = useState([availableCars[0], availableCars[1], availableCars[2]])

  return (
    <RequireAuth>
      <div className="flex min-h-full flex-col bg-background text-foreground">
        <div className="toyota-container flex justify-end pt-6">
          <LogoutButton />
        </div>

        <div className="flex-1 space-y-16 pb-24">
          <section className="toyota-container space-y-6 pt-4">
            <div className="space-y-4">
              <span className="toyota-chip">Side-by-side intelligence</span>
              <div className="space-y-3">
                <h1 className="text-pretty text-3xl font-black tracking-tight text-secondary sm:text-4xl">
                  Compare Toyota models with clarity and confidence.
                </h1>
                <p className="max-w-3xl text-base text-muted-foreground sm:text-lg">
                  Toyota Agent surfaces curated specs, costs, and safety signals in an interface tuned for decision
                  making—balanced, legible, and unmistakably Toyota.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2.5rem] border border-border/70 bg-card/80 shadow-[0_36px_80px_-64px_rgba(15,20,26,0.85)]">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border/60">
                  <thead>
                    <tr className="bg-background/60 backdrop-blur">
                      <th className="px-6 py-5 text-left text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                        Feature
                      </th>
                      {selectedCars.map((car) => (
                        <th key={car.id} className="px-6 py-5">
                          <div className="space-y-4">
                            <div className="relative overflow-hidden rounded-3xl border border-border/70">
                              <div className="relative aspect-[4/3]">
                                <Image
                                  src={car.image}
                                  alt={car.name}
                                  fill
                                  className="object-cover"
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
                            <div className="text-2xl font-bold text-secondary">${car.msrp.toLocaleString()}</div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-sm">
                    <CompareRow label="Starting price">
                      {selectedCars.map((car) => (
                        <span key={car.id} className="font-semibold text-secondary">
                          ${car.msrp.toLocaleString()}
                        </span>
                      ))}
                    </CompareRow>
                    <CompareRow label="MPG (City/Hwy)" subtle>
                      {selectedCars.map((car) => (
                        <span key={car.id} className="font-semibold text-secondary">
                          {car.mpg.city}/{car.mpg.highway}
                        </span>
                      ))}
                    </CompareRow>
                    <CompareRow label="Seating">
                      {selectedCars.map((car) => (
                        <span key={car.id} className="font-semibold text-secondary">
                          {car.seats} seats
                        </span>
                      ))}
                    </CompareRow>
                    <CompareRow label="Drive type" subtle>
                      {selectedCars.map((car) => (
                        <span key={car.id} className="font-semibold text-secondary">
                          {car.drive}
                        </span>
                      ))}
                    </CompareRow>
                    <CompareRow label="Est. insurance">
                      {selectedCars.map((car) => (
                        <span key={car.id} className="font-semibold text-secondary">
                          ${car.insurance}/mo
                        </span>
                      ))}
                    </CompareRow>
                    <CompareRow label="Toyota Safety Sense" subtle>
                      {selectedCars.map((car) => (
                        <Check key={car.id} className="mx-auto h-5 w-5 text-primary" />
                      ))}
                    </CompareRow>
                    <CompareRow label="Apple CarPlay">
                      {selectedCars.map((car) => (
                        <Check key={car.id} className="mx-auto h-5 w-5 text-primary" />
                      ))}
                    </CompareRow>
                    <CompareRow label="Panoramic roof" subtle>
                      {selectedCars.map((car, i) =>
                        i === selectedCars.length - 1 ? (
                          <Check key={car.id} className="mx-auto h-5 w-5 text-primary" />
                        ) : (
                          <span key={car.id} className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                            Optional
                          </span>
                        ),
                      )}
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
            </div>
          </section>

          <section className="toyota-container">
            <div className="toyota-gradient relative overflow-hidden rounded-[2.25rem] px-10 py-12 sm:px-16">
              <div className="absolute -left-16 bottom-10 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl space-y-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                    Agent recommendation
                  </span>
                  <h2 className="text-pretty text-2xl font-semibold sm:text-3xl">
                    RAV4 Hybrid leads for balanced efficiency, budget, and confidence.
                  </h2>
                  <p className="text-sm text-white/85 sm:text-base">
                    With 41/38 MPG, standard Toyota Safety Sense 3.0, and AWD capability, the RAV4 Hybrid hits your
                    brief exactly. Toyota Agent can now tailor payment and insurance to your profile.
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
        </div>

        <ToyotaFooter />
      </div>
    </RequireAuth>
  )
}

type CompareRowProps = {
  label: string
  children: ReactNode[]
  subtle?: boolean
}

function CompareRow({ label, children, subtle }: CompareRowProps) {
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
