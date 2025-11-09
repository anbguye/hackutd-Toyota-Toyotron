"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ArrowRight, ChevronLeft, ChevronRight, Filter, Loader2, Search, Plus, X } from "lucide-react"

import type { Car } from "@/lib/supabase/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

const PRICE_MIN = 15000
const PRICE_MAX = 80000
const PRICE_STEP = 1000

type FilterState = {
  page: number
  pageSize: number
  sort: string
  type: string
  seats: string
  q: string
  budgetMin: number
  budgetMax: number
}

type BrowseClientProps = {
  initialItems: Car[]
  initialMeta: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  initialParams: Record<string, string>
}

export default function BrowseClient({ initialItems, initialMeta, initialParams }: BrowseClientProps) {
  const router = useRouter()
  const pathname = usePathname()

  const initialFilters = useMemo<FilterState>(
    () => ({
      page: safeNumber(initialParams.page, initialMeta.page) ?? 1,
      pageSize: safeNumber(initialParams.page_size, initialMeta.pageSize) ?? 12,
      sort: initialParams.sort ?? "price-low",
      type: initialParams.type ?? "all",
      seats: initialParams.seats ?? "any",
      q: initialParams.q ?? "",
      budgetMin: safeNumber(initialParams.budget_min, PRICE_MIN, PRICE_MIN) ?? PRICE_MIN,
      budgetMax: safeNumber(initialParams.budget_max, PRICE_MAX, PRICE_MAX) ?? PRICE_MAX,
    }),
    [initialMeta.page, initialMeta.pageSize, initialParams]
  )

  const [cars, setCars] = useState(initialItems)
  const [meta, setMeta] = useState(initialMeta)
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [priceRange, setPriceRange] = useState<[number, number]>([
    initialFilters.budgetMin,
    initialFilters.budgetMax,
  ])
  const [showFilters, setShowFilters] = useState(false)
  const [searchInput, setSearchInput] = useState(initialFilters.q)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCarIds, setSelectedCarIds] = useState<string[]>(() => {
    if (typeof window === "undefined") {
      const compare = initialParams.compare
      return compare ? compare.split(",").filter(Boolean) : []
    }
    const stored = localStorage.getItem("selectedCarsForComparison")
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return []
      }
    }
    const compare = initialParams.compare
    return compare ? compare.split(",").filter(Boolean) : []
  })

  const debouncedSearch = useDebouncedValue(searchInput, 350)
  const controllerRef = useRef<AbortController | null>(null)
  const isFirstFetch = useRef(true)
  const hasMounted = useRef(false)

  // Only sync initialItems on first mount
  // After that, all updates come from client-side fetchCars to avoid race conditions
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      setCars(initialItems)
      setMeta(initialMeta)
      return
    }
    // After mount, only sync if we have no cars (fallback for direct URL navigation)
    // This prevents overwriting client-side fetch results during pagination
    if (cars.length === 0 && initialItems.length > 0 && !isLoading) {
    setCars(initialItems)
    setMeta(initialMeta)
    }
  }, [initialItems, initialMeta, cars.length, isLoading])

  useEffect(() => {
    localStorage.setItem("selectedCarsForComparison", JSON.stringify(selectedCarIds))
  }, [selectedCarIds])

  useEffect(() => {
    setFilters((prev) => {
      if (prev.q === debouncedSearch) {
        return prev
      }
      return {
        ...prev,
        q: debouncedSearch,
        page: 1,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const fetchCars = useCallback(
    async (state: FilterState) => {
      const params = new URLSearchParams()
      params.set("page", String(state.page))
      params.set("page_size", String(state.pageSize))

      if (state.q.trim()) {
        params.set("q", state.q.trim())
      }

      if (state.type && state.type !== "all") {
        params.set("type", state.type)
      }

      if (state.seats && state.seats !== "any") {
        params.set("seats", state.seats)
      }

      if (state.sort) {
        params.set("sort", state.sort)
      }

      params.set("budget_min", String(state.budgetMin))
      params.set("budget_max", String(state.budgetMax))

      const queryString = params.toString()

      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      setIsLoading(true)
      setError(null)
      // Don't clear cars here - keep previous results visible while loading

      try {
        const response = await fetch(`/api/cars?${queryString}`, {
          cache: "no-store",
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const data = (await response.json()) as {
          items?: Car[]
          page?: number
          pageSize?: number
          total?: number
          totalPages?: number
        }

        // Only update URL after we have the data to avoid race conditions
        router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })

        // Update state with fetched data
        setCars(data.items ?? [])
        setMeta({
          page: data.page ?? state.page,
          pageSize: data.pageSize ?? state.pageSize,
          total: data.total ?? data.items?.length ?? 0,
          totalPages: data.totalPages ?? Math.max(1, data.total ? Math.ceil(data.total / state.pageSize) : 1),
        })
      } catch (error) {
        if (isAbortError(error)) {
          return
        }
        console.error("[BrowseClient] Failed to fetch cars:", error)
        setError("Unable to load cars right now. Please try again.")
        // Don't clear cars on error - keep previous results visible
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    },
    [pathname, router]
  )

  useEffect(() => {
    if (isFirstFetch.current) {
      isFirstFetch.current = false
      return
    }
    fetchCars(filters)
  }, [fetchCars, filters])

  const handleTypeChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      type: value,
      page: 1,
    }))
  }, [])

  const handleSeatsChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      seats: value,
      page: 1,
    }))
  }, [])

  const handleSortChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      sort: value,
      page: 1,
    }))
  }, [])

  const handlePriceCommit = useCallback((value: number[]) => {
    const [min, max] = value as [number, number]
    setFilters((prev) => {
      if (prev.budgetMin === min && prev.budgetMax === max) {
        return prev
      }
      return {
        ...prev,
        budgetMin: min,
        budgetMax: max,
        page: 1,
      }
    })
  }, [])

  const handlePageChange = useCallback(
    (page: number) => {
      setFilters((prev) => {
        if (page === prev.page || page < 1 || page > meta.totalPages) {
          return prev
        }
        return {
          ...prev,
          page,
        }
      })
    },
    [meta.totalPages]
  )

  const toggleCarForComparison = useCallback(
    (carId: string) => {
      setSelectedCarIds((prev) => {
        let updated: string[]
        if (prev.includes(carId)) {
          updated = prev.filter((id) => id !== carId)
        } else {
          if (prev.length >= 3) {
            return prev
          }
          updated = [...prev, carId]
        }
        return updated
      })
    },
    []
  )

  const removeFromComparison = useCallback((carId: string) => {
    setSelectedCarIds((prev) => prev.filter((id) => id !== carId))
  }, [])

  const vehiclesLabel = useMemo(() => {
    if (meta.total === 0) {
      return "No vehicles found"
    }
    return `${meta.total} vehicle${meta.total === 1 ? "" : "s"} available`
  }, [meta.total])

  const mpgLabel = useCallback((car: Car) => {
    if (car.mpgHighway) {
      return `${car.mpgHighway} hwy`
    }
    if (car.mpgCity) {
      return `${car.mpgCity} city`
    }
    return "—"
  }, [])

  const priceLabel = useCallback((car: Car) => {
    if (typeof car.msrp === "number" && !Number.isNaN(car.msrp)) {
      return `$${Math.round(car.msrp).toLocaleString()}`
    }
    return "Contact for pricing"
  }, [])

  return (
    <>
      <section className="toyota-container space-y-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <span className="toyota-chip">Browse the lineup</span>
            <div className="space-y-3">
              <h1 className="text-pretty text-3xl font-black tracking-tight text-secondary sm:text-4xl">
                Explore Toyota models curated for the journeys you actually take.
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                Filter by what matters—fuel efficiency, seating, payment scenarios—and Toyotron keeps every detail
                sharp, modern, and ready for action.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex flex-1 items-center sm:w-80">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search Toyota models..."
                className="h-12 rounded-full border-border/70 bg-card/80 pl-11 pr-5 text-sm shadow-[0_18px_38px_-32px_rgba(15,20,26,0.45)]"
              />
            </div>
            <Button
              type="button"
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
                <Select value={filters.type} onValueChange={handleTypeChange}>
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
                <Select value={filters.seats} onValueChange={handleSeatsChange}>
                  <SelectTrigger className="h-12 rounded-xl border-border/70 bg-background/80 px-4 text-sm">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="5">5 seats</SelectItem>
                    <SelectItem value="7plus">7+ seats</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground/80">
                  Sort by
                </Label>
                <Select value={filters.sort} onValueChange={handleSortChange}>
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
              <Slider
                value={priceRange}
                onValueChange={(value) => setPriceRange(value as [number, number])}
                onValueCommit={handlePriceCommit}
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={PRICE_STEP}
              />
              <div className="flex justify-between text-xs text-muted-foreground/70">
                <span>${PRICE_MIN.toLocaleString()}</span>
                <span>${PRICE_MAX.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="toyota-container space-y-6">
        <div className="flex flex-row items-end justify-between gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-secondary sm:text-3xl">
              Toyota models recommended for you
            </h2>
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">{vehiclesLabel}</p>
              {selectedCarIds.length > 0 && (
                <div className="rounded-full border border-border/70 bg-card/80 px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    {cars
                      .filter((car) => selectedCarIds.includes(car.id))
                      .map((car) => (
                        <div
                          key={car.id}
                          className="flex items-center gap-1.5 rounded-full bg-background/60 px-2 py-0.5 text-xs font-semibold text-secondary"
                        >
                          <span className="truncate">{car.name}</span>
                          <button
                            onClick={() => removeFromComparison(car.id)}
                            className="hover:text-primary"
                            aria-label={`Remove ${car.name} from comparison`}
                          >
                            <X className="h-3 w-3 flex-shrink-0" />
                          </button>
                        </div>
                      ))}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {selectedCarIds.length}/3
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <Link
            href={selectedCarIds.length > 0 ? `/compare?compare=${selectedCarIds.join(",")}` : "/compare"}
            className="flex-shrink-0"
          >
            <Button
              variant="ghost"
              className="rounded-full border border-border/70 px-6 font-semibold hover:border-primary/70 hover:text-primary disabled:opacity-50"
              disabled={selectedCarIds.length === 0}
            >
              Compare selected {selectedCarIds.length > 0 && `(${selectedCarIds.length})`}
            </Button>
          </Link>
        </div>

        {error ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="relative">
          {isLoading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-background/60 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-secondary" />
            </div>
          ) : null}

          <div
            className={`grid gap-6 transition-opacity duration-200 md:grid-cols-2 xl:grid-cols-3 ${
              isLoading ? "opacity-50" : "opacity-100"
            }`}
          >
            {cars.length === 0 && !isLoading ? (
              <div className="col-span-full rounded-3xl border border-border/70 bg-card/70 p-10 text-center">
                <p className="text-lg font-semibold text-secondary">No vehicles match your filters.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your filters or expanding your price range to see more Toyota models.
                </p>
              </div>
            ) : (
              cars.map((car) => (
                <div key={car.id} className="group relative">
                  <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/80 backdrop-blur-sm shadow-[0_26px_54px_-46px_rgba(15,20,26,0.7)] border-white/10">
                    <div className="relative">
                      <div className="relative aspect-[4/3] overflow-hidden bg-background/50">
                        <div className="absolute inset-0 scale-110">
                        <Image
                          src={car.image || "/placeholder.svg"}
                          alt={car.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                            style={{ objectPosition: "center 25%" }}
                        />
                        </div>
                      </div>
                      <div className="absolute left-5 top-5 flex gap-2">
                        {car.year ? (
                          <Badge className="rounded-full border-border/70 bg-background/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-secondary">
                            {car.year}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-5 p-6">
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-secondary">{car.name}</h3>
                        <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">
                          {(car.type ?? "Vehicle")} • {car.seats ? `${car.seats} seats` : "Seating TBD"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border/70 bg-background/80 p-4 text-sm">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Starting
                          </p>
                          <p className="text-lg font-semibold text-secondary">{priceLabel(car)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">MPG</p>
                          <p className="text-lg font-semibold text-secondary">{mpgLabel(car)}</p>
                        </div>
                      </div>
                      <div className="mt-auto flex gap-3">
                        <Link href={`/car/${car.id}`} className="flex-1">
                          <Button className="w-full rounded-full bg-primary px-6 py-2 text-sm font-semibold">
                            View details <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                        <button
                          onClick={() => toggleCarForComparison(car.id)}
                          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                            selectedCarIds.includes(car.id)
                              ? "border-primary bg-primary text-white"
                              : "border-border/70 bg-background/80 text-secondary hover:border-primary hover:bg-primary/10"
                          }`}
                          aria-label={`${selectedCarIds.includes(car.id) ? "Remove" : "Add"} ${car.name} to comparison`}
                          disabled={!selectedCarIds.includes(car.id) && selectedCarIds.length >= 3}
                        >
                          {selectedCarIds.includes(car.id) ? (
                            <X className="h-5 w-5" />
                          ) : (
                            <Plus className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 text-sm text-muted-foreground sm:flex-row">
          <div>
            Page {meta.page} of {meta.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full px-4"
              disabled={meta.page === 1 || isLoading}
              onClick={() => handlePageChange(meta.page - 1)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full px-4"
              disabled={meta.page >= meta.totalPages || isLoading}
              onClick={() => handlePageChange(meta.page + 1)}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}

function safeNumber(value: string | undefined, fallback: number | undefined, defaultValue?: number) {
  if (value === undefined) {
    return fallback ?? defaultValue
  }
  const parsed = Number(value)
  if (Number.isFinite(parsed)) {
    return parsed
  }
  return fallback ?? defaultValue
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])

  return debounced
}

function isAbortError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false
  }
  return (error as { name?: string }).name === "AbortError"
}

