# Toyotatron

An AI-powered Toyota shopping companion built with Next.js and advanced multi-agent orchestration. Toyotatron helps users discover, compare, and purchase Toyota vehicles through intelligent chat, guided discovery, and seamless test drive booking.

## Overview

Toyotatron is a complete car shopping experience platform submitted to HackUTD. It combines modern web technologies with NVIDIA's Nemotron AI model to create a multi-agent system that understands user preferences, searches a comprehensive Toyota database, calculates financing options, and facilitates test drive bookings—all through natural language conversation.

The platform features a beautifully designed Toyota-branded interface built with Next.js 16, React 19, and Tailwind CSS v4, backed by Supabase for authentication and data persistence, and powered by NVIDIA Nemotron for intelligent multi-agent reasoning.

## Core Features

### User Discovery and Preferences

- **Interactive Quiz**: 5-step preference questionnaire capturing budget, vehicle type, passenger needs, use case, and fuel efficiency priorities
- **Preference Persistence**: All user preferences stored in Supabase for personalized experiences
- **Optional Personal Information**: Users can optionally share their age, gender, occupation, current vehicle, and reason for purchase to refine recommendations

### Intelligent Chat Interface

- **Multi-Agent AI System**: Four specialized agents (Intent, Vehicle, Finance, Report) collaborate to understand queries and provide recommendations
- **NVIDIA Nemotron Integration**: Uses `nvidia/llama-3.3-nemotron-super-49b-v1.5` via OpenRouter for natural language understanding
- **Voice Input/Output**: Real-time speech recognition and text-to-speech synthesis with silence detection
- **Retell Phone Integration**: Users can call (405) 297-4640 to speak with the voice agent
- **Agent Workflow Visualization**: Real-time display of which agent is currently processing a request

### Vehicle Search and Browse

- **Real-Time Database Search**: Query comprehensive Toyota catalog with filters for budget, vehicle type, and seat count
- **Flexible Filtering**: Budget range sliders, body style selection (sedan, SUV, truck, hybrid), seat preferences (2, 5, 7+), and MPG sorting
- **Vehicle Details**: MSRP, MPG (city/highway/combined), drivetrain, fuel type, available seats, and high-quality vehicle images
- **Responsive Grid**: Pagination and dynamic loading with 12 vehicles per page

### Vehicle Comparison

- **Side-by-Side Analysis**: Compare multiple Toyota models across pricing, specifications, and features
- **Detailed Specifications**: MSRP, MPG, body type, engine type, fuel type, seating, drivetrain, and features
- **Decision Support**: Clear presentation of costs and features to support purchase decisions

### Trade-In Estimation

- **VIN Decoding**: Uses NHTSA vehicle database to decode 17-character VINs
- **Vehicle Valuation**: Calculates estimated trade-in value based on baseline MSRP from Toyota catalog, depreciation calculation (20% first year, 10% per year up to 5 years), and condition assessment from uploaded photos using GPT-4o vision
- **Photo-Based Condition Analysis**: AI analyzes vehicle photos for damage, wear, and condition scoring (0-100)
- **Discount Application**: Applies condition-based discounts to estimate final trade-in value

### Financing Calculator

- **Flexible Loan Terms**: Calculate monthly payments for various loan durations
- **Interest Rate Estimation**: Estimates current market rates
- **Insurance Estimates**: Approximate insurance costs based on vehicle and location
- **Lease Options**: Basic lease cost calculations
- **Real-World Pricing**: Shows total cost of ownership including insurance and incentives

### Test Drive Scheduling

- **Calendar Selection**: Select available dates for test drive appointments
- **Time Slot Booking**: 30-minute increment time slots (9 AM - 6 PM)
- **Dealer Selection**: Choose from three Dallas-area Toyota locations
- **Confirmation Flow**: Immediate confirmation with details and email notification
- **Supabase Integration**: All bookings stored with user and vehicle information

### Email Integration

- **Confirmation Emails**: Resend API sends detailed booking confirmations
- **HTML Email Templates**: Formatted emails with appointment details
- **Retell Integration**: Voice transcriptions and summaries included in emails

