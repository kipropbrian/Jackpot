# Gambling Awareness Web App - Full Architecture

## Technology Stack
- **Frontend**: Next.js 14 (App Router) with TypeScript
- **Backend**: FastAPI (Python)
- **Database & Auth**: Supabase
- **Deployment**: Vercel (Frontend) + Railway/DigitalOcean (Backend)

## High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │────│   FastAPI API    │────│   Supabase DB   │
│   (Frontend)    │    │   (Backend)      │    │   (Database)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────│   Supabase      │──────────────┘
                        │   Auth          │
                        └─────────────────┘
```

## 1. Frontend Structure (Next.js)

```
frontend/
├── app/
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Landing page
│   ├── globals.css                # Global styles
│   ├── loading.tsx                # Global loading UI
│   ├── error.tsx                  # Global error UI
│   │
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx           # Login page
│   │   ├── register/
│   │   │   └── page.tsx           # Registration page
│   │   └── callback/
│   │       └── route.ts           # Auth callback handler
│   │
│   ├── dashboard/
│   │   ├── layout.tsx             # Dashboard layout (protected)
│   │   ├── page.tsx               # Dashboard overview
│   │   ├── simulations/
│   │   │   ├── page.tsx           # Active simulations list
│   │   │   ├── new/
│   │   │   │   └── page.tsx       # Create new simulation
│   │   │   └── [id]/
│   │   │       ├── page.tsx       # Simulation details
│   │   │       └── results/
│   │   │           └── page.tsx   # Simulation results
│   │   ├── profile/
│   │   │   └── page.tsx           # User profile settings
│   │   └── investments/
│   │       └── page.tsx           # Investment calculator
│   │
│   ├── education/
│   │   ├── page.tsx               # Educational resources hub
│   │   ├── odds/
│   │   │   └── page.tsx           # Understanding odds
│   │   ├── stories/
│   │   │   └── page.tsx           # Success stories
│   │   └── resources/
│   │       └── page.tsx           # Help resources
│   │
│   └── api/
│       ├── auth/
│       │   └── callback/
│       │       └── route.ts       # Supabase auth callback
│       └── webhooks/
│           └── supabase/
│               └── route.ts       # Database webhooks
│
├── components/
│   ├── ui/                        # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   ├── toast.tsx
│   │   └── loading-spinner.tsx
│   │
│   ├── auth/
│   │   ├── login-form.tsx         # Login form component
│   │   ├── register-form.tsx      # Registration form
│   │   └── auth-guard.tsx         # Route protection HOC
│   │
│   ├── simulation/
│   │   ├── simulation-form.tsx    # Create simulation form
│   │   ├── simulation-card.tsx    # Simulation summary card
│   │   ├── results-chart.tsx      # Results visualization
│   │   ├── odds-calculator.tsx    # Live odds calculator
│   │   └── progress-tracker.tsx   # Simulation progress
│   │
│   ├── dashboard/
│   │   ├── stats-overview.tsx     # Dashboard statistics
│   │   ├── recent-simulations.tsx # Recent activity
│   │   └── nav-sidebar.tsx        # Dashboard navigation
│   │
│   ├── education/
│   │   ├── probability-demo.tsx   # Interactive probability demo
│   │   ├── investment-calc.tsx    # Investment calculator
│   │   └── story-card.tsx         # Success story component
│   │
│   └── layout/
│       ├── header.tsx             # Site header
│       ├── footer.tsx             # Site footer
│       └── mobile-nav.tsx         # Mobile navigation
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Supabase client (browser)
│   │   ├── server.ts              # Supabase client (server)
│   │   └── auth-helpers.ts        # Auth utility functions
│   │
│   ├── api/
│   │   ├── client.ts              # FastAPI client
│   │   ├── endpoints.ts           # API endpoint definitions
│   │   └── types.ts               # API type definitions
│   │
│   ├── hooks/
│   │   ├── use-auth.ts            # Authentication hook
│   │   ├── use-simulations.ts     # Simulations data hook
│   │   ├── use-toast.ts           # Toast notifications hook
│   │   └── use-local-storage.ts   # Local storage hook
│   │
│   ├── stores/
│   │   ├── auth-store.ts          # Zustand auth store
│   │   ├── simulation-store.ts    # Simulation state store
│   │   └── ui-store.ts            # UI state (modals, loading)
│   │
│   └── utils/
│       ├── calculations.ts        # Probability calculations
│       ├── formatting.ts          # Number/date formatting
│       ├── validations.ts         # Form validations
│       └── constants.ts           # App constants
│
├── types/
│   ├── auth.ts                    # Authentication types
│   ├── simulation.ts              # Simulation types
│   ├── database.ts                # Database schema types
│   └── api.ts                     # API response types
│
├── styles/
│   ├── globals.css                # Global CSS
│   └── components.css             # Component-specific styles
│
├── public/
│   ├── images/
│   ├── icons/
│   └── favicon.ico
│
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── .env.local
```

## 2. Backend Structure (FastAPI)

```
backend/
├── app/
│   ├── main.py                    # FastAPI app entry point
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py            # Environment configuration
│   │   └── database.py            # Supabase connection
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── auth.py                # Authentication middleware
│   │   ├── security.py            # Security utilities
│   │   └── exceptions.py          # Custom exceptions
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py                # User data models
│   │   ├── simulation.py          # Simulation models
│   │   ├── jackpot.py             # Jackpot data models
│   │   └── bet.py                 # Bet combination models
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py                # User Pydantic schemas
│   │   ├── simulation.py          # Simulation schemas
│   │   ├── jackpot.py             # Jackpot schemas
│   │   └── responses.py           # API response schemas
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py                # Dependencies (auth, db)
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py          # Main API router
│   │       ├── auth.py            # Auth endpoints
│   │       ├── simulations.py     # Simulation endpoints
│   │       ├── jackpots.py        # Jackpot data endpoints
│   │       ├── users.py           # User management endpoints
│   │       └── analytics.py       # Analytics endpoints
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── scraper/
│   │   │   ├── __init__.py
│   │   │   ├── sportpesa.py       # SportPesa scraper
│   │   │   ├── base.py            # Base scraper class
│   │   │   └── utils.py           # Scraping utilities
│   │   │
│   │   ├── simulation/
│   │   │   ├── __init__.py
│   │   │   ├── engine.py          # Simulation processing
│   │   │   ├── generator.py       # Bet combination generator
│   │   │   └── analyzer.py        # Results analysis
│   │   │
│   │   ├── notification/
│   │   │   ├── __init__.py
│   │   │   ├── email.py           # Email service
│   │   │   └── templates.py       # Email templates
│   │   │
│   │   └── auth/
│   │       ├── __init__.py
│   │       └── supabase.py        # Supabase auth integration
│   │
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── scraper.py             # Background scraping tasks
│   │   ├── simulation.py          # Simulation processing tasks
│   │   └── notifications.py       # Email notification tasks
│   │
│   └── utils/
│       ├── __init__.py
│       ├── probability.py         # Probability calculations
│       ├── validation.py          # Data validation
│       └── helpers.py             # General utilities
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py                # Test configuration
│   ├── test_auth.py
│   ├── test_simulations.py
│   ├── test_scraper.py
│   └── test_probability.py
│
├── alembic/                       # Database migrations (if needed)
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env
```

## 3. Database Schema (Supabase)

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- Jackpot data from SportPesa
CREATE TABLE public.jackpots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL, -- "Mega Jackpot", "Jackpot"
    current_amount DECIMAL(15,2) NOT NULL,
    total_matches INTEGER NOT NULL, -- Total games to predict
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    games JSONB NOT NULL -- Array of game objects
);

-- Individual games within jackpots
CREATE TABLE public.games (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    jackpot_id UUID REFERENCES public.jackpots(id) ON DELETE CASCADE,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    league TEXT,
    match_date TIMESTAMP WITH TIME ZONE,
    odds JSONB, -- {home: 2.1, draw: 3.2, away: 4.5}
    game_number INTEGER NOT NULL -- Position in jackpot (1-17 for mega)
);

-- User simulations
CREATE TABLE public.simulations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    jackpot_id UUID REFERENCES public.jackpots(id),
    name TEXT NOT NULL,
    total_combinations INTEGER NOT NULL,
    cost_per_bet DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(15,2) NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, running, completed, failed
    progress INTEGER DEFAULT 0, -- 0-100
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    results JSONB -- Final results summary
);

-- Generated bet combinations
CREATE TABLE public.bet_combinations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    simulation_id UUID REFERENCES public.simulations(id) ON DELETE CASCADE,
    combination_number INTEGER NOT NULL,
    predictions JSONB NOT NULL, -- Array of predictions [1,X,2,1,X,...]
    is_winner BOOLEAN DEFAULT false,
    matches_count INTEGER DEFAULT 0, -- How many games matched
    payout DECIMAL(15,2) DEFAULT 0,
    batch_number INTEGER -- For processing in batches
);

-- Simulation results summary
CREATE TABLE public.simulation_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    simulation_id UUID REFERENCES public.simulations(id) ON DELETE CASCADE,
    total_winning_combinations INTEGER DEFAULT 0,
    total_payout DECIMAL(15,2) DEFAULT 0,
    net_loss DECIMAL(15,2),
    best_match_count INTEGER DEFAULT 0,
    winning_percentage DECIMAL(5,4) DEFAULT 0,
    analysis JSONB, -- Detailed breakdown
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email notifications log
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    simulation_id UUID REFERENCES public.simulations(id),
    type TEXT NOT NULL, -- 'simulation_complete', 'weekly_summary'
    status TEXT DEFAULT 'pending', -- pending, sent, failed
    sent_at TIMESTAMP WITH TIME ZONE,
    email_content JSONB,
    error_message TEXT
);
```

