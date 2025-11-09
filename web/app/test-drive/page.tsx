"use client";

import type { ReactNode } from "react"
import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Car, Check, Clock, MapPin } from "lucide-react"

import { ToyotaFooter } from "@/components/layout/toyota-footer"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { LogoutButton } from "@/components/auth/LogoutButton"
import { Button } from "@/components/ui/button"
import { Calendar as DateCalendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function TestDrivePage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <RequireAuth>
        <div className="flex min-h-full flex-col bg-background text-foreground">
          <div className="toyota-container flex justify-end pt-6">
            <LogoutButton />
          </div>

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
                  Your Toyota specialist is ready. We’ve emailed every detail and saved it inside Toyota Agent so you’re
                  prepared for an elevated drive.
                </p>
              </div>
              <div className="rounded-3xl border border-border/70 bg-background/80 p-8 text-left">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground/80">
                  Appointment details
                </h3>
                <div className="mt-6 space-y-4 text-sm text-secondary">
                  <DetailRow icon={<MapPin className="h-4 w-4" />} label="Dealership">
                    Downtown Toyota — 123 Main St, Dallas, TX
                  </DetailRow>
                  <DetailRow icon={<Clock className="h-4 w-4" />} label="Time">
                    {date?.toLocaleDateString()} at 2:00 PM
                  </DetailRow>
                  <DetailRow icon={<Car className="h-4 w-4" />} label="Vehicle">
                    2025 Toyota RAV4 Hybrid
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
        <div className="toyota-container flex justify-end pt-6">
          <LogoutButton />
        </div>

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
              <div className="rounded-[2rem] border border-border/70 bg-card/80 p-8 shadow-[0_28px_70px_-64px_rgba(15,20,26,0.8)] backdrop-blur">
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-semibold text-secondary">
                      Preferred dealership
                    </Label>
                    <Select defaultValue="downtown">
                      <SelectTrigger
                        id="location"
                        className="h-12 rounded-full border-border/70 bg-background/70 px-5 text-sm"
                      >
                        <SelectValue placeholder="Choose dealership" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="downtown">Downtown Toyota — 123 Main St</SelectItem>
                        <SelectItem value="north">North Dallas Toyota — 456 North Rd</SelectItem>
                        <SelectItem value="south">South Toyota Center — 789 South Ave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-sm font-semibold text-secondary">
                      Preferred time
                    </Label>
                    <Select defaultValue="afternoon">
                      <SelectTrigger
                        id="time"
                        className="h-12 rounded-full border-border/70 bg-background/70 px-5 text-sm"
                      >
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning (9AM - 12PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (12PM - 5PM)</SelectItem>
                        <SelectItem value="evening">Evening (5PM - 8PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-full text-sm font-semibold shadow-[0_24px_48px_-32px_rgba(235,10,30,0.6)]"
                  >
                    Confirm test drive
                  </Button>
                </form>
              </div>

              <div className="space-y-6">
                <div className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-[0_24px_58px_-56px_rgba(15,20,26,0.75)]">
                  <Label className="text-sm font-semibold text-secondary">Select date</Label>
                  <div className="mt-4 rounded-2xl border border-border/60 bg-background/80 p-3">
                    <DateCalendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      className="rounded-lg border-0"
                      disabled={(day) => {
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        return day < today
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-[0_24px_58px_-56px_rgba(15,20,26,0.75)]">
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
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
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