## Project Structure

```
web/
├── app/
│   ├── page.tsx                          # Landing page with hero and features
│   ├── layout.tsx                        # Root layout with header/footer
│   ├── globals.css                       # Global styles and Toyota utilities
│   ├── quiz/
│   │   └── page.tsx                      # 5-step preference quiz
│   ├── chat/
│   │   └── page.tsx                      # Main chat interface with voice
│   ├── browse/
│   │   ├── page.tsx                      # Vehicle listing with filters
│   │   └── BrowseClient.tsx              # Client-side browse logic
│   ├── compare/
│   │   ├── page.tsx                      # Compare page wrapper
│   │   └── CompareClient.tsx             # Side-by-side comparison
│   ├── car/
│   │   └── [id]/
│   │       ├── page.tsx                  # Individual vehicle detail page
│   │       ├── car-detail-content.tsx    # Full specifications and features
│   │       ├── total-monthly-snapshot.tsx # Financing summary card
│   │       └── financing-selector.tsx    # Loan term selector
│   ├── test-drive/
│   │   └── page.tsx                      # Test drive booking form
│   ├── profile/
│   │   └── page.tsx                      # User profile and preferences
│   ├── login/ & signup/
│   │   └── page.tsx                      # Authentication pages
│   ├── auth/
│   │   └── callback/page.tsx             # OAuth callback handler
│   └── api/
│       ├── chat/
│       │   ├── route.tsx                 # Main chat endpoint
│       │   ├── orchestrator.ts           # Query routing logic
│       │   ├── agents.ts                 # Intent, Vehicle, Finance, Report agents
│       │   ├── tools.ts                  # Tool definitions
│       │   └── knowledge.ts              # Static knowledge base
│       ├── cars/
│       │   ├── route.ts                  # Vehicle search and filtering
│       │   └── random/route.ts           # Random car for hero image
│       ├── tradein/
│       │   └── route.ts                  # Trade-in valuation
│       ├── bookings/
│       │   └── route.ts                  # Test drive booking creation
│       └── retell/
│           ├── display-car-recommendations/route.ts
│           ├── search-toyota-trims/route.ts
│           ├── schedule-test-drive/route.ts
│           ├── send-email/route.ts
│           └── schemas.ts
├── components/
│   ├── layout/
│   │   ├── toyota-header.tsx             # Top navigation
│   │   └── toyota-footer.tsx             # Footer with links
│   ├── chat/
│   │   ├── CarRecommendations.tsx        # Car card grid
│   │   ├── AgentWorkflow.tsx             # Multi-agent status display
│   │   ├── VoiceButton.tsx               # Voice toggle button
│   │   └── TypingIndicator.tsx           # Loading animation
│   ├── auth/
│   │   ├── RequireAuth.tsx               # Auth gate wrapper
│   │   └── LogoutButton.tsx              # Logout control
│   ├── ui/
│   │   ├── button.tsx, input.tsx, etc.   # Shadcn-inspired components
│   │   └── carousel.tsx                  # Image gallery component
│   ├── motion/
│   │   ├── PageShell.tsx                 # Animation wrapper
│   │   ├── ScrollReveal.tsx              # Scroll-triggered animations
│   │   └── variants.ts                   # Framer Motion configurations
│   └── memoized-markdown.tsx             # Optimized markdown rendering
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     # Client-side Supabase instance
│   │   ├── server.ts                     # Server-side Supabase instance
│   │   └── types.ts                      # TypeScript interfaces
│   ├── voice/
│   │   ├── speechRecognition.ts          # Web Speech API wrapper
│   │   ├── speechSynthesis.ts            # Text-to-speech synthesis
│   │   └── silenceDetector.ts            # Audio silence detection
│   ├── motion/
│   │   ├── variants.ts                   # Animation definitions
│   │   └── useReducedMotion.ts           # Accessibility hook
│   └── utils.ts                          # Utility functions
├── hooks/
│   ├── use-mobile.ts                     # Mobile viewport detection
│   └── use-toast.ts                      # Toast notification system
├── public/
│   ├── icon*.png & icon.svg              # App icons
│   ├── apple-icon.png                    # iOS icon
│   └── toyota-*.png & *.jpg              # Vehicle images
├── package.json                          # Dependencies
├── tsconfig.json                         # TypeScript configuration
├── next.config.mjs                       # Next.js configuration
└── tailwind.config.ts                    # Tailwind CSS configuration
```

