import Link from 'next/link'
import Image from 'next/image'

import { cn } from '@/lib/utils'

type FooterLinkGroup = {
  title: string
  links: Array<{ label: string; href: string }>
}

type ToyotaFooterProps = {
  columns?: FooterLinkGroup[]
  className?: string
}

const defaultColumns: FooterLinkGroup[] = [
  {
    title: 'Discover',
    links: [
      { label: 'Browse Models', href: '/browse' },
      { label: 'Compare Vehicles', href: '/compare' },
      { label: 'Test Drive', href: '/test-drive' },
      { label: 'Toyota Safety Sense', href: '/#safety' },
    ],
  },
  {
    title: 'Experience',
    links: [
      { label: 'Talk to Agent', href: '/chat' },
      { label: 'Preference Quiz', href: '/quiz' },
      { label: 'Ownership Costs', href: '/#pricing' },
      { label: 'Dealership Locator', href: '/#dealers' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Toyotron', href: '/#about' },
      { label: 'HackUTD Project', href: '/#team' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
]

export function ToyotaFooter({
  columns = defaultColumns,
  className,
}: ToyotaFooterProps) {
  const year = new Date().getFullYear()

  return (
    <footer className={cn('mt-24 bg-secondary pt-16 text-secondary-foreground/90', className)}>
      <div className="toyota-container">
        <div className="grid gap-12 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="max-w-md space-y-6">
            <div className="relative h-10 w-32">
              <Image
                src="/Toyota_Logo.svg"
                alt="Toyota"
                fill
                className="object-contain"
                priority
              />
            </div>
            <p className="text-sm/relaxed text-secondary-foreground/70">
              Toyotron is your intelligent co-pilot for finding, comparing, and experiencing Toyota vehicles.
              Meticulously crafted for a modern, human-centered shopping journey.
            </p>
          </div>

          {columns.map((group) => (
            <div key={group.title} className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-secondary-foreground/60">
                {group.title}
              </h4>
              <ul className="space-y-3 text-sm text-secondary-foreground/80">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="toyota-divider my-12" />

        <div className="flex flex-col gap-4 pb-12 text-xs text-secondary-foreground/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Toyotron. Crafted for HackUTD.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

