"use client";

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CalendarCheck, Gauge, MessageSquare, ShieldCheck, Sparkles } from "lucide-react"
import { motion, useScroll, useTransform } from "framer-motion"

import { ToyotaFooter } from "@/components/layout/toyota-footer"
import { Button } from "@/components/ui/button"
import { PageShell, MotionSection } from "@/components/motion/PageShell"
import { ScrollReveal } from "@/components/motion/ScrollReveal"
import { fadeUp, staggerContainer } from "@/lib/motion/variants"
import { useReducedMotion } from "@/lib/motion/useReducedMotion"
import { cn } from "@/lib/utils"

const heroStats = [
  { label: "Toyota Models", value: "36+", detail: "2025 lineup" },
  { label: "Drivers Helped", value: "5k+", detail: "Find their Toyota" },
  { label: "Time Saved", value: "12 hrs", detail: "Less research time" },
]

const featureCards = [
  {
    icon: MessageSquare,
    title: "Chat with your Toyota expert",
    description:
      "Tell us what you need—budget, how many seats, daily commute or weekend trips. We'll help you find the right Toyota.",
    chip: "AI chat",
  },
  {
    icon: Gauge,
    title: "Compare models side-by-side",
    description:
      "See pricing, MPG, features, and what you'll actually pay each month. No guesswork, just clear numbers.",
    chip: "Compare",
  },
  {
    icon: ShieldCheck,
    title: "Built on Toyota reliability",
    description:
      "Every recommendation includes Toyota Safety Sense features, real reliability data, and what's available at your local dealer.",
    chip: "Trust",
  },
]


const experienceSteps = [
  {
    step: "Step 01",
    title: "Tell us what you need",
    description: "Quick quiz about your budget, how many seats you need, and how you'll use the car.",
  },
  {
    step: "Step 02",
    title: "Chat with your Toyota agent",
    description: "Ask questions, get answers. We'll help you narrow down to the models that make sense for you.",
  },
  {
    step: "Step 03",
    title: "Compare your options",
    description: "See pricing, monthly payments, MPG, and features side-by-side. No surprises.",
  },
  {
    step: "Step 04",
    title: "Schedule a test drive",
    description: "When you're ready, book a test drive at your local Toyota dealer. We'll handle the details.",
  },
]

const heroOverlap = false

export default function LandingPage() {
  const prefersReducedMotion = useReducedMotion()
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 300], [0, -60])
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3])
  const imageY = useTransform(scrollY, [0, 300], [0, 40])
  const cardY = useTransform(scrollY, [0, 300], [0, -20])
  const [heroImage, setHeroImage] = useState<string>("/toyota-rav4-hybrid.jpg") // Fallback image

  // Fetch a random car image on mount
  useEffect(() => {
    fetch("/api/cars/random")
      .then((res) => res.json())
      .then((data) => {
        if (data.image && typeof data.image === "string") {
          setHeroImage(data.image)
        }
      })
      .catch((error) => {
        console.error("[LandingPage] Failed to fetch random car image:", error)
        // Keep fallback image
      })
  }, [])

  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <div className="relative flex-1">
        <div className="pointer-events-none absolute -top-[240px] right-[-240px] h-[520px] w-[520px] rounded-full bg-primary/25 blur-[140px]" />
        <div className="pointer-events-none absolute -top-[100px] left-[20%] h-[400px] w-[400px] rounded-full bg-primary/18 blur-[120px]" />
        <div className="pointer-events-none absolute top-[40%] right-[10%] h-[350px] w-[350px] rounded-full bg-primary/15 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-[-360px] left-[-200px] h-[620px] w-[620px] rounded-full bg-secondary/10 blur-[160px]" />

        <PageShell className="space-y-32 pb-24" style={{ paddingTop: "calc(var(--header-h, 80px) + 2.5rem)" }}>
          <MotionSection
            id="top"
            className="toyota-container grid grid-cols-1 items-center gap-8 scroll-mt-24 md:scroll-mt-28 lg:scroll-mt-32 lg:grid-cols-2"
          >
            <motion.div
              className="space-y-10"
              variants={fadeUp}
              style={prefersReducedMotion ? {} : { y: heroY, opacity: heroOpacity }}
            >
              <motion.span className="toyota-chip" variants={fadeUp}>Toyotron</motion.span>
              <motion.div className="space-y-6" variants={fadeUp}>
                <h1 className="text-balance text-4xl font-black tracking-tight text-secondary sm:text-5xl lg:text-6xl">
                  Find your Toyota. We'll help you get there.
                </h1>
                <p className="text-lg text-muted-foreground sm:text-xl">
                  Chat with our Toyota agent to find the right model for your budget and needs. Compare options, see real pricing, and schedule a test drive.
                </p>
              </motion.div>
              <motion.div className="flex flex-col gap-3 sm:flex-row sm:items-center" variants={fadeUp}>
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
              </motion.div>
              <motion.div
                className={cn(
                  "mt-6 rounded-2xl border border-border/70 bg-white/6 backdrop-blur-md p-6 shadow-lg border-white/10",
                  heroOverlap && "xl:-mt-16 xl:ml-8 xl:max-w-[520px]",
                )}
                variants={fadeUp}
                style={prefersReducedMotion ? {} : { y: cardY }}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground/80">
                  Toyotron
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
              </motion.div>
            </motion.div>

            <motion.div
              className="relative w-full rounded-3xl shadow-lg"
              variants={fadeUp}
              style={prefersReducedMotion ? {} : { y: imageY }}
            >
              <div className="relative w-full overflow-hidden rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/10 opacity-60" />
                <Image
                  src={heroImage}
                  alt="Toyota vehicle"
                  className="block h-[360px] w-full object-contain md:h-[420px] lg:h-[520px]"
                  width={1040}
                  height={780}
                  priority
                  unoptimized={heroImage.startsWith("http")}
                />
                {/* Specular glint effect */}
                {!prefersReducedMotion && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "radial-gradient(circle at 0% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)",
                    }}
                    animate={{
                      x: ["-100%", "200%"],
                      opacity: [0, 0.3, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      repeatDelay: 2,
                      ease: "easeInOut",
                    }}
                />
                )}
          </div>
        </motion.div>
      </MotionSection>

      <MotionSection id="features" className="toyota-container space-y-14 scroll-mt-24 md:scroll-mt-28 lg:scroll-mt-32">
        <ScrollReveal>
            <div className="max-w-3xl space-y-4">
              <span className="toyota-chip">Why Toyotron</span>
              <h2 className="text-pretty text-3xl font-black tracking-tight text-secondary sm:text-4xl">
              Simple tools to find your next Toyota.
              </h2>
              <p className="text-lg text-muted-foreground sm:text-xl">
              We built this to make car shopping easier. No sales pressure, just honest help finding the Toyota that fits your life.
              </p>
            </div>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
            <div className="grid gap-6 lg:grid-cols-3">
          {featureCards.map((feature, index) => (
            <ScrollReveal key={feature.title} delay={0.15 + index * 0.05}>
              <motion.div
                className="group relative flex h-full flex-col gap-6 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm p-8"
                whileHover={prefersReducedMotion ? {} : { y: -4, borderColor: "#EB0A1E", boxShadow: "0 32px 60px -40px rgba(235,10,30,0.6)" }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
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
              </motion.div>
            </ScrollReveal>
            ))}
        </div>
        </ScrollReveal>
      </MotionSection>

      <MotionSection
            id="experience"
            className="toyota-container scroll-mt-24 md:scroll-mt-28 lg:scroll-mt-32"
          >
        <ScrollReveal>
          <div className="rounded-[2.5rem] border border-border/70 bg-card/80 p-10 shadow-[0_32px_75px_-50px_rgba(15,20,26,0.7)] backdrop-blur-md border-white/10">
              <div className="flex flex-col gap-12 lg:flex-row">
              <ScrollReveal delay={0.1}>
                <div className="max-w-sm space-y-6">
                  <span className="toyota-chip">How it works</span>
                  <h2 className="text-pretty text-3xl font-black tracking-tight text-secondary sm:text-4xl">
                    From browsing to test drive.
                  </h2>
                  <p className="text-base text-muted-foreground">
                    Start with a quick quiz, chat with our agent, compare models, and book a test drive. We'll guide you through each step.
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
              </ScrollReveal>

                <div className="grid flex-1 gap-6 sm:grid-cols-2">
                {experienceSteps.map((step, index) => (
                  <ScrollReveal key={step.title} delay={0.2 + index * 0.05}>
                    <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/80 p-6">
                      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                        {step.step}
                      </span>
                      <h3 className="text-lg font-semibold text-secondary">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </ScrollReveal>
                  ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </MotionSection>

      <MotionSection
            id="pricing"
            className="toyota-container grid gap-8 scroll-mt-24 md:scroll-mt-28 lg:scroll-mt-32 lg:grid-cols-[1.05fr_0.95fr] lg:items-center"
          >
        <ScrollReveal>
            <div className="space-y-6">
            <span className="toyota-chip">See what you'll actually pay</span>
              <h2 className="text-pretty text-3xl font-black tracking-tight text-secondary sm:text-4xl">
              Monthly payments, insurance, and incentives—all upfront.
              </h2>
              <p className="text-lg text-muted-foreground sm:text-xl">
              We show you the real numbers: monthly payment, insurance estimates, and any current Toyota incentives. No surprises when you visit the dealer.
              </p>

              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                See monthly payments with different loan terms and rates
                </li>
                <li className="flex items-center gap-3">
                  <Gauge className="h-4 w-4 text-primary" />
                Get insurance estimates based on your location and driving history
                </li>
                <li className="flex items-center gap-3">
                  <CalendarCheck className="h-4 w-4 text-primary" />
                Schedule test drives at your local Toyota dealer
                </li>
              </ul>
            </div>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
            <div className="toyota-surface relative overflow-hidden">
          <div className="relative grid gap-4 rounded-[1.5rem] border border-border/70 bg-card/90 backdrop-blur-sm p-6 border-white/10">
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
        </ScrollReveal>
      </MotionSection>

      <MotionSection aria-labelledby="cta" className="px-4">
            <div className="toyota-container">
          <ScrollReveal>
              <div className="toyota-gradient relative overflow-hidden rounded-[2.5rem] px-8 py-16 sm:px-12">
                <div className="absolute -left-24 top-24 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
                <div className="absolute -right-16 -top-32 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
                <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <ScrollReveal delay={0.1}>
                  <div className="max-w-2xl space-y-5">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                      Ready to find your Toyota?
                    </span>
                    <h2 id="cta" className="text-pretty text-3xl font-black tracking-tight sm:text-4xl">
                      Let's get started.
                    </h2>
                    <p className="text-base text-white/80 sm:text-lg">
                      Create an account to save your preferences, or jump right in and start chatting with our Toyota agent.
                    </p>
                  </div>
                </ScrollReveal>
                <ScrollReveal delay={0.2}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Link href="/signup">
                      <Button className="h-12 rounded-full bg-white px-8 text-base font-semibold text-secondary hover:bg-white/90">
                        Create Toyotron account
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
                </ScrollReveal>
                  </div>
            </div>
          </ScrollReveal>
        </div>
      </MotionSection>
      </PageShell>
      </div>
      <ToyotaFooter />
    </div>
  )
}