## Technical Stack

### Frontend

- Next.js 16 - React framework with App Router and Server Components
- React 19 - UI library with latest hooks and features
- TypeScript - Type-safe development
- Tailwind CSS v4 - Utility-first styling with Toyota-branded customizations
- Radix UI - Headless component primitives
- Framer Motion - Animation and motion library
- Lucide React - Icon library
- React Hook Form - Form state management
- Zod - Runtime type validation

### Backend & Infrastructure

- Next.js API Routes - Serverless endpoint handlers
- Supabase - PostgreSQL database, authentication, real-time, and file storage
- Resend - Email service for booking confirmations
- Retell SDK - Phone-based voice agent integration

### AI & LLMs

- NVIDIA Nemotron (nvidia/llama-3.3-nemotron-super-49b-v1.5) - Primary LLM via OpenRouter
- OpenRouter - AI model provider and orchestration
- OpenAI GPT-4o - Vision model for trade-in condition assessment
- Vercel AI SDK - Client and server utilities for LLM integration
- Web Speech API - Browser-based speech recognition and synthesis

### Development Tools

- ESLint - Code linting
- TypeScript - Static type checking

## Architecture

### Multi-Agent System

The core intelligence comes from a sophisticated multi-agent orchestration system in web/app/api/chat/:

#### Orchestrator Agent (orchestrator.ts)

Routes incoming queries to the appropriate processing path:

- Static Knowledge: Answers general Toyota questions from a built-in knowledge base
- Vehicle Search: Routes to multi-agent system for complex queries with constraints
- Finance Only: Quick financing calculations for specific prices
- Standard Chat: General conversation with tool assistance

The orchestrator checks query intent using pattern matching and structured constraint detection.

#### Intent Agent (agents.ts)

Parses natural language using Nemotron to extract structured intent:

- Budget constraints
- Vehicle type preferences
- Required features
- Use case requirements
- Finance needs

Converts unstructured user input into structured task parameters.

#### Vehicle Agent (agents.ts)

Searches the Toyota database with constraints from Intent Agent:

- Database queries via /api/cars
- Filtering by budget, type, seats, MPG
- Returns matching vehicles

Uses Supabase to query toyota_trim_specs table with applied constraints.

#### Finance Agent (agents.ts)

Calculates financing options using extracted constraints:

- Loan term options (24-72 months)
- Interest rate estimation
- Monthly payment calculation
- Insurance estimates
- Total cost of ownership

#### Report Agent (agents.ts)

Generates personalized narrative responses:

- Summarizes recommendations
- Explains financing options
- Suggests next steps (test drive, comparison)
- Generates email summaries

### Tool Integration

The system integrates with external services through a tool calling framework:

#### Vehicle Search (searchToyotaTrims)

GET /api/cars?budget_min=25000&budget_max=40000&type=suv&seats=5

Returns filtered vehicle list with images, specs, and pricing. Supports pagination and multiple filter combinations.

#### Car Display (displayCarRecommendations)

Renders vehicle cards with high-quality images, key specifications, pricing, feature highlights, and action buttons.

#### Financing (estimateFinance)

Calculates loan/lease options for a vehicle with monthly payments, total interest, and cost estimates.

#### Trade-In Estimation (estimateTradeIn)

POST /api/tradein with VIN and optional image. Returns estimated trade-in value by:

1. Decoding VIN via NHTSA API
2. Looking up baseline price in Toyota catalog
3. Calculating depreciation based on age
4. Optionally analyzing condition from photo using GPT-4o
5. Returning estimated trade-in value

#### Test Drive Scheduling (scheduleTestDrive)

POST /api/bookings with contact info, location, datetime, and vehicle details. Creates booking and sends confirmation email.

#### Email (sendEmailHtml)

