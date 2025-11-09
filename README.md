# Toyota Agent Frontend

Modern Next.js interface for the Toyota Agent experience delivered at HackUTD. This refresh focuses on a cohesive Toyota visual language while keeping the underlying data flow and Supabase integrations intact.

## Highlights

- **Toyota design system** – global palette, typography, and surface treatments aligned with brand standards.
- **Shared chrome** – reusable header and footer components with responsive navigation and official SVG branding.
- **Curated journeys** – redesigned landing, browsing, comparison, car detail, quiz, chat, auth, and test-drive flows.
- **UI consistency** – rounded button & badge primitives, card spacing, and utility helpers such as `toyota-container`, `toyota-surface`, and gradient treatments.

## Tech Stack

- [Next.js 16](https://nextjs.org/) + React 19
- Tailwind CSS v4 (via `@import "tailwindcss"`) with custom Toyota utilities
- Supabase auth client (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Radix UI primitives, Shadcn-inspired component layer, Lucide icons

## Getting Started

```bash
# Install dependencies
cd web
npm install

# Run the development server
npm run dev

# Lint the project
npm run lint
```

## Environment Setup

Create a `.env.local` file inside `web/` with your Supabase credentials:

```bash
# Required: Supabase Configuration
# Get these from your Supabase project: https://app.supabase.com → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Server-side only (for admin operations)
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**To get your Supabase credentials:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy the **Project URL** → use as `NEXT_PUBLIC_SUPABASE_URL`
5. Copy the **anon/public key** → use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Project Layout

- `web/app/globals.css` & `web/styles/globals.css` – global tokens and Toyota utility classes.
- `web/components/layout/` – shared header and footer used across all routes.
- `web/app/*` – route-based components updated with Toyota theming.
- `web/components/ui/` – button, badge, and other primitives restyled for the new system.

## Contributing

1. Branch from `main`.
2. Make UI-only adjustments (backend logic and API contracts are off-limits).
3. Run `npm run lint`.
4. Submit a PR describing the visual/UX improvements.

## License

MIT © Toyota Agent HackUTD Team