## 4. State Management & Data Flow

### Frontend State (Zustand Stores)

```typescript
// auth-store.ts
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: ProfileUpdate) => Promise<void>;
}

// simulation-store.ts  
interface SimulationState {
  simulations: Simulation[];
  currentSimulation: Simulation | null;
  loading: boolean;
  createSimulation: (data: CreateSimulationData) => Promise<void>;
  fetchSimulations: () => Promise<void>;
  subscribeToProgress: (id: string) => void;
}

// ui-store.ts
interface UIState {
  modals: {
    createSimulation: boolean;
    results: boolean;
  };
  toasts: Toast[];
  sidebarOpen: boolean;
  openModal: (modal: string) => void;
  closeModal: (modal: string) => void;
  addToast: (toast: Toast) => void;
}
```

### API Communication Flow

1. **Authentication Flow**
   ```
   Next.js ←→ Supabase Auth ←→ FastAPI (JWT verification)
   ```

2. **Simulation Creation Flow**
   ```
   Next.js → FastAPI → Supabase (create simulation)
                    → Background Task (generate combinations)
                    → WebSocket/Polling (progress updates)
                    → Email Service (completion notification)
   ```

3. **Data Scraping Flow**
   ```
   Cron Job → FastAPI Scraper → SportPesa.com
                              → Supabase (store jackpot data)
                              → WebSocket (notify active users)
   ```