Via Resend API to send formatted emails with appointment details and confirmations.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase account and project
- OpenRouter API key for NVIDIA Nemotron access
- Retell API key for voice integration
- Resend API key for email functionality

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd hackutd
```

2. Install dependencies

```bash
cd web
npm install
```

3. Set up environment variables

Create a `.env.local` file in the `web/` directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENROUTER_API_KEY=sk-or-v1-...
RETELL_API_KEY=key_...
RESEND_API_KEY=re_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_APP_NAME="Toyotatron"
```

### Environment Variables Reference

| Variable | Purpose | Required |
|----------|---------|----------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase instance URL | Yes |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Public Supabase key | Yes |
| SUPABASE_SERVICE_ROLE_KEY | Private Supabase key | Yes |
| OPENROUTER_API_KEY | AI model access for Nemotron | Yes |
| RETELL_API_KEY | Voice agent integration | Yes |
| RESEND_API_KEY | Email service | Yes |
| NEXT_PUBLIC_SITE_URL | Site base URL | No |
| OPENROUTER_SITE_URL | Referrer header | No |

### Database Setup

The application uses these Supabase tables:

#### toyota_trim_specs

Toyota vehicle database with specifications:

- trim_id (INTEGER PRIMARY KEY)
- model_year (INTEGER)
- make, model, submodel, trim (VARCHAR)
- description (TEXT)
- msrp (NUMERIC)
- body_type, body_seats, drive_type (VARCHAR/INTEGER)
- engine_type, fuel_type (VARCHAR)
- city_mpg, highway_mpg, combined_mpg (NUMERIC)
- image_url (TEXT)

#### user_preferences

User quiz responses and preferences:

- id (UUID PRIMARY KEY)
- user_id (UUID, FOREIGN KEY)
- budget_min, budget_max (INTEGER)
- car_types (TEXT[])
- seats, age (INTEGER)
- use_case, mpg_priority, sex, occupation (VARCHAR)
- reason_for_new_car, current_car (TEXT)
- trade_in_vin, trade_in_value_cents, trade_in_condition_score (various)
- trade_in_condition_issues, trade_in_image_url (various)
- trade_in_last_estimated_at, updated_at (TIMESTAMP)

#### bookings

Test drive appointment records:

- id (UUID PRIMARY KEY)
- user_id (UUID, FOREIGN KEY)
- trim_id (INTEGER, FOREIGN KEY)
- contact_name, contact_email, contact_phone (VARCHAR)
- preferred_location (VARCHAR)
- booking_datetime (TIMESTAMP)
- vehicle_make, vehicle_model, vehicle_year, vehicle_trim (various)
- created_at (TIMESTAMP)

#### auth.users

Supabase-managed user authentication with OAuth support.

## Running the Application

### Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Production Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## API Endpoints

### Public Endpoints

#### GET /api/cars

Search and filter Toyota vehicles.

Query Parameters:
- q - Search query (searches make, model, trim, description)
- type - Body type filter (sedan, suv, truck, hybrid, all)
- seats - Seat count (2, 5, 7, 7+, any)
- budget_min - Minimum MSRP in dollars
- budget_max - Maximum MSRP in dollars
- sort - Sort order (price-low, price-high, mpg, name)
- page - Page number (default: 1)
- page_size - Results per page (default: 12, max: 50)

Response includes items array with vehicle objects and pagination metadata.

#### GET /api/cars/random

Get a random car for landing page hero image. Returns image URL.

### Authenticated Endpoints

#### POST /api/tradein

Estimate trade-in value for a vehicle.

Request:
```json
{
  "vin": "1HGCV41JXMN109186",
  "imageUrl": "https://example.com/car.jpg"
}
```

Response includes estimated USD value and vehicle details (make, model, year, trim, condition score).

#### POST /api/bookings

Create a test drive booking.

Request includes contactName, contactEmail, contactPhone, preferredLocation, bookingDateTime, and vehicle details.

## Key Pages and Features

### Landing Page (/)

- Hero section with random Toyota vehicle image
- Feature highlights (chat, compare, scheduling)
- Social proof statistics
- Pricing information example
- Call-to-action buttons

