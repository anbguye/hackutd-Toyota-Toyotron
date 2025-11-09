"use client";

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Spinner } from "@/components/ui/spinner"

type RequireAuthProps = {
  children: React.ReactNode
  allowWithoutPreferences?: boolean
}

export function RequireAuth({ children, allowWithoutPreferences = false }: RequireAuthProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    let mounted = true
    const check = async () => {
      setChecking(true)
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      const authed = !!data.session
      const nextPath = encodeURIComponent(pathname || "/")

      if (!authed) {
        setIsAllowed(false)
        setChecking(false)
        router.replace(`/login?next=${nextPath}`)
        return
      }

      if (!allowWithoutPreferences) {
        const { data: preferences, error: preferencesError } = await supabase
          .from("user_preferences")
          .select("id")
          .eq("user_id", data.session.user.id)
          .maybeSingle()

        if (!mounted) return

        if (preferencesError && preferencesError.code !== "PGRST116") {
          console.error("Failed to fetch user preferences:", preferencesError)
        }

        if (!preferences?.id) {
          setIsAllowed(false)
          setChecking(false)
          if (pathname !== "/quiz") {
            router.replace("/quiz")
          }
          return
        }
      }

      setIsAllowed(true)
      setChecking(false)
    }
    check()
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      check()
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [allowWithoutPreferences, pathname, router])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-6 h-6" />
      </div>
    )
  }
  if (!isAllowed) return null
  return <>{children}</>
}


