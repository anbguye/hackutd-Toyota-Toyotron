import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Suspense } from "react"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ToyotaHeader } from "@/components/layout/toyota-header"
import ScrollOffset from "./_components/ScrollOffset"
import HashAnchorFix from "./_components/HashAnchorFix"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" })

const NAV_ITEMS = [
  { label: "Home", href: "/#top" },
  { label: "Agent", href: "/chat" },
  { label: "Models", href: "/browse" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Experience", href: "/#experience" },
]

const SECONDARY_LINKS = [{ label: "Sign In", href: "/login" }]

export const metadata: Metadata = {
  title: "Toyotron - Find Your Perfect Toyota",
  description: "AI-powered Toyota shopping companion with guided discovery",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <ScrollOffset />
        <Suspense fallback={null}>
          <HashAnchorFix />
        </Suspense>
        <div className="flex min-h-screen flex-col bg-background">
          <ToyotaHeader navItems={NAV_ITEMS} secondaryLinks={SECONDARY_LINKS} />
          <div aria-hidden="true" className="shrink-0" style={{ height: "var(--header-h, 80px)" }} />
          <main className="flex-1">
            {children}
          </main>
        </div>
        <Analytics />
      </body>
    </html>
  )
}
