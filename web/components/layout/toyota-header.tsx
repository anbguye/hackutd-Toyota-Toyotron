"use client";

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Menu, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { supabase } from '@/lib/supabase/client'

type NavItem = {
  label: string
  href: string
}

type SecondaryLink = {
  label: string
  href: string
}

type CtaAction = {
  label: string
  href: string
}

type ToyotaHeaderProps = {
  navItems?: NavItem[]
  secondaryLinks?: SecondaryLink[]
  cta?: CtaAction
  rightSlot?: React.ReactNode
  className?: string
  variant?: 'solid' | 'transparent'
  isAuthenticated?: boolean
}

const DEFAULT_NAV: NavItem[] = [
  { label: 'Home', href: '/#top' },
  { label: 'Agent', href: '/chat' },
  { label: 'Models', href: '/browse' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Experience', href: '/#experience' },
]

const AUTHENTICATED_NAV: NavItem[] = [
  { label: 'Home', href: '/#top' },
  { label: 'Agent', href: '/chat' },
  { label: 'Profile', href: '/profile' },
  { label: 'Models', href: '/browse' },
  { label: 'Pricing', href: '/#pricing' },
]

const DEFAULT_SECONDARY: SecondaryLink[] = [{ label: 'Sign In', href: '/login' }]

const DEFAULT_CTA: CtaAction = { label: 'Launch Agent', href: '/signup' }
const AUTHENTICATED_CTA: CtaAction = { label: 'Retake Quiz', href: '/quiz' }

export function ToyotaHeader({
  navItems = DEFAULT_NAV,
  secondaryLinks = DEFAULT_SECONDARY,
  cta = DEFAULT_CTA,
  rightSlot,
  className,
  variant = 'solid',
  isAuthenticated: initialIsAuthenticated,
}: ToyotaHeaderProps) {
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isAuthenticated, setIsAuthenticated] = React.useState(initialIsAuthenticated ?? false)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (variant !== 'transparent') {
      setIsScrolled(false)
      return
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [variant])

  React.useEffect(() => {
    let mounted = true
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      if (mounted) {
        setIsAuthenticated(!!data.session)
      }
    }
    checkAuth()
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      checkAuth()
    })
    return () => {
      mounted = false
      subscription?.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const showTransparent = variant === 'transparent' && !isScrolled

  const headerClasses = cn(
    'fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 supports-[backdrop-filter]:backdrop-blur-0',
    showTransparent
      ? 'bg-transparent border-transparent text-zinc-900 md:text-white shadow-none'
      : 'bg-white border-zinc-200 text-zinc-800 shadow-sm',
    className,
  )

  const navLinkClasses = cn(
    'relative transition-colors',
    showTransparent ? 'text-zinc-900 hover:text-zinc-800 md:text-white md:hover:text-white/80' : 'text-zinc-700 hover:text-zinc-900',
  )

  const secondaryLinkClasses = showTransparent
    ? 'text-zinc-900 hover:text-zinc-700 md:text-white md:hover:text-white/80'
    : 'text-zinc-700 hover:text-zinc-900'

  return (
    <header data-sticky-header className={headerClasses}>
      <div className="toyota-container flex h-20 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-4">
          <span className="relative flex items-center gap-3">
            <span className="relative block h-10 w-32">
              <Image
                src="/Toyota_Logo.svg"
                alt="Toyota"
                fill
                className="object-contain"
                priority
              />
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold lg:flex">
          {(isAuthenticated ? AUTHENTICATED_NAV : navItems).map((item) => (
            <Link key={item.href} href={item.href} className={cn(navLinkClasses, 'group')}>
              <span className="tracking-wide">{item.label}</span>
              <span className="absolute -bottom-2 left-0 h-0.5 w-full origin-left scale-x-0 bg-primary transition-transform duration-300 ease-out group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          {isAuthenticated ? (
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="outline"
              className={secondaryLinkClasses + ' border-current'}
            >
              <LogOut className="h-4 w-4" />
              <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </Button>
          ) : (
            secondaryLinks.map((link) => (
              <Link key={link.href} href={link.href} className={secondaryLinkClasses}>
                {link.label}
              </Link>
            ))
          )}
          <Button
            asChild
            className="rounded-full bg-[#EB0A1E] px-6 py-2 text-sm font-semibold text-white shadow-[0_18px_40px_-22px_rgba(235,10,30,0.75)] hover:bg-[#cf091a]"
          >
            <Link href={isAuthenticated ? AUTHENTICATED_CTA.href : cta.href} className="inline-flex items-center gap-2">
              <span>{isAuthenticated ? AUTHENTICATED_CTA.label : cta.label}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          {rightSlot}
        </div>

        <div className="lg:hidden">
          {mounted ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    'rounded-full border-border/70 bg-white text-zinc-900 shadow-sm hover:bg-white/90',
                    showTransparent && 'bg-white/90',
                  )}
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open navigation</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-white text-zinc-900">
                <div className="flex flex-col gap-10 px-1 py-10">
                  <Link href="/" className="flex items-center gap-3">
                    <span className="relative block h-9 w-28">
                      <Image
                        src="/Toyota_Logo.svg"
                        alt="Toyota"
                        fill
                        className="object-contain"
                        priority
                      />
                    </span>
                  </Link>
                  <div className="flex flex-col gap-6">
                    {(isAuthenticated ? AUTHENTICATED_NAV : navItems).map((item) => (
                      <Link key={item.href} href={item.href} className="text-lg font-semibold text-zinc-800">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <div className="flex flex-col gap-3">
                    {isAuthenticated ? (
                      <Button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        variant="outline"
                        className="h-10 w-full rounded-full border-zinc-700 text-base font-semibold text-zinc-700 hover:bg-zinc-50"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                      </Button>
                    ) : (
                      secondaryLinks.map((link) => (
                        <Link key={link.href} href={link.href} className="text-base font-semibold text-zinc-700">
                          {link.label}
                        </Link>
                      ))
                    )}
                    <Button
                      asChild
                      className="h-12 w-full rounded-full bg-[#EB0A1E] text-base font-semibold text-white shadow-[0_24px_44px_-26px_rgba(235,10,30,0.7)] hover:bg-[#cf091a]"
                    >
                      <Link
                        href={isAuthenticated ? AUTHENTICATED_CTA.href : cta.href}
                        className="inline-flex items-center justify-center gap-2"
                      >
                        <span>{isAuthenticated ? AUTHENTICATED_CTA.label : cta.label}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    {rightSlot && <div className="pt-2">{rightSlot}</div>}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Button
              variant="outline"
              size="icon"
              className={cn(
                'rounded-full border-border/70 bg-white text-zinc-900 shadow-sm hover:bg-white/90',
                showTransparent && 'bg-white/90',
              )}
              aria-label="Open navigation"
              aria-hidden="true"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