### Quiz (/quiz)

5-step preference capture:

1. Budget Range - Slider selection ($15k - $80k)
2. Body Style - Radio selection (sedan, SUV, truck, hybrid, any)
3. Passenger Count - Radio selection (2, 5, 7+ seats)
4. Primary Use Case - Radio selection (commute, family, adventure, business)
5. Fuel Efficiency - Radio selection (critical, important, neutral) with optional personal info

### Chat (/chat)

Main interface with:

- Left Sidebar: Agent status, Retell phone number, workflow steps
- Chat Area: Message history, tool outputs, auto-scroll
- Input Controls: Text input, voice input, trade-in button, send button
- Voice Features: Speech recognition, silence detection, text-to-speech
- Tool Integrations: Car search, financing, scheduling, trade-in, email

### Browse (/browse)

Vehicle browsing with filters, grid display, and pagination.

### Compare (/compare)

Side-by-side comparison for multiple vehicles with specs and costs.

### Car Detail (/car/[id])

Individual vehicle page with gallery, full specs, performance data, features, financing selector.

### Test Drive (/test-drive)

Multi-step booking: vehicle selection, date/time, contact info, confirmation.

### Profile (/profile)

User account management with preferences, searches, scheduled drives.

### Authentication (/login, /signup)

Supabase Auth with OAuth support.

## Voice Integration

### Speech Recognition

Uses Web Speech API with fallback support. Real-time transcription, interim results, error handling.

### Silence Detection

Custom detector using Web Audio API. Auto-send after 2 seconds of silence with noise adaptation.

### Speech Synthesis

Text-to-speech using Web Speech API. Streaming synthesis, sentence chunking, natural rate/pitch.

### Retell Phone Integration

Call (405) 297-4640 to speak with voice agent using same multi-agent system.

## Styling and Design

### Toyota Design System

- Primary Color: Toyota Red (#EB0A1E)
- Typography: Inter (sans-serif), JetBrains Mono (code)
- Layout Utilities: toyota-container, toyota-surface, toyota-gradient, toyota-chip
- Responsive Design: Mobile-first with Tailwind breakpoints
- Accessibility: High contrast, focus indicators, keyboard nav, motion preferences

### Motion and Animation

- Framer Motion: Page transitions, scroll reveals
- CSS Animations: Button hovers, loading states
- Scroll-Triggered: Content appears on scroll
- Reduced Motion: Respects user preferences

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy on push

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Performance Optimization

- Image Optimization: Next.js Image with lazy loading
- Code Splitting: Automatic per-route bundles
- Memoization: React.memo for expensive components
- Database Indexing: Supabase indexes on common queries
- API Caching: Conditional requests with ETag

## Security Considerations

- Authentication: Supabase Auth with secure sessions
- Authorization: Row-level security on database
- Input Validation: Zod schemas for all inputs
- HTTPS: Always in production
- Secrets: Never commit to repository
- VIN Security: Stored securely
- PII Protection: Encrypted at rest

## Contributing

1. Branch from main
2. Create feature branch
3. Test thoroughly
4. Run linting (npm run lint)
5. Commit with clear messages
6. Create Pull Request

Focus on UI/UX improvements. Backend logic and APIs are finalized.

## Troubleshooting

### Missing Supabase environment variables

Check .env.local has all keys, verify they haven't expired, get fresh from dashboard.

### Chat agent not responding

Verify OPENROUTER_API_KEY is valid, check API quota/billing, review server logs.

### Voice input not working

Browser must support Web Speech API (Chrome, Edge, Safari), check microphone permissions, verify not in private mode.

### Trade-in estimation fails

Verify VIN is 17 characters, check NHTSA API accessibility, verify vehicle in catalog.

### Email not sending

Verify RESEND_API_KEY is correct, check email validity, review Resend dashboard.

## License

MIT - See LICENSE file for details

## Contact & Support

Built with Next.js, React, and NVIDIA Nemotron for HackUTD. Toyotatron transforms car shopping from a complex, time-consuming process into an intelligent, conversational experience.
