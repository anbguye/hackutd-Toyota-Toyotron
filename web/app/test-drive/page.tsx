"use client";

import type { ReactNode } from "react"
import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Car, Check, Clock, MapPin } from "lucide-react"
import type { Session } from "@supabase/supabase-js"

import { RequireAuth } from "@/components/auth/RequireAuth"
import { LogoutButton } from "@/components/auth/LogoutButton"
import { ToyotaFooter } from "@/components/layout/toyota-footer"
import { Button } from "@/components/ui/button"
import { Calendar as DateCalendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const LOCATION_OPTIONS: LocationOption[] = [
  {
    value: "downtown",
    label: "Downtown Toyota — 123 Main St, Dallas, TX",
  },
  {
    value: "north",
    label: "North Dallas Toyota — 456 North Rd, Dallas, TX",
  },
  {
    value: "south",
    label: "South Toyota Center — 789 South Ave, Dallas, TX",
  },
]

const TIME_SLOTS = generateTimeSlots(9, 18, 30)

type VehicleParams = {
  trimId: number | null
  make: string | null
  model: string | null
  year: number | null
  trim: string | null
}

type VehicleDetails = {
  trimId: number
  make: string | null
  model: string | null
  year: number | null
  trim: string | null
}

type VehicleSummaryValues = Pick<VehicleParams, "make" | "model" | "year" | "trim">

type LocationOption = {
  value: string
  label: string
}

type ConfirmationDetails = {
  bookingDateTime: string
  location: LocationOption
  vehicleSummary: string
}

function TestDrivePageContent() {
  const searchParams = useSearchParams()

  const vehicleParams = useMemo<VehicleParams>(() => {
    const yearParam = searchParams.get("year")
    const trimIdParam = searchParams.get("trim_id")

    const parsedYear = yearParam ? Number(yearParam) : NaN
    const year = Number.isFinite(parsedYear) ? parsedYear : null

    const parsedTrimId = trimIdParam ? Number.parseInt(trimIdParam, 10) : NaN
    const trimId = Number.isFinite(parsedTrimId) ? parsedTrimId : null

    return {
      trimId,
      make: searchParams.get("make"),
      model: searchParams.get("model"),
      year,
      trim: searchParams.get("trim"),
    }
  }, [searchParams])

  const [fetchedVehicle, setFetchedVehicle] = useState<VehicleDetails | null>(null)
  const [isVehicleLoading, setIsVehicleLoading] = useState(false)
  const [vehicleFetchError, setVehicleFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (!vehicleParams.trimId) {
      setFetchedVehicle(null)
      setVehicleFetchError(null)
      setIsVehicleLoading(false)
      return
    }

    let isCancelled = false

    const loadVehicle = async () => {
      setIsVehicleLoading(true)
      setVehicleFetchError(null)

      const { data, error } = await supabase
        .from("toyota_trim_specs")
        .select("trim_id, model_year, make, model, trim")
        .eq("trim_id", vehicleParams.trimId)
        .maybeSingle()

      if (isCancelled) {
        return
      }

      if (error) {
        console.error("Failed to load vehicle details for trim:", error)
        setFetchedVehicle(null)
        setVehicleFetchError("Unable to load vehicle details. Please return to browse and select a vehicle again.")
      } else if (!data) {
        setFetchedVehicle(null)
        setVehicleFetchError("Vehicle details were not found. Please return to browse and select a vehicle again.")
      } else {
        setFetchedVehicle({
          trimId: data.trim_id,
          make: data.make ?? null,
          model: data.model ?? null,
          year: typeof data.model_year === "number" ? data.model_year : null,
          trim: data.trim ?? null,
        })
      }

      setIsVehicleLoading(false)
    }

    void loadVehicle()

    return () => {
      isCancelled = true
    }
  }, [vehicleParams.trimId])

  const displayMake = fetchedVehicle?.make ?? vehicleParams.make
  const displayModel = fetchedVehicle?.model ?? vehicleParams.model
  const displayYear = fetchedVehicle?.year ?? vehicleParams.year
  const displayTrim = fetchedVehicle?.trim ?? vehicleParams.trim

  const vehicleSummary = useMemo(
    () =>
      formatVehicleSummary({
        make: displayMake,
        model: displayModel,
        year: displayYear,
        trim: displayTrim,
      }),
    [displayMake, displayModel, displayYear, displayTrim]
  )

  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [location, setLocation] = useState<string>(LOCATION_OPTIONS[0]?.value ?? "")
  const [session, setSession] = useState<Session | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<ConfirmationDetails | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!isMounted) return

      setSession(data.session ?? null)

      const metadataName = (data.session?.user.user_metadata?.full_name as string | undefined) ?? ""
      const sessionEmail = data.session?.user.email ?? ""
      const sessionPhone = (data.session?.user.user_metadata?.phone as string | undefined) ?? ""

      if (metadataName) {
        setFullName((prev) => (prev ? prev : metadataName))
      }
      if (sessionEmail) {
        setEmail((prev) => (prev ? prev : sessionEmail))
      }
      if (sessionPhone) {
        setPhone((prev) => (prev ? prev : sessionPhone))
      }
    }

    loadSession()

    return () => {
      isMounted = false
    }
  }, [])

  const isSlotDisabled = useCallback(
    (slot: string) => {
      if (!date) return true
      const slotDate = combineDateAndSlot(date, slot)
      const now = new Date()
      return slotDate.getTime() < now.getTime()
    },
    [date]
  )

  useEffect(() => {
    if (selectedSlot && isSlotDisabled(selectedSlot)) {
      setSelectedSlot(null)
    }
  }, [selectedSlot, isSlotDisabled])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)

    if (!date) {
      setErrorMessage("Please select a date for your test drive.")
      return
    }

    if (!selectedSlot) {
      setErrorMessage("Please choose a start time.")
      return
    }

    const trimId = fetchedVehicle?.trimId ?? vehicleParams.trimId
    if (!trimId) {
      setErrorMessage("Vehicle details are missing. Please choose a vehicle before scheduling.")
      return
    }

    if (!session?.access_token) {
      setErrorMessage("Your session expired. Please sign in again.")
      return
    }

    const bookingDate = combineDateAndSlot(date, selectedSlot)
    const bookingDateISO = bookingDate.toISOString()
    const selectedLocation = LOCATION_OPTIONS.find((option) => option.value === location) ?? LOCATION_OPTIONS[0]

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          contactName: fullName,
          contactEmail: email,
          contactPhone: phone,
          preferredLocation: location,
          bookingDateTime: bookingDateISO,
          vehicle: {
            trimId,
            make: displayMake,
            model: displayModel,
            year: typeof displayYear === "number" ? displayYear : null,
            trim: displayTrim,
          },
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.message ?? "Unable to schedule your test drive.")
      }

      // Always use the original bookingDateISO for the confirmation page
      // to ensure timezone is correctly preserved (API response may not include timezone info)
      setConfirmation({
        bookingDateTime: bookingDateISO,
        location: selectedLocation,
        vehicleSummary: vehicleSummary || "Selected Toyota model",
      })
    } catch (error) {
      console.error("Failed to submit booking:", error)
      setErrorMessage(error instanceof Error ? error.message : "Unable to schedule your test drive. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (confirmation) {
    const appointmentDate = new Date(confirmation.bookingDateTime)
    const appointmentDateLabel = new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(appointmentDate)
    const appointmentTimeLabel = new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(appointmentDate)

    return (
      <RequireAuth>
        <div className="flex min-h-full flex-col bg-background text-foreground">
          <div className="flex flex-1 items-center justify-center px-4 py-16">
            <div className="w-full max-w-2xl space-y-10 rounded-[2.5rem] border border-border/70 bg-card/70 p-10 text-center shadow-[0_32px_80px_-72px_rgba(15,20,26,0.85)] backdrop-blur">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="h-10 w-10" />
              </div>
              <div className="space-y-4">
                <h1 className="text-3xl font-black tracking-tight text-secondary sm:text-4xl">
                  Test drive confirmed.
                </h1>
                <p className="text-base text-muted-foreground sm:text-lg">
                  Your Toyota specialist is ready. We’ve emailed every detail and saved it inside Toyotron so you’re
                  prepared for an elevated drive.
                </p>
              </div>
              <div className="rounded-3xl border border-border/70 bg-background/80 p-8 text-left">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground/80">
                  Appointment details
                </h3>
                <div className="mt-6 space-y-4 text-sm text-secondary">
                  <DetailRow icon={<MapPin className="h-4 w-4" />} label="Dealership">
                    {confirmation.location.label}
                  </DetailRow>
                  <DetailRow icon={<Clock className="h-4 w-4" />} label="Time">
                    {appointmentDateLabel} at {appointmentTimeLabel}
                  </DetailRow>
                  <DetailRow icon={<Car className="h-4 w-4" />} label="Vehicle">
                    {confirmation.vehicleSummary}
                  </DetailRow>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/browse">
                  <Button
                    variant="outline"
                    className="rounded-full border-border/70 px-6 font-semibold hover:border-primary/70 hover:text-primary"
                  >
                    Explore more models
                  </Button>
                </Link>
                <Link href="/chat">
                  <Button className="rounded-full px-6 font-semibold shadow-[0_24px_48px_-32px_rgba(235,10,30,0.6)]">
                    Chat with agent
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <ToyotaFooter />
        </div>
      </RequireAuth>
    )
  }

  return (
    <RequireAuth>
      <div className="flex min-h-full flex-col bg-background text-foreground">
        <div className="flex-1 px-4 py-12">
          <div className="toyota-container space-y-12">
            <div className="space-y-3">
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-secondary"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to browse
              </Link>
              <h1 className="text-3xl font-black tracking-tight text-secondary sm:text-4xl">
                Schedule your Toyota test drive.
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                Lock in a wheel-time session with a Toyota specialist. We orchestrate the logistics so you can focus on
                the drive.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-4xl border border-border/70 bg-card/80 p-8 shadow-[0_28px_70px_-64px_rgba(15,20,26,0.8)] backdrop-blur">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-secondary">
                      Full name
                    </Label>
                    <Input
                      id="name"
                      placeholder="Jordan Reyes"
                      required
                      className="h-12 rounded-full border-border/70 bg-background/70 px-5"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-secondary">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      className="h-12 rounded-full border-border/70 bg-background/70 px-5"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold text-secondary">
                      Phone number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      required
                      className="h-12 rounded-full border-border/70 bg-background/70 px-5"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-semibold text-secondary">
                      Preferred dealership
                    </Label>
                    <Select value={location} onValueChange={setLocation}>
                      <SelectTrigger
                        id="location"
                        className="h-12 rounded-full border-border/70 bg-background/70 px-5 text-sm"
                      >
                        <SelectValue placeholder="Choose dealership" />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {errorMessage ? (
                    <p className="text-sm font-semibold text-rose-500">{errorMessage}</p>
                  ) : null}

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-full text-sm font-semibold shadow-[0_24px_48px_-32px_rgba(235,10,30,0.6)]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Scheduling..." : "Confirm test drive"}
                  </Button>
                </form>
              </div>

              <div className="space-y-6">
                <div className="rounded-4xl border border-border/70 bg-card/80 p-6 shadow-[0_24px_58px_-56px_rgba(15,20,26,0.75)]">
                  <Label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    Step 1 — Select date
                  </Label>
                  <div className="mt-4 rounded-2xl border border-border/60 bg-background/80 p-3">
                    <DateCalendar
                      mode="single"
                      selected={date}
                      onSelect={(selectedDate) => setDate(selectedDate)}
                      className="rounded-lg border-0"
                      disabled={(day) => {
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        return day < today
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-4xl border border-border/70 bg-card/80 p-6 shadow-[0_24px_58px_-56px_rgba(15,20,26,0.75)]">
                  <Label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    Step 2 — Choose exact time
                  </Label>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Slots update based on your selected date. Pick a precise start time in 30-minute increments.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {TIME_SLOTS.map((slot) => {
                      const disabled = isSlotDisabled(slot)
                      return (
                        <button
                          type="button"
                          key={slot}
                          onClick={() => {
                            if (!disabled) {
                              setSelectedSlot(slot)
                            }
                          }}
                          disabled={disabled}
                          className={cn(
                            "rounded-full border px-4 py-2 text-sm font-semibold transition",
                            disabled
                              ? "cursor-not-allowed border-border/40 text-muted-foreground/60"
                              : "border-border/60 text-secondary hover:border-primary/60 hover:text-primary",
                            selectedSlot === slot ? "border-primary bg-primary/10 text-primary" : ""
                          )}
                        >
                          {formatTimeSlot(slot)}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {isVehicleLoading ? (
                  <div className="rounded-4xl border border-border/70 bg-card/80 p-6 text-sm text-secondary shadow-[0_24px_58px_-56px_rgba(15,20,26,0.75)]">
                    Loading selected vehicle details...
                  </div>
                ) : vehicleFetchError ? (
                  <div className="rounded-4xl border border-rose-500/40 bg-card/80 p-6 text-sm text-rose-500 shadow-[0_24px_58px_-56px_rgba(15,20,26,0.75)]">
                    {vehicleFetchError}
                  </div>
                ) : vehicleSummary ? (
                  <div className="rounded-4xl border border-border/70 bg-card/80 p-6 shadow-[0_24px_58px_-56px_rgba(15,20,26,0.75)]">
                    <Label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                      Selected vehicle
                    </Label>
                    <p className="mt-3 text-sm text-secondary">{vehicleSummary}</p>
                  </div>
                ) : (
                  <div className="rounded-4xl border border-dashed border-border/60 bg-card/60 p-6 text-sm text-muted-foreground">
                    No vehicle selected. Return to browse to choose a Toyota to test drive.
                  </div>
                )}

                <div className="rounded-4xl border border-border/70 bg-card/80 p-6 shadow-[0_24px_58px_-56px_rgba(15,20,26,0.75)]">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    What to expect
                  </h3>
                  <ul className="mt-6 space-y-4 text-sm text-secondary">
                    {[
                      "Guided feature walkthrough with Toyota specialist",
                      "30-45 minute drive covering city + highway",
                      "Zero purchase obligation—pure experience",
                      "Bring valid driver’s license and insurance",
                      "Vehicle prepped with your preferred trim",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ToyotaFooter />
      </div>
    </RequireAuth>
  )
}

export default function TestDrivePage() {
  return (
    <Suspense fallback={<TestDriveSuspenseFallback />}>
      <TestDrivePageContent />
    </Suspense>
  )
}

function TestDriveSuspenseFallback() {
  return (
    <div className="flex min-h-full items-center justify-center bg-background text-foreground">
      <p className="text-sm font-medium text-muted-foreground">Loading your test drive details...</p>
    </div>
  )
}

type DetailRowProps = {
  icon: ReactNode
  label: string
  children: ReactNode
}

function DetailRow({ icon, label, children }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-primary">{icon}</div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm text-secondary">{children}</p>
      </div>
    </div>
  )
}

function generateTimeSlots(startHour: number, endHourExclusive: number, intervalMinutes: number) {
  const slots: string[] = []
  for (let hour = startHour; hour < endHourExclusive; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const formattedHour = hour.toString().padStart(2, "0")
      const formattedMinute = minute.toString().padStart(2, "0")
      slots.push(`${formattedHour}:${formattedMinute}`)
    }
  }
  return slots
}

function formatTimeSlot(slot: string) {
  const [hour, minute] = slot.split(":").map(Number)
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date)
}

function formatVehicleSummary(vehicle: VehicleSummaryValues) {
  if (!vehicle.make || !vehicle.model) {
    return ""
  }

  const parts = [
    vehicle.year ? vehicle.year.toString() : null,
    vehicle.make,
    vehicle.model,
    vehicle.trim,
  ].filter(Boolean)

  return parts.join(" ")
}

function combineDateAndSlot(date: Date, slot: string) {
  const [hour, minute] = slot.split(":").map(Number)
  // Create a new date in the local timezone with explicit year, month, day, hour, minute
  // This prevents timezone offset issues that occur with setHours
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  const combined = new Date(year, month, day, hour, minute, 0, 0)
  return combined
}

