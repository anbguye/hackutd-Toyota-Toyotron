"use client";

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ArrowRight, Filter, Search } from "lucide-react"

import { ToyotaFooter } from "@/components/layout/toyota-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

const cars = [
  {
    id: 1,
    name: "RAV4 Hybrid",
    year: 2025,
    type: "SUV",
    seats: 5,
    mpg: "41 / 38",
    msrp: 36000,
    image: "/toyota-rav4-hybrid.jpg",
  },
  {
    id: 2,
    name: "Camry",
    year: 2025,
    type: "Sedan",
    seats: 5,
    mpg: "32 / 41",
    msrp: 28000,
    image: "/toyota-camry-modern.png",
  },
  {
    id: 3,
    name: "Tacoma",
    year: 2025,
    type: "Truck",
    seats: 5,
    mpg: "20 / 23",
    msrp: 42000,
    image: "/toyota-tacoma.png",
  },
  {
    id: 4,
    name: "Highlander",
    year: 2025,
    type: "SUV",
    seats: 8,
    mpg: "21 / 29",
    msrp: 45000,
    image: "/toyota-highlander.png",
  },
  {
    id: 5,
    name: "Corolla",
    year: 2025,
    type: "Sedan",
    seats: 5,
    mpg: "31 / 40",
    msrp: 22000,
    image: "/toyota-corolla.png",
  },
  {
    id: 6,
    name: "Tundra",
    year: 2025,
    type: "Truck",
    seats: 5,
    mpg: "18 / 24",
    msrp: 55000,
    image: "/toyota-tundra.png",
  },
]

export default function BrowsePage() {
  const [priceRange, setPriceRange] = useState([20000, 60000])
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <div className="flex-1 space-y-16 pb-24">
        <section className="toyota-container space-y-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <span className="toyota-chip">Browse the lineup</span>
              <div className="space-y-3">
                <h1 className="text-pretty text-3xl font-black tracking-tight text-secondary sm:text-4xl">
                  Explore Toyota models curated for the journeys you actually take.
                </h1>
                <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                  Filter by what matters—fuel efficiency, seating, payment scenarios—and Toyota Agent keeps every detail
                  sharp, modern, and ready for action.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex flex-1 items-center sm:w-80">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search Toyota models..."
                  className="h-12 rounded-full border-border/70 bg-card/80 pl-11 pr-5 text-sm shadow-[0_18px_38px_-32px_rgba(15,20,26,0.45)]"
                />
              </div>
              <Button
                variant="outline"
                className="h-12 rounded-full border-border/70 px-6 font-semibold hover:bg-muted/60"
                onClick={() => setShowFilters((prev) => !prev)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="grid gap-6 rounded-2xl border border-border/70 bg-card/80 p-8 backdrop-blur">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground/80">
                    Vehicle type
                  </Label>
                  <Select>
                    <SelectTrigger className="h-12 rounded-xl border-border/70 bg-background/80 px-4 text-sm">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="sedan">Sedan</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground/80">
                    Seats
                  </Label>
                  <Select>
                    <SelectTrigger className="h-12 rounded-xl border-border/70 bg-background/80 px-4 text-sm">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="5">5 seats</SelectItem>
                      <SelectItem value="7">7+ seats</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground/80">
                    Sort by
                  </Label>
                  <Select defaultValue="price-low">
                    <SelectTrigger className="h-12 rounded-xl border-border/70 bg-background/80 px-4 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="mpg">Best MPG</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-dashed border-border/70 bg-background/60 p-6">
                <div className="flex items-center justify-between text-sm font-semibold uppercase tracking-[0.25em] text-muted-foreground/80">
                  <span>Price range</span>
                  <span className="text-secondary tracking-normal">
                    ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
                  </span>
                </div>
                <Slider value={priceRange} onValueChange={setPriceRange} min={15000} max={80000} step={1000} />
                <div className="flex justify-between text-xs text-muted-foreground/70">
                  <span>$15,000</span>
                  <span>$80,000</span>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="toyota-container space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-secondary sm:text-3xl">
                Toyota models recommended for you
              </h2>
              <p className="text-sm text-muted-foreground">
                {cars.length} vehicles available • Filter to refine what suits your lifestyle
              </p>
            </div>
            <Link href="/compare">
              <Button
                variant="ghost"
                className="rounded-full border border-border/70 px-6 font-semibold hover:border-primary/70 hover:text-primary"
              >
                Compare selected
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {cars.map((car) => (
              <Link key={car.id} href={`/car/${car.id}`} className="group relative">
                <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/80 shadow-[0_26px_54px_-46px_rgba(15,20,26,0.7)] transition-transform duration-300 hover:-translate-y-1.5">
                  <div className="relative">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={car.image || "/placeholder.svg"}
                        alt={car.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="absolute left-5 top-5 flex gap-2">
                      <Badge className="rounded-full border-border/70 bg-background/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-secondary">
                        {car.year}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-5 p-6">
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-secondary">{car.name}</h3>
                      <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">
                        {car.type} • {car.seats} seats
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border/70 bg-background/80 p-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Starting</p>
                        <p className="text-lg font-semibold text-secondary">${car.msrp.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">MPG</p>
                        <p className="text-lg font-semibold text-secondary">{car.mpg}</p>
                      </div>
                    </div>
                    <Button className="mt-auto w-full rounded-full bg-primary px-6 py-2 text-sm font-semibold">
                      View details <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <ToyotaFooter />
    </div>
  )
}
