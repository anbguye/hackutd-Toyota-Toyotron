"use client";

import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Calendar, DollarSign, Fuel, Gauge, GitCompare, Users, Zap } from "lucide-react"

import { ToyotaFooter } from "@/components/layout/toyota-footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const car = {
  name: "RAV4 Hybrid",
  year: 2025,
  type: "SUV",
  seats: 5,
  mpg: { city: 41, highway: 38 },
  msrp: 36000,
  drive: "AWD",
  powertrain: "Hybrid",
  image: "/toyota-rav4-hybrid.jpg",
}

const insurance = {
  monthly: 145,
  annual: 1740,
}

const financing = [
  { term: 36, payment: 1056, total: 38016, rate: 4.5 },
  { term: 48, payment: 815, total: 39120, rate: 4.5 },
  { term: 60, payment: 671, total: 40260, rate: 4.5 },
  { term: 72, payment: 577, total: 41544, rate: 4.5 },
]

export default function CarDetailPage() {
  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <div className="flex-1 space-y-16 pb-24">
        <section className="toyota-container space-y-6">
          <Link href="/browse" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-secondary">
            <ArrowLeft className="h-4 w-4" />
            Back to Browse
          </Link>

          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/80 shadow-[0_32px_75px_-60px_rgba(15,20,26,0.8)]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-secondary/20" />
              <div className="relative aspect-[4/3]">
                <Image
                  src={car.image || "/placeholder.svg"}
                  alt={car.name}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1280px) 50vw, (min-width: 768px) 60vw, 100vw"
                  priority
                />
              </div>
              <div className="absolute left-6 top-6">
                <Badge className="rounded-full border-border/60 bg-background/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
                  {car.year} Model
                </Badge>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground/80">
                  Toyota hybrid flagship
                </span>
                <h1 className="text-balance text-4xl font-black tracking-tight text-secondary sm:text-5xl">
                  {car.name}
                </h1>
                <p className="text-base text-muted-foreground">
                  {car.type} • {car.powertrain}
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-secondary">${car.msrp.toLocaleString()}</span>
                  <span className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">MSRP</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <SpecCard icon={<Fuel className="h-5 w-5" />} label="MPG (City/Hwy)">
                  {car.mpg.city}/{car.mpg.highway}
                </SpecCard>
                <SpecCard icon={<Users className="h-5 w-5" />} label="Seating">
                  {car.seats} seats
                </SpecCard>
                <SpecCard icon={<Gauge className="h-5 w-5" />} label="Drive Type">
                  {car.drive}
                </SpecCard>
                <SpecCard icon={<Zap className="h-5 w-5" />} label="Powertrain">
                  {car.powertrain}
                </SpecCard>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/test-drive" className="flex-1 min-w-[220px]">
                  <Button className="h-12 w-full rounded-full px-6 text-sm font-semibold shadow-[0_24px_48px_-32px_rgba(235,10,30,0.7)]">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule test drive
                  </Button>
                </Link>
                <Link href="/compare" className="min-w-[160px]">
                  <Button
                    variant="outline"
                    className="h-12 w-full rounded-full border-border/70 px-6 text-sm font-semibold hover:border-primary/70 hover:text-primary"
                  >
                    <GitCompare className="mr-2 h-4 w-4" />
                    Compare
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="toyota-container space-y-8">
          <Tabs defaultValue="costs" className="space-y-8">
            <TabsList className="grid gap-3 rounded-full bg-background/40 p-2 sm:grid-cols-3">
              <TabsTrigger value="costs" className="rounded-full px-6 py-3 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Total Costs
              </TabsTrigger>
              <TabsTrigger value="specs" className="rounded-full px-6 py-3 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Full Specs
              </TabsTrigger>
              <TabsTrigger value="features" className="rounded-full px-6 py-3 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Features
              </TabsTrigger>
            </TabsList>

            <TabsContent value="costs" className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-6">
                <div className="rounded-3xl border border-border/70 bg-card/80 p-8">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-secondary">Insurance Estimate</h3>
                      <p className="text-sm text-muted-foreground">Based on an average Toyota driver profile</p>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/60 bg-background/80 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Monthly</p>
                      <p className="mt-3 text-2xl font-bold text-secondary">${insurance.monthly}</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-background/80 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Annual</p>
                      <p className="mt-3 text-2xl font-bold text-secondary">${insurance.annual}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-border/70 bg-card/80 p-8">
                  <h3 className="text-lg font-semibold text-secondary">Financing Scenarios</h3>
                  <div className="mt-5 space-y-4">
                    {financing.map((option) => (
                      <div
                        key={option.term}
                        className="rounded-2xl border border-border/60 bg-background/80 p-5 transition-all hover:border-primary/60"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-secondary">{option.term}-month term</p>
                            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{option.rate}% APR</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-secondary">${option.payment}</p>
                            <p className="text-xs text-muted-foreground">Per month</p>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-between border-t border-dashed border-border/60 pt-3 text-xs text-muted-foreground">
                          <span>Total Paid</span>
                          <span className="font-semibold text-secondary">${option.total.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-primary/50 bg-primary/5 p-8">
                <h3 className="text-lg font-semibold text-secondary">Total Monthly Snapshot</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Toyota Agent combines payment + protection so you know the real cost before stepping into the
                  dealership.
                </p>
                <div className="mt-6 space-y-4">
                  <OwnershipRow label="Car payment" value="$671/mo" />
                  <OwnershipRow label="Insurance" value="$145/mo" />
                  <OwnershipRow label="Maintenance reserve" value="$45/mo" />
                  <div className="h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                  <OwnershipRow label="Total" value="$861/mo" accent />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="specs" className="rounded-3xl border border-border/70 bg-card/80 p-8">
              <div className="grid gap-10 lg:grid-cols-2">
                <SpecGroup
                  title="Performance"
                  specs={[
                    { label: "Engine", value: "2.5L 4-Cyl Hybrid DOHC" },
                    { label: "Horsepower", value: "219 hp combined" },
                    { label: "Torque", value: "163 lb-ft" },
                    { label: "Transmission", value: "Electronic CVT" },
                  ]}
                />
                <SpecGroup
                  title="Dimensions"
                  specs={[
                    { label: "Length", value: "180.9 in" },
                    { label: "Width", value: "73.0 in" },
                    { label: "Ground clearance", value: "8.1 in" },
                    { label: "Cargo space", value: "37.5 cu ft" },
                  ]}
                />
              </div>
            </TabsContent>

            <TabsContent value="features" className="rounded-3xl border border-border/70 bg-card/80 p-8">
              <div className="grid gap-10 lg:grid-cols-2">
                <FeatureList
                  title="Standard highlights"
                  items={[
                    "Toyota Safety Sense 3.0",
                    "12.3\" Toyota Audio Multimedia",
                    "Wireless Apple CarPlay & Android Auto",
                    "LED headlamps & DRLs",
                    "Dual-zone climate control",
                    "Power liftgate",
                  ]}
                />
                <FeatureList
                  title="Available upgrades"
                  items={[
                    "Panoramic glass roof",
                    "Digital rear-view mirror",
                    "JBL® 11-speaker audio",
                    "Advanced Park",
                    "Bird's Eye View Camera",
                    "Premium SofTex® seating",
                  ]}
                />
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </div>

      <ToyotaFooter />
    </div>
  )
}

type SpecCardProps = {
  icon: ReactNode
  label: string
  children: ReactNode
}

function SpecCard({ icon, label, children }: SpecCardProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/80 p-5">
      <div className="rounded-full bg-primary/10 p-2 text-primary">{icon}</div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
        <p className="mt-2 text-lg font-semibold text-secondary">{children}</p>
      </div>
    </div>
  )
}

type SpecGroupProps = {
  title: string
  specs: Array<{ label: string; value: string }>
}

function SpecGroup({ title, specs }: SpecGroupProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">{title}</h3>
      <div className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-6">
        {specs.map((spec) => (
          <div key={spec.label} className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{spec.label}</span>
            <span className="font-semibold text-secondary">{spec.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

type FeatureListProps = {
  title: string
  items: string[]
}

function FeatureList({ title, items }: FeatureListProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">{title}</h3>
      <ul className="space-y-3 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-primary/70" />
            <span className="text-secondary">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

type OwnershipRowProps = {
  label: string
  value: string
  accent?: boolean
}

function OwnershipRow({ label, value, accent }: OwnershipRowProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={accent ? "font-semibold text-secondary" : "text-muted-foreground"}>{label}</span>
      <span className={accent ? "text-lg font-bold text-primary" : "font-semibold text-secondary"}>{value}</span>
    </div>
  )
}
