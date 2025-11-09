"use client";

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

import { ToyotaFooter } from "@/components/layout/toyota-footer"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

const BODY_STYLE_OPTIONS = ["sedan", "suv", "truck", "hybrid", "any"] as const

const PASSENGER_OPTIONS = [
  { value: "2", label: "Just me or one passenger", desc: "Coupe or compact-friendly options" },
  { value: "5", label: "Small family or friends", desc: "Toyota sedans and crossovers" },
  { value: "7", label: "Large family or groups", desc: "SUVs and three-row leaders" },
] as const

const USE_CASE_OPTIONS = [
  { value: "commute", label: "Daily commute", desc: "Efficiency, comfort, and driver-assist focus" },
  { value: "family", label: "Family trips", desc: "Space, versatility, and safety at the core" },
  { value: "adventure", label: "Adventure", desc: "Capability, ground clearance, and AWD" },
  { value: "business", label: "Business", desc: "Refinement, tech, and executive presence" },
] as const

const MPG_OPTIONS = [
  { value: "high" as const, label: "Critical", desc: "Hybrid or max MPG required" },
  { value: "medium" as const, label: "Important", desc: "Prefer efficiency but open to balance" },
  { value: "low" as const, label: "Neutral", desc: "Performance or utility takes priority" },
] as const

type BodyStyleOption = (typeof BODY_STYLE_OPTIONS)[number]
type PassengerOption = (typeof PASSENGER_OPTIONS)[number]["value"]
type UseCaseOption = (typeof USE_CASE_OPTIONS)[number]["value"]
type MpgOption = (typeof MPG_OPTIONS)[number]["value"]

const isBodyStyleOption = (value: string): value is BodyStyleOption =>
  BODY_STYLE_OPTIONS.includes(value as BodyStyleOption)

const isPassengerOption = (value: string): value is PassengerOption =>
  PASSENGER_OPTIONS.some((option) => option.value === value)

const isUseCaseOption = (value: string): value is UseCaseOption =>
  USE_CASE_OPTIONS.some((option) => option.value === value)

const isMpgOption = (value: string): value is MpgOption =>
  MPG_OPTIONS.some((option) => option.value === value)

