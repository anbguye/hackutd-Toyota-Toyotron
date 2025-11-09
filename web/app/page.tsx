"use client";

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CalendarCheck, Gauge, MessageSquare, ShieldCheck, Sparkles } from "lucide-react"

import { ToyotaFooter } from "@/components/layout/toyota-footer"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const heroStats = [
  { label: "Toyota Models", value: "36+", detail: "2025 lineup curated" },
  { label: "Drivers Guided", value: "5k+", detail: "Personalised journeys" },
  { label: "Time Saved", value: "12 hrs", detail: "Avg. research reduced" },
]

const featureCards = [
  {
    icon: MessageSquare,
    title: "Conversation-first guidance",
    description:
      "An AI concierge that understands your lifestyle, budget, and must-haves to surface the perfect Toyota match.",
    chip: "AI chat",
  },
  {
    icon: Gauge,
    title: "Human-centred comparisons",
    description:
      "Compare trims, MPG, incentives, and total ownership costs with calm, de-cluttered layouts that make decisions simple.",
    chip: "Insight",
  },
  {
    icon: ShieldCheck,
    title: "Confidence built-in",
    description:
      "Every recommendation factors Toyota Safety Sense, reliability data, and dealership availability so you can act decisively.",
    chip: "Trust",
  },
]

const experienceSteps = [
  {
    step: "Step 01",
    title: "Share what matters",
    description: "Start with a 2-minute preference quiz to set budgets, seating needs, and driving style.",
  },
  {
    step: "Step 02",
    title: "Chat with your agent",
    description: "Co-design your shortlist with an intelligent Toyota specialist that answers every question in context.",
  },
  {
    step: "Step 03",
    title: "Explore with clarity",
    description: "Compare the models that fit, with payment scenarios, incentives, and ownership costs side-by-side.",
  },
  {
    step: "Step 04",
    title: "Book the experience",
    description: "Schedule test drives or request dealership outreach without leaving the flow.",
  },
]

