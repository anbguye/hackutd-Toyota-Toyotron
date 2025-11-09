"use client";

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"

export function LogoutButton() {
  const router = useRouter()
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace("/login")
  }
  return (
    <Button variant="outline" size="sm" onClick={handleLogout}>
      Logout
    </Button>
  )
}


