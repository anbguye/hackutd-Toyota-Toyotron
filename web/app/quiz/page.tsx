"use client";

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

import { ToyotaFooter } from "@/components/layout/toyota-footer"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const [budgetMin, setBudgetMin] = useState(BUDGET_MIN)
  const [budgetMax, setBudgetMax] = useState(35000)
  const [bodyStyle, setBodyStyle] = useState<BodyStyleOption>("suv")
  const [seatPreference, setSeatPreference] = useState<PassengerOption>("5")
  const [primaryUseCase, setPrimaryUseCase] = useState<UseCaseOption>("commute")
  const [mpgPriority, setMpgPriority] = useState<MpgOption>("medium")
  const [loadingPreferences, setLoadingPreferences] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferenceId, setPreferenceId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  // Optional personal information fields
  const [reasonForNewCar, setReasonForNewCar] = useState<string>("")
  const [currentCar, setCurrentCar] = useState<string>("")
  const [age, setAge] = useState<string>("")
  const [sex, setSex] = useState<string>("")
  const [occupation, setOccupation] = useState<string>("")

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

        // Try to select all fields, but handle gracefully if new columns don't exist yet
        const { data, error } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle()

        if (error && error.code !== "PGRST116") {
          // If error is about missing columns, try with basic fields only
          if (error.message?.includes("column") || error.message?.includes("does not exist")) {
            const { data: fallbackData, error: fallbackError } = await supabase
              .from("user_preferences")
              .select("id, budget_min, budget_max, car_types, seats, mpg_priority, use_case")
              .eq("user_id", user.id)
              .maybeSingle()
            
            if (fallbackError && fallbackError.code !== "PGRST116") {
              throw fallbackError
            }
            
            // Use fallback data if available, otherwise continue with null
            if (fallbackData) {
              // Process fallback data (without personal info fields)
              if (fallbackData.id) {
                setPreferenceId(fallbackData.id)
              }
              if (typeof fallbackData.budget_min === "number") {
                setBudgetMin(Math.min(BUDGET_MAX, Math.max(BUDGET_MIN, fallbackData.budget_min)))
              }
              if (typeof fallbackData.budget_max === "number") {
                setBudgetMax(Math.min(BUDGET_MAX, Math.max(BUDGET_MIN, fallbackData.budget_max)))
              }
              if (Array.isArray(fallbackData.car_types)) {
                const savedStyle = fallbackData.car_types[0]?.toLowerCase()
                if (savedStyle && isBodyStyleOption(savedStyle)) {
                  setBodyStyle(savedStyle)
                } else if (fallbackData.car_types.length === 0) {
                  setBodyStyle("any")
                }
              }
              if (typeof fallbackData.seats === "number") {
                const seatValue = PASSENGER_OPTIONS.find((option) => Number(option.value) === fallbackData.seats)?.value
                if (seatValue) {
                  setSeatPreference(seatValue)
                }
              }
              if (typeof fallbackData.use_case === "string") {
                const useCaseMatch = USE_CASE_OPTIONS.find((option) => option.value === fallbackData.use_case)
                if (useCaseMatch) {
                  setPrimaryUseCase(useCaseMatch.value)
                }
              }
              if (typeof fallbackData.mpg_priority === "string") {
                const mpgMatch = MPG_OPTIONS.find((option) => option.value === fallbackData.mpg_priority)
                if (mpgMatch) {
                  setMpgPriority(mpgMatch.value)
                }
              }
              // Skip personal info fields for fallback
              if (active) {
                setLoadingPreferences(false)
              }
              return
            }
          } else {
          throw error
          }
        }

        if (data) {
          if (data.id) {
            setPreferenceId(data.id)
          }
          if (typeof data.budget_min === "number") {
            setBudgetMin(Math.min(BUDGET_MAX, Math.max(BUDGET_MIN, data.budget_min)))
          }
          if (typeof data.budget_max === "number") {
            setBudgetMax(Math.min(BUDGET_MAX, Math.max(BUDGET_MIN, data.budget_max)))
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
          // Load optional personal info fields
          if (typeof data.reason_for_new_car === "string") {
            setReasonForNewCar(data.reason_for_new_car)
          }
          if (typeof data.current_car === "string") {
            setCurrentCar(data.current_car)
          }
          if (typeof data.age === "number") {
            setAge(String(data.age))
          } else if (typeof data.age === "string") {
            setAge(data.age)
          }
          if (typeof data.sex === "string") {
            setSex(data.sex)
          }
          if (typeof data.occupation === "string") {
            setOccupation(data.occupation)
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

  const handleBudgetRangeChange = (value: number[]) => {
    if (value.length === 2) {
      const [min, max] = value
      if (typeof min === "number" && typeof max === "number" && Number.isFinite(min) && Number.isFinite(max)) {
        const clampedMin = Math.min(max, Math.max(BUDGET_MIN, Math.round(min / BUDGET_STEP) * BUDGET_STEP))
        const clampedMax = Math.max(min, Math.min(BUDGET_MAX, Math.round(max / BUDGET_STEP) * BUDGET_STEP))
        setBudgetMin(clampedMin)
        setBudgetMax(clampedMax)
      }
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

      const payload: Record<string, any> = {
        user_id: currentUserId,
        budget_min: budgetMin,
        budget_max: budgetMax,
        car_types: bodyStyle === "any" ? [] : [bodyStyle],
        seats: Number(seatPreference),
        use_case: primaryUseCase,
        mpg_priority: mpgPriority,
        updated_at: new Date().toISOString(),
      }
      
      // Add optional personal info fields (only if provided)
      if (reasonForNewCar.trim()) {
        payload.reason_for_new_car = reasonForNewCar.trim()
      }
      if (currentCar.trim()) {
        payload.current_car = currentCar.trim()
      }
      if (age.trim()) {
        const ageNum = parseInt(age.trim(), 10)
        if (!isNaN(ageNum) && ageNum > 0) {
          payload.age = ageNum
        }
      }
      if (sex.trim()) {
        payload.sex = sex.trim()
      }
      if (occupation.trim()) {
        payload.occupation = occupation.trim()
      }

      if (preferenceId) {
        const { error } = await supabase
          .from("user_preferences")
          .update(payload)
          .eq("id", preferenceId)
          .eq("user_id", currentUserId)

        if (error) {
          // If error is about missing columns, try updating without personal info fields
          if (error.message?.includes("column") || error.message?.includes("does not exist")) {
            const basicPayload: Record<string, any> = {
              user_id: currentUserId,
              budget_min: budgetMin,
              budget_max: budgetMax,
              car_types: bodyStyle === "any" ? [] : [bodyStyle],
              seats: Number(seatPreference),
              use_case: primaryUseCase,
              mpg_priority: mpgPriority,
              updated_at: new Date().toISOString(),
            }
            const { error: basicError } = await supabase
              .from("user_preferences")
              .update(basicPayload)
              .eq("id", preferenceId)
              .eq("user_id", currentUserId)
            
            if (basicError) throw basicError
          } else {
            throw error
          }
        }
      } else {
        const { data, error } = await supabase
          .from("user_preferences")
          .insert([payload])
          .select("id")
          .maybeSingle()

        if (error) {
          // If error is about missing columns, try inserting without personal info fields
          if (error.message?.includes("column") || error.message?.includes("does not exist")) {
            const basicPayload: Record<string, any> = {
              user_id: currentUserId,
              budget_min: budgetMin,
              budget_max: budgetMax,
              car_types: bodyStyle === "any" ? [] : [bodyStyle],
              seats: Number(seatPreference),
              use_case: primaryUseCase,
              mpg_priority: mpgPriority,
              updated_at: new Date().toISOString(),
            }
            const { data: basicData, error: basicError } = await supabase
              .from("user_preferences")
              .insert([basicPayload])
              .select("id")
              .maybeSingle()
            
            if (basicError) throw basicError
            if (basicData?.id) {
              setPreferenceId(basicData.id)
            }
          } else {
            throw error
          }
        } else {
        if (data?.id) {
          setPreferenceId(data.id)
          }
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
                  <h2 className="text-3xl font-bold text-secondary">Set your budget range</h2>
                  <p className="text-base text-muted-foreground">
                    Toyotron shapes recommendations around the financial comfort zone you set.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/80 p-8">
                  <div className="text-center space-y-6">
                    <div className="space-y-2">
                      <div className="text-4xl font-bold text-secondary">
                        ${budgetMin.toLocaleString()} - ${budgetMax.toLocaleString()}
                      </div>
                      <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Budget range</p>
                    </div>
                  <div className="mt-8 space-y-4">
                    <Slider
                        value={[budgetMin, budgetMax]}
                        onValueChange={handleBudgetRangeChange}
                      min={BUDGET_MIN}
                      max={BUDGET_MAX}
                      step={BUDGET_STEP}
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>${BUDGET_MIN.toLocaleString()}</span>
                        <span>${BUDGET_MAX.toLocaleString()}</span>
                      </div>
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
              <div className="space-y-6">
              <StepCard
                  title="What's the primary use case?"
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
                
                <div className="mt-6 space-y-4 rounded-2xl border border-border/70 bg-background/60 p-6">
                  <div className="space-y-2">
                    <Label htmlFor="reason-for-new-car" className="text-sm font-semibold text-secondary">
                      Why are you looking for a new car? <span className="text-muted-foreground font-normal">(Optional)</span>
                    </Label>
                    <Input
                      id="reason-for-new-car"
                      placeholder="e.g., Upgrading, Replacing old vehicle, First car..."
                      value={reasonForNewCar}
                      onChange={(e) => setReasonForNewCar(e.target.value)}
                      className="rounded-xl border-border/70 bg-background/80"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
              <StepCard
                title="How critical is fuel efficiency?"
                description="Toyotron blends hybrid, plug-in, and gasoline options based on your stance."
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
                
                <div className="mt-6 space-y-4 rounded-2xl border border-dashed border-border/70 bg-background/40 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold text-secondary">
                      Personal Information <span className="text-muted-foreground font-normal">(Optional - Skip if you prefer)</span>
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCurrentCar("")
                        setAge("")
                        setSex("")
                        setOccupation("")
                      }}
                      className="text-xs text-muted-foreground hover:text-secondary"
                    >
                      Clear all
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="current-car" className="text-xs font-semibold text-muted-foreground">
                        Current Vehicle
                      </Label>
                      <Input
                        id="current-car"
                        placeholder="e.g., 2015 Honda Civic"
                        value={currentCar}
                        onChange={(e) => setCurrentCar(e.target.value)}
                        className="rounded-xl border-border/70 bg-background/80"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-xs font-semibold text-muted-foreground">
                        Age
                      </Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="e.g., 35"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        min="1"
                        max="120"
                        className="rounded-xl border-border/70 bg-background/80"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sex" className="text-xs font-semibold text-muted-foreground">
                        Gender
                      </Label>
                      <Select value={sex} onValueChange={setSex}>
                        <SelectTrigger id="sex" className="rounded-xl border-border/70 bg-background/80">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="occupation" className="text-xs font-semibold text-muted-foreground">
                        Occupation
                      </Label>
                      <Input
                        id="occupation"
                        placeholder="e.g., Software Engineer"
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        className="rounded-xl border-border/70 bg-background/80"
                      />
                    </div>
                  </div>
                </div>
              </div>
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
    <Label
      htmlFor={id}
      className="group flex cursor-pointer items-start gap-3 rounded-2xl border border-border/70 bg-background/60 px-5 py-4 transition-all hover:border-primary/60 hover:bg-primary/10"
    >
      <RadioGroupItem value={value} id={id} className={alignTop ? "mt-1.5" : ""} />
      <div className="flex-1">
        <span className="text-base font-semibold text-secondary">
          {label}
        </span>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
    </Label>
  )
}
