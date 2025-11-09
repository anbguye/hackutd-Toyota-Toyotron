"use client";

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, UserPlus } from "lucide-react"

import { ToyotaFooter } from "@/components/layout/toyota-footer"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    try {
      setLoading(true)
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })
      if (signUpError) throw signUpError
      router.replace("/quiz")
    } catch (err: any) {
      setError(err?.message ?? "Failed to sign up")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=/quiz`,
      },
    })
  }
  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="grid w-full max-w-5xl gap-10 rounded-[2.5rem] border border-border/70 bg-card/70 p-10 shadow-[0_32px_80px_-70px_rgba(15,20,26,0.85)] backdrop-blur lg:grid-cols-[0.95fr_1.05fr] lg:p-16">
          <div className="flex flex-col justify-between gap-10">
            <div className="space-y-6">
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-secondary">
                <ArrowLeft className="h-4 w-4" />
                Back to Toyota Agent
              </Link>
              <div className="space-y-4">
                <h1 className="text-3xl font-black tracking-tight text-secondary sm:text-4xl">
                  Craft your Toyota Agent profile.
                </h1>
                <p className="text-base text-muted-foreground sm:text-lg">
                  Save your quiz results, favourite models, and personalized cost breakdowns. Your Toyota journey stays
                  synchronized across chat, comparisons, and test-drive bookings.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="font-semibold text-secondary">Why create an account?</p>
                    <ul className="space-y-1 text-sm">
                      <li>• Store your Toyota preferences and chat history</li>
                      <li>• Receive tailored incentives and financing scenarios</li>
                      <li>• Book test drives with a single tap</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              By signing up you agree to Toyota Agent&apos;s terms of service and privacy policy.
            </p>
          </div>

          <div className="rounded-[2rem] border border-border/70 bg-background/90 p-8 shadow-[0_24px_58px_-50px_rgba(15,20,26,0.85)]">
            <form className="space-y-6" onSubmit={handleSignup}>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-secondary">
                  Full name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Jordan Reyes"
                  className="h-12 rounded-full border-border/70 bg-card/60 px-5"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
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
                  className="h-12 rounded-full border-border/70 bg-card/60 px-5"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-secondary">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a secure password"
                  className="h-12 rounded-full border-border/70 bg-card/60 px-5"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-semibold text-secondary">
                  Confirm password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Repeat password"
                  className="h-12 rounded-full border-border/70 bg-card/60 px-5"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-sm font-semibold text-red-500">{error}</p>}

              <Button
                type="submit"
                className="h-12 w-full rounded-full text-sm font-semibold shadow-[0_24px_48px_-32px_rgba(235,10,30,0.6)]"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create account"}
              </Button>
            </form>

            <div className="mt-8 space-y-4">
              <div className="relative text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
                <span className="bg-background px-3">Or continue with</span>
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
              </div>
              <Button
                type="button"
                onClick={handleGoogleSignup}
                variant="outline"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-border/70 bg-card/70 text-sm font-semibold hover:border-primary/60"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign up with Google
              </Button>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <ToyotaFooter />
    </div>
  )
}