export default function QuizPage() {
  const router = useRouter()
  const totalSteps = 5
  const BUDGET_MIN = 15000
  const BUDGET_MAX = 80000
  const BUDGET_STEP = 1000

  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [budgetMax, setBudgetMax] = useState(35000)
  const [bodyStyle, setBodyStyle] = useState<BodyStyleOption>("suv")
  const [seatPreference, setSeatPreference] = useState<PassengerOption>("5")
  const [primaryUseCase, setPrimaryUseCase] = useState<UseCaseOption>("commute")
  const [mpgPriority, setMpgPriority] = useState<MpgOption>("medium")
  const [loadingPreferences, setLoadingPreferences] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferenceId, setPreferenceId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadPreferences = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) throw userError
        if (!user) {
          return
        }

        if (!active) return
        setUserId(user.id)

        const { data, error } = await supabase
          .from("user_preferences")
          .select("id, budget_max, car_types, seats, mpg_priority, use_case")
          .eq("user_id", user.id)
          .maybeSingle()

        if (error && error.code !== "PGRST116") {
          throw error
        }

        if (data) {
          if (data.id) {
            setPreferenceId(data.id)
          }
          if (typeof data.budget_max === "number") {
            const dollars = Math.round(data.budget_max / 100)
            setBudgetMax(Math.min(BUDGET_MAX, Math.max(BUDGET_MIN, dollars)))
          }
          if (Array.isArray(data.car_types)) {
            const savedStyle = data.car_types[0]?.toLowerCase()
            if (savedStyle && isBodyStyleOption(savedStyle)) {
              setBodyStyle(savedStyle)
            } else if (data.car_types.length === 0) {
              setBodyStyle("any")
            }
          }
          if (typeof data.seats === "number") {
            const seatValue = PASSENGER_OPTIONS.find((option) => Number(option.value) === data.seats)?.value
            if (seatValue) {
              setSeatPreference(seatValue)
            }
          }
          if (typeof data.use_case === "string") {
            const useCaseMatch = USE_CASE_OPTIONS.find((option) => option.value === data.use_case)
            if (useCaseMatch) {
              setPrimaryUseCase(useCaseMatch.value)
            }
          }
          if (typeof data.mpg_priority === "string") {
            const mpgMatch = MPG_OPTIONS.find((option) => option.value === data.mpg_priority)
            if (mpgMatch) {
              setMpgPriority(mpgMatch.value)
            }
          }
        }
      } catch (error) {
        console.error("Failed to load preferences:", error)
        toast({
          title: "Unable to load your preferences",
          description: "We’ll start fresh for now. Please try again later.",
          variant: "destructive",
        })
      } finally {
        if (active) {
          setLoadingPreferences(false)
        }
      }
    }

    loadPreferences()

    return () => {
      active = false
    }
  }, [toast])

  const handleBudgetChange = (value: number[]) => {
    const [next] = value
    if (typeof next === "number" && Number.isFinite(next)) {
      const clamped = Math.min(BUDGET_MAX, Math.max(BUDGET_MIN, Math.round(next / BUDGET_STEP) * BUDGET_STEP))
      setBudgetMax(clamped)
    }
  }

  const persistPreferences = async () => {
    if (saving) return
    setSaving(true)

    try {
      let currentUserId = userId

      if (!currentUserId) {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) throw userError
        if (!user) {
          throw new Error("You must be signed in to save preferences.")
        }
        currentUserId = user.id
        setUserId(user.id)
      }

      const payload = {
        user_id: currentUserId,
        budget_min: BUDGET_MIN * 100,
        budget_max: budgetMax * 100,
        car_types: bodyStyle === "any" ? [] : [bodyStyle],
        seats: Number(seatPreference),
        use_case: primaryUseCase,
        mpg_priority: mpgPriority,
        updated_at: new Date().toISOString(),
      }

      if (preferenceId) {
        const { error } = await supabase
          .from("user_preferences")
          .update(payload)
          .eq("id", preferenceId)
          .eq("user_id", currentUserId)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from("user_preferences")
          .insert([payload])
          .select("id")
          .maybeSingle()

        if (error) throw error
        if (data?.id) {
          setPreferenceId(data.id)
        }
      }

      router.push("/chat")
    } catch (error) {
      console.error("Failed to save preferences:", error)
      toast({
        title: "We couldn’t save your preferences",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep((prev) => Math.min(prev + 1, totalSteps))
      return
    }
    await persistPreferences()
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  if (loadingPreferences) {
    return (
      <RequireAuth allowWithoutPreferences>
        <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
          <Spinner className="h-6 w-6 text-secondary" />
        </div>
      </RequireAuth>
    )
  }

  const isFinalStep = step === totalSteps

  return (
    <RequireAuth allowWithoutPreferences>
      <div className="flex min-h-full flex-col bg-background text-foreground">
        <div className="border-b border-border/60 bg-background/80">
          <div className="toyota-container py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Step {step} of {totalSteps}
                </p>
                <h1 className="mt-2 text-2xl font-semibold text-secondary">Let's tailor your Toyota experience</h1>
              </div>
              <span className="hidden text-sm text-muted-foreground md:block">
                {Math.round((step / totalSteps) * 100)}% complete
              </span>
            </div>
            <div className="mt-4 h-2 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-10">
          <div className="w-full max-w-3xl rounded-4xl border border-border/70 bg-card/80 p-8 shadow-[0_28px_65px_-56px_rgba(15,20,26,0.85)] backdrop-blur md:p-12">
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-secondary">Set your ceiling</h2>
                  <p className="text-base text-muted-foreground">
                    Toyota Agent shapes recommendations around the financial comfort zone you set.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/80 p-8 text-center">
                  <div className="text-4xl font-bold text-secondary">${budgetMax.toLocaleString()}</div>
                  <p className="mt-2 text-sm uppercase tracking-[0.25em] text-muted-foreground">Maximum budget</p>
                  <div className="mt-8 space-y-4">
                    <Slider
                      value={[budgetMax]}
                      onValueChange={handleBudgetChange}
                      min={BUDGET_MIN}
                      max={BUDGET_MAX}
                      step={BUDGET_STEP}
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>$15,000</span>
                      <span>$80,000</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <StepCard
                title="What type of Toyota body style suits you?"
                description="Tell us how you navigate life so we can prioritise the right silhouettes."
              >
                <RadioGroup
                  value={bodyStyle}
                  onValueChange={(value) => {
                    if (isBodyStyleOption(value)) {
                      setBodyStyle(value)
                    }
                  }}
                  className="space-y-3"
                >
                  {BODY_STYLE_OPTIONS.map((type) => (
                    <SelectableRow key={type} id={type} value={type} label={type.charAt(0).toUpperCase() + type.slice(1)} />
                  ))}
                </RadioGroup>
              </StepCard>
            )}

            {step === 3 && (
              <StepCard
                title="How many passengers ride with you most weeks?"
                description="We’ll use this to balance comfort, cargo, and Toyota Safety Sense coverage."
              >
                <RadioGroup
                  value={seatPreference}
                  onValueChange={(value) => {
                    if (isPassengerOption(value)) {
                      setSeatPreference(value)
                    }
                  }}
                  className="space-y-3"
                >
                  {PASSENGER_OPTIONS.map((option) => (
                    <SelectableRow
                      key={option.value}
                      id={option.value}
                      value={option.value}
                      label={option.label}
                      description={option.desc}
                      alignTop
                    />
                  ))}
                </RadioGroup>
              </StepCard>
            )}

            {step === 4 && (
              <StepCard
                title="What’s the primary use case?"
                description="We keep the experience adaptive—commuter calm, weekend adventure, or business-first."
              >
                <RadioGroup
                  value={primaryUseCase}
                  onValueChange={(value) => {
                    if (isUseCaseOption(value)) {
                      setPrimaryUseCase(value)
                    }
                  }}
                  className="space-y-3"
                >
                  {USE_CASE_OPTIONS.map((option) => (
                    <SelectableRow
                      key={option.value}
                      id={option.value}
                      value={option.value}
                      label={option.label}
                      description={option.desc}
                      alignTop
                    />
                  ))}
                </RadioGroup>
              </StepCard>
            )}

            {step === 5 && (
              <StepCard
                title="How critical is fuel efficiency?"
                description="Toyota Agent blends hybrid, plug-in, and gasoline options based on your stance."
              >
                <RadioGroup
                  value={mpgPriority}
                  onValueChange={(value) => {
                    if (isMpgOption(value)) {
                      setMpgPriority(value)
                    }
                  }}
                  className="space-y-3"
                >
                  {MPG_OPTIONS.map((option) => (
                    <SelectableRow
                      key={option.value}
                      id={option.value}
                      value={option.value}
                      label={option.label}
                      description={option.desc}
                      alignTop
                    />
                  ))}
                </RadioGroup>
              </StepCard>
            )}

            <div className="mt-10 flex items-center justify-between border-t border-border/60 pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
                className="rounded-full border-border/70 px-6 font-semibold hover:border-primary/60 hover:text-primary"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={saving}
                className="rounded-full px-7 font-semibold shadow-[0_24px_48px_-32px_rgba(235,10,30,0.6)]"
              >
                {isFinalStep ? (saving ? "Saving" : "Start chatting") : "Next"}
                {isFinalStep && saving ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <ChevronRight className="ml-2 h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
        <ToyotaFooter />
      </div>
    </RequireAuth>
  )
}

type StepCardProps = {
  title: string
  description: string
  children: ReactNode
}

function StepCard({ title, description, children }: StepCardProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-secondary">{title}</h2>
        <p className="text-base text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

type SelectableRowProps = {
  id: string
  value: string
  label: string
  description?: string
  alignTop?: boolean
}

function SelectableRow({ id, value, label, description, alignTop = false }: SelectableRowProps) {
  return (
    <div className="group flex cursor-pointer items-start gap-3 rounded-2xl border border-border/70 bg-background/60 px-5 py-4 transition-all hover:border-primary/60 hover:bg-primary/10">
      <RadioGroupItem value={value} id={id} className={alignTop ? "mt-1.5" : ""} />
      <div>
        <Label htmlFor={id} className="cursor-pointer text-base font-semibold text-secondary">
          {label}
        </Label>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  )
}