## 5. Service Connections & Communication

### FastAPI ↔ Supabase
```python
# Using Supabase Python client
from supabase import create_client, Client

supabase: Client = create_client(
    supabase_url=settings.SUPABASE_URL,
    supabase_key=settings.SUPABASE_SERVICE_KEY
)

# Database operations
async def create_simulation(simulation_data: SimulationCreate):
    result = supabase.table('simulations').insert(simulation_data.dict()).execute()
    return result.data[0]
```

### Next.js ↔ FastAPI
```typescript
// API client with authentication
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
apiClient.interceptors.request.use(async (config) => {
  const session = await supabase.auth.getSession();
  if (session.data.session?.access_token) {
    config.headers.Authorization = `Bearer ${session.data.session.access_token}`;
  }
  return config;
});
```

### Next.js ↔ Supabase
```typescript
// Real-time subscriptions
useEffect(() => {
  const subscription = supabase
    .channel('simulations')
    .on('postgres_changes', 
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'simulations',
        filter: `user_id=eq.${user.id}`
      }, 
      (payload) => {
        updateSimulationProgress(payload.new);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [user.id]);
```

## 6. Background Jobs & Tasks

### Celery Tasks (Alternative: FastAPI Background Tasks)
```python
# Scraping task (runs every hour)
@celery.task
def scrape_jackpot_data():
    scraper = SportPesaScraper()
    data = scraper.get_current_jackpots()
    store_jackpot_data(data)

# Simulation processing task
@celery.task
def process_simulation(simulation_id: str):
    simulation = get_simulation(simulation_id)
    generator = BetCombinationGenerator(simulation)
    
    for batch in generator.generate_batches():
        process_batch(batch)
        update_progress(simulation_id, generator.progress)
    
    analyze_results(simulation_id)
    send_completion_email(simulation_id)
```

## 7. Deployment Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│     Vercel      │    │   Railway/DO     │    │    Supabase     │
│   (Next.js)     │────│   (FastAPI)      │────│   (Database)    │
│                 │    │                  │    │                 │
│ - Static pages  │    │ - API endpoints  │    │ - PostgreSQL    │
│ - Server routes │    │ - Background     │    │ - Auth          │
│ - Edge functions│    │   tasks          │    │ - Real-time     │
└─────────────────┘    │ - Web scraping   │    │ - Storage       │
                       └──────────────────┘    └─────────────────┘
```

## 8. Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Backend (.env)
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
DATABASE_URL=your_supabase_db_url
SECRET_KEY=your_secret_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASSWORD=your_password
REDIS_URL=redis://localhost:6379
ENVIRONMENT=development
```

## 9. Key Features Implementation

### Real-time Updates
- **Frontend**: Supabase real-time subscriptions for simulation progress
- **Backend**: WebSocket connections for live updates during processing
- **Database**: PostgreSQL triggers for automatic notifications

### Scalable Simulation Processing
- **Batch Processing**: Split million combinations into manageable chunks
- **Queue System**: Redis/Celery for background job management
- **Progress Tracking**: Real-time progress updates via WebSocket/polling

### Email Notifications
- **Templates**: HTML email templates with simulation results
- **Scheduling**: Automated emails on simulation completion
- **Preferences**: User-configurable notification settings

This architecture provides a solid foundation for building your gambling awareness application with clear separation of concerns, scalability, and maintainability in mind.