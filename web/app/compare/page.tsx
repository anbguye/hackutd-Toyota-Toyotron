import { Suspense } from "react"

import { ToyotaFooter } from "@/components/layout/toyota-footer"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { CompareClient } from "./CompareClient"

export default function ComparePage() {
  return (
    <RequireAuth>
      <div className="flex min-h-full flex-col bg-background text-foreground">
        <div className="flex-1 space-y-16 pb-24">
          <section className="toyota-container space-y-6 pt-4">
            <div className="space-y-4">
              <span className="toyota-chip">Side-by-side intelligence</span>
              <div className="space-y-3">
                <h1 className="text-pretty text-3xl font-black tracking-tight text-secondary sm:text-4xl">
                  Compare Toyota models with clarity and confidence.
                </h1>
                <p className="max-w-3xl text-base text-muted-foreground sm:text-lg">
                  Toyotron surfaces curated specs, costs, and safety signals in an interface tuned for decision
                  making—balanced, legible, and unmistakably Toyota.
                </p>
              </div>
            </div>

            <Suspense fallback={<div className="text-center py-12">Loading comparison...</div>}>
              <CompareClient />
            </Suspense>
          </section>
        </div>

        <ToyotaFooter />
      </div>
    </RequireAuth>
  )
}