const heroOverlap = false

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <div className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute -top-[240px] right-[-240px] h-[520px] w-[520px] rounded-full bg-primary/15 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-[-360px] left-[-200px] h-[620px] w-[620px] rounded-full bg-secondary/10 blur-[160px]" />

        <div className="space-y-32 pb-24 pt-8 sm:pt-12">
          <section
            id="top"
            className="toyota-container grid grid-cols-1 items-center gap-8 scroll-mt-24 md:scroll-mt-28 lg:scroll-mt-32 lg:grid-cols-2"
          >
            <div className="space-y-10">
              <span className="toyota-chip">Toyota Agent</span>
              <div className="space-y-6">
                <h1 className="text-balance text-4xl font-black tracking-tight text-secondary sm:text-5xl lg:text-6xl">
                  Discover your Toyota with an agent that feels bespoke.
                </h1>
                <p className="text-lg text-muted-foreground sm:text-xl">
                  Toyota Agent blends conversational intelligence with thoughtful UX so you can explore, compare, and
                  book with absolute confidence.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/signup">
                  <Button className="h-12 rounded-full px-7 text-base font-semibold shadow-[0_25px_45px_-28px_rgba(235,10,30,0.75)]">
                    Get started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/browse">
                  <Button
                    variant="outline"
                    className="h-12 rounded-full border-border/70 px-7 text-base font-semibold hover:bg-muted/60"
                  >
                    Browse Toyota lineup
              </Button>
            </Link>
          </div>
              <div
                className={cn(
                  "mt-6 rounded-2xl border border-border/70 bg-white/90 p-6 shadow backdrop-blur",
                  heroOverlap && "xl:-mt-16 xl:ml-8 xl:max-w-[520px]",
                )}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground/80">
                  Trusted Toyota experience
                </p>
                <div className="mt-4 grid gap-6 sm:grid-cols-3">
                  {heroStats.map((stat) => (
                    <div key={stat.label} className="space-y-1">
                      <span className="text-2xl font-bold text-secondary sm:text-3xl">{stat.value}</span>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground/70">
                        {stat.label}
                      </p>
                      <p className="text-sm text-muted-foreground/80">{stat.detail}</p>
                    </div>
                  ))}
        </div>
              </div>
            </div>

            <div className="relative w-full rounded-3xl shadow-lg">
              <div className="relative w-full overflow-hidden rounded-3xl">
                <Image
                  src="/toyota-rav4-hybrid.jpg"
                  alt="Toyota RAV4 Hybrid"
                  className="block h-[360px] w-full object-cover md:h-[420px] lg:h-[520px]"
                  width={1040}
                  height={780}
                  priority
                />
          </div>
        </div>
      </section>

          <section id="features" className="toyota-container space-y-14">
            <div className="max-w-3xl space-y-4">
              <span className="toyota-chip">Why Toyota Agent</span>
              <h2 className="text-pretty text-3xl font-black tracking-tight text-secondary sm:text-4xl">
                Designed with Toyota’s precision for drivers who expect clarity.
              </h2>
              <p className="text-lg text-muted-foreground sm:text-xl">
                Every touchpoint is crafted to feel modern, calm, and unmistakably Toyota—so decisions feel effortless.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {featureCards.map((feature) => (
                <div
                  key={feature.title}
                  className="group relative flex h-full flex-col gap-6 rounded-2xl border border-border/70 bg-card p-8 transition-all hover:-translate-y-1 hover:border-primary/70 hover:shadow-[0_32px_60px_-40px_rgba(235,10,30,0.6)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <feature.icon className="h-6 w-6" />
          </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                      {feature.chip}
                    </span>
            </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-secondary">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
          </div>
                  <div className="mt-auto h-[1px] w-full rounded-full bg-gradient-to-r from-transparent via-primary/60 via-30% to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            ))}
        </div>
      </section>

          <section
            id="experience"
            className="toyota-container scroll-mt-24 md:scroll-mt-28 lg:scroll-mt-32"
          >
            <div className="rounded-[2.5rem] border border-border/70 bg-card/80 p-10 shadow-[0_32px_75px_-50px_rgba(15,20,26,0.7)] backdrop-blur">
              <div className="flex flex-col gap-12 lg:flex-row">
                <div className="max-w-sm space-y-6">
                  <span className="toyota-chip">Experience Flow</span>
                  <h2 className="text-pretty text-3xl font-black tracking-tight text-secondary sm:text-4xl">
                    From curiosity to test drive in one guided path.
                  </h2>
                  <p className="text-base text-muted-foreground">
                    Toyota Agent orchestrates every step with the precision of a Lexus dashboard—clean layouts,
                    confident typography, and thoughtful spacing that keeps focus on what matters.
                  </p>
                  <Link href="/quiz">
                    <Button
                      variant="outline"
                      className="rounded-full border-border/60 px-6 font-semibold hover:border-primary/60 hover:bg-primary/10"
                    >
                      Take the preference quiz
            </Button>
          </Link>
        </div>

                <div className="grid flex-1 gap-6 sm:grid-cols-2">
                  {experienceSteps.map((step) => (
                    <div
                      key={step.title}
                      className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/80 p-6"
                    >
                      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                        {step.step}
                      </span>
                      <h3 className="text-lg font-semibold text-secondary">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section
            id="pricing"
            className="toyota-container grid gap-8 scroll-mt-24 md:scroll-mt-28 lg:scroll-mt-32 lg:grid-cols-[1.05fr_0.95fr] lg:items-center"
          >
            <div className="space-y-6">
              <span className="toyota-chip">Total ownership clarity</span>
              <h2 className="text-pretty text-3xl font-black tracking-tight text-secondary sm:text-4xl">
                Understand payments, insurance, and incentives before you step inside the dealership.
              </h2>
              <p className="text-lg text-muted-foreground sm:text-xl">
                Toyota Agent blends real-world insurer quotes with current Toyota offers, so every figure feels
                trustworthy.
              </p>

              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Personalized payment scenarios with APR transparency
                </li>
                <li className="flex items-center gap-3">
                  <Gauge className="h-4 w-4 text-primary" />
                  Ownership cost forecasts tuned to your commute and lifestyle
                </li>
                <li className="flex items-center gap-3">
                  <CalendarCheck className="h-4 w-4 text-primary" />
                  One-click test drive scheduling once you're ready
                </li>
              </ul>
            </div>

            <div className="toyota-surface relative overflow-hidden">
              <div className="relative grid gap-4 rounded-[1.5rem] border border-border/70 bg-card/90 p-6">
                <div className="rounded-2xl bg-secondary/90 p-6 text-secondary-foreground">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Featured plan</p>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-4xl font-bold text-white">$816</span>
                    <span className="text-sm text-white/70">per month</span>
                  </div>
                  <p className="mt-4 text-sm text-white/80">RAV4 Hybrid • 60 month plan • Insurance + payment</p>
                </div>
                <div className="grid gap-4 rounded-2xl border border-border/60 bg-background/90 p-5">
                  <div className="flex items-center justify-between text-sm text-muted-foreground/90">
                    <span>Car payment</span>
                    <span className="font-semibold text-secondary">$671/mo</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground/90">
                    <span>Insurance estimate</span>
                    <span className="font-semibold text-secondary">$145/mo</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground/90">
                    <span>Manufacturer incentives</span>
                    <span className="font-semibold text-primary">-$1,200</span>
                  </div>
                  <div className="h-[1px] w-full bg-border" />
                  <div className="flex items-center justify-between text-base font-semibold text-secondary">
                    <span>Total ownership view</span>
                    <span>$816/mo</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="cta" className="px-4">
            <div className="toyota-container">
              <div className="toyota-gradient relative overflow-hidden rounded-[2.5rem] px-8 py-16 sm:px-12">
                <div className="absolute -left-24 top-24 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
                <div className="absolute -right-16 -top-32 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
                <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-2xl space-y-5">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                      Toyota precision. Human warmth.
                    </span>
                    <h2 id="cta" className="text-pretty text-3xl font-black tracking-tight sm:text-4xl">
                      Ready to drive your Toyota story forward?
                    </h2>
                    <p className="text-base text-white/80 sm:text-lg">
                      Join the experience and let Toyota Agent orchestrate every step—from discovery to the first turn
                      of the ignition.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Link href="/signup">
                      <Button className="h-12 rounded-full bg-white px-8 text-base font-semibold text-secondary hover:bg-white/90">
                        Create Toyota Agent account
                      </Button>
                  </Link>
                    <Link href="/chat">
                      <Button
                        variant="ghost"
                        className="h-12 rounded-full border border-white/25 bg-white/10 px-8 text-base font-semibold text-white hover:bg-white/20"
                      >
                        Talk to the agent
                      </Button>
                  </Link>
                  </div>
            </div>
          </div>
          </div>
          </section>
        </div>
      </div>
      <ToyotaFooter />
    </div>
  )
}
