"use client";

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

function AuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      const code = searchParams.get("code")
      const next = searchParams.get("next") || "/chat"
      const errDesc = searchParams.get("error_description")
      if (errDesc) {
        setError(errDesc)
        return
      }
      try {
        if (code) {
          const { error: exchError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchError) throw exchError
        } else {
          // Fallback: ensure session exists
          await supabase.auth.getSession()
        }
        router.replace(next)
      } catch (e: any) {
        setError(e?.message ?? "Authentication failed")
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      {error ? <p className="text-red-500 text-sm">{error}</p> : <p>Signing you in...</p>}
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p>Signing you in...</p>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  )
}


