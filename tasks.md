# Gambling Awareness MVP - Granular Development Plan

## Phase 1: Foundation Setup (Tasks 1-10)

### Task 1: Initialize Next.js Project
**Objective**: Create basic Next.js 14 project with TypeScript
**Start**: Empty folder
**End**: Working Next.js app with TypeScript, running on localhost:3000
**Test**: Visit localhost:3000 and see default Next.js page
```bash
npx create-next-app@latest gambling-awareness --typescript --tailwind --eslint --app
cd gambling-awareness && npm run dev
```

### Task 2: Setup Supabase Project
**Objective**: Create Supabase project and get connection credentials
**Start**: No database
**End**: Supabase project with database URL and anon key
**Test**: Can connect to Supabase dashboard and see empty database
- Create project at supabase.com
- Note down URL and anon key
- Access database via dashboard

### Task 3: Configure Environment Variables
**Objective**: Setup .env.local with Supabase credentials
**Start**: No environment configuration
**End**: Environment variables accessible in Next.js app
**Test**: Console.log environment variables in a component
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### Task 4: Install and Configure Supabase Client
**Objective**: Setup Supabase client for Next.js
**Start**: No Supabase integration
**End**: Supabase client configured and exportable
**Test**: Import supabase client in a component without errors
```bash
npm install @supabase/supabase-js
```

### Task 5: Create Basic Database Schema
**Objective**: Create profiles table in Supabase
**Start**: Empty database
**End**: Profiles table exists with proper structure
**Test**: Can see profiles table in Supabase dashboard
```sql
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id)
);
```

### Task 6: Setup FastAPI Project
**Objective**: Create basic FastAPI application
**Start**: No backend
**End**: FastAPI app running on localhost:8000
**Test**: Visit localhost:8000/docs and see Swagger UI
```bash
mkdir backend && cd backend
pip install fastapi uvicorn python-multipart
# Create main.py with basic FastAPI app
uvicorn main:app --reload
```

### Task 7: Configure FastAPI Environment
**Objective**: Setup environment variables for FastAPI
**Start**: No environment configuration
**End**: FastAPI can access Supabase credentials
**Test**: Print environment variables in FastAPI startup
```python
# .env file with SUPABASE_URL, SUPABASE_SERVICE_KEY
```

### Task 8: Setup FastAPI-Supabase Connection
**Objective**: Connect FastAPI to Supabase
**Start**: No database connection in FastAPI
**End**: FastAPI can query Supabase database
**Test**: Create /health endpoint that queries database
```bash
pip install supabase
```

### Task 9: Create Basic API Structure
**Objective**: Setup FastAPI project structure with routers
**Start**: Single main.py file
**End**: Organized FastAPI project with api/v1 structure
**Test**: /api/v1/health endpoint works
```
backend/
├── app/
│   ├── main.py
│   ├── api/
│   │   └── v1/
│   │       └── router.py
```

### Task 10: Setup CORS for Next.js
**Objective**: Configure CORS to allow Next.js frontend
**Start**: CORS blocking requests
**End**: Next.js can make requests to FastAPI
**Test**: Fetch /health from Next.js component
```bash
pip install fastapi-cors
```

## Phase 2: Authentication System (Tasks 11-20)

### Task 11: Setup Supabase Auth in Next.js
**Objective**: Configure Supabase authentication
**Start**: No auth system
**End**: Supabase auth configured with session handling
**Test**: Can call supabase.auth.getSession() without errors
```bash
npm install @supabase/auth-helpers-nextjs
```

### Task 12: Create Auth Context/Store
**Objective**: Create Zustand store for authentication state
**Start**: No global auth state
**End**: Auth store with user, session, loading states
**Test**: Can import and use auth store in components
```bash
npm install zustand
```

### Task 13: Build Login Form Component
**Objective**: Create login form with email/password
**Start**: No login UI
**End**: Login form component with validation
**Test**: Form renders and validates input fields
```typescript
// components/auth/login-form.tsx
```

### Task 14: Build Registration Form Component
**Objective**: Create registration form
**Start**: No registration UI
**End**: Registration form with email/password/name
**Test**: Form renders and validates all fields
```typescript
// components/auth/register-form.tsx
```

### Task 15: Create Login Page
**Objective**: Create /auth/login page with form
**Start**: No login page
**End**: Login page at /auth/login
**Test**: Navigate to /auth/login and see login form
```typescript
// app/auth/login/page.tsx
```

### Task 16: Create Registration Page
**Objective**: Create /auth/register page
**Start**: No registration page
**End**: Registration page at /auth/register
**Test**: Navigate to /auth/register and see registration form
```typescript
// app/auth/register/page.tsx
```

### Task 17: Implement Login Functionality
**Objective**: Connect login form to Supabase auth
**Start**: Login form doesn't authenticate
**End**: Users can login with email/password
**Test**: Login with test credentials redirects to dashboard
```typescript
// Handle signInWithPassword in auth store
```

### Task 18: Implement Registration Functionality
**Objective**: Connect registration to Supabase auth
**Start**: Registration form doesn't create users
**End**: Users can register with email/password
**Test**: Register new user and receive confirmation email
```typescript
// Handle signUp in auth store
```

### Task 19: Create Auth Guard Component
**Objective**: Protect routes requiring authentication
**Start**: No route protection
**End**: Auth guard redirects unauthenticated users
**Test**: Accessing protected route redirects to login
```typescript
// components/auth/auth-guard.tsx
```

### Task 20: Setup Auth Callback Route
**Objective**: Handle Supabase auth callbacks
**Start**: Auth confirmation fails
**End**: Email confirmations work properly
**Test**: Confirm email and get redirected correctly
```typescript
// app/auth/callback/route.ts
```

## Phase 3: Basic Dashboard (Tasks 21-30)

### Task 21: Create Dashboard Layout
**Objective**: Build protected dashboard layout
**Start**: No dashboard structure
**End**: Dashboard layout with sidebar and header
**Test**: Visit /dashboard and see layout structure
```typescript
// app/dashboard/layout.tsx
```

### Task 22: Build Dashboard Header Component
**Objective**: Create header with user info and logout
**Start**: No header component
**End**: Header showing user email and logout button
**Test**: Header displays user info and logout works
```typescript
// components/layout/header.tsx
```

### Task 23: Build Sidebar Navigation
**Objective**: Create sidebar with navigation links
**Start**: No navigation
**End**: Sidebar with links to different dashboard sections
**Test**: Sidebar links navigate to correct routes
```typescript
// components/layout/sidebar.tsx
```

### Task 24: Create Dashboard Home Page
**Objective**: Build main dashboard overview page
**Start**: No dashboard content
**End**: Dashboard home with basic statistics
**Test**: /dashboard shows overview with placeholder stats
```typescript
// app/dashboard/page.tsx
```

### Task 25: Create Profile Page Structure
**Objective**: Build user profile page layout
**Start**: No profile page
**End**: Profile page at /dashboard/profile
**Test**: Navigate to profile page and see user info
```typescript
// app/dashboard/profile/page.tsx
```

### Task 26: Build Profile Update Form
**Objective**: Allow users to update their profile
**Start**: Profile page is read-only
**End**: Users can update name and email
**Test**: Update profile and see changes saved
```typescript
// Update profile in auth store and Supabase
```

### Task 27: Create Simulations List Page
**Objective**: Build page to show user's simulations
**Start**: No simulations page
**End**: Simulations list page at /dashboard/simulations
**Test**: Page loads with empty state message
```typescript
// app/dashboard/simulations/page.tsx
```

### Task 28: Setup Database Tables for Simulations
**Objective**: Create simulations table in Supabase
**Start**: No simulations table
**End**: Simulations table with proper schema
**Test**: Can see simulations table in Supabase dashboard
```sql
CREATE TABLE public.simulations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Task 29: Create FastAPI Simulations Endpoint
**Objective**: Build API endpoint to fetch user simulations
**Start**: No simulations API
**End**: GET /api/v1/simulations endpoint works
**Test**: Call API endpoint and get empty array
```python
# app/api/v1/simulations.py
```

### Task 30: Connect Frontend to Simulations API
**Objective**: Fetch and display simulations from API
**Start**: Frontend shows hardcoded data
**End**: Frontend fetches real data from FastAPI
**Test**: Simulations page shows data from database
```typescript
// Use SWR or React Query to fetch data
```

## Phase 4: SportPesa Scraper (Tasks 31-40)

### Task 31: Create Jackpots Database Table
**Objective**: Create table to store jackpot data
**Start**: No jackpots table
**End**: Jackpots table with proper schema
**Test**: Can see jackpots table in Supabase dashboard
```sql
CREATE TABLE public.jackpots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    current_amount DECIMAL(15,2) NOT NULL,
    total_matches INTEGER NOT NULL,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Task 32: Install Scraping Dependencies
**Objective**: Setup scraping tools in FastAPI
**Start**: No scraping capabilities
**End**: BeautifulSoup and requests installed
**Test**: Import libraries without errors
```bash
pip install beautifulsoup4 requests lxml
```

### Task 33: Create Base Scraper Class
**Objective**: Build foundation for web scraping
**Start**: No scraper structure
**End**: Base scraper class with common methods
**Test**: Instantiate base scraper without errors
```python
# app/services/scraper/base.py
```

### Task 34: Build SportPesa Scraper Class
**Objective**: Create SportPesa-specific scraper
**Start**: No SportPesa scraper
**End**: Scraper that can fetch SportPesa homepage
**Test**: Scraper returns HTML content from SportPesa
```python
# app/services/scraper/sportpesa.py
```

### Task 35: Parse Jackpot Information
**Objective**: Extract jackpot data from SportPesa HTML
**Start**: Scraper only fetches HTML
**End**: Scraper parses and returns jackpot amounts
**Test**: Scraper returns jackpot name and current amount
```python
# Parse HTML to extract jackpot data
```

### Task 36: Parse Individual Games
**Objective**: Extract individual game information
**Start**: Only jackpot totals are parsed
**End**: Scraper returns all games with teams and odds
**Test**: Scraper returns array of game objects
```python
# Parse game details from jackpot pages
```

### Task 37: Create Scraping API Endpoint
**Objective**: Build endpoint to trigger scraping
**Start**: No scraping API
**End**: POST /api/v1/scrape endpoint works
**Test**: Call endpoint and get scraped data response
```python
# app/api/v1/scraper.py
```

### Task 38: Store Scraped Data in Database
**Objective**: Save scraped jackpot data to Supabase
**Start**: Scraped data is only returned
**End**: Scraped data is stored in jackpots table
**Test**: Run scraper and see data in Supabase dashboard
```python
# Save jackpot and games data to database
```

### Task 39: Create Games Database Table
**Objective**: Store individual games separately
**Start**: Games data mixed with jackpots
**End**: Separate games table with foreign key
**Test**: Games table populated when scraping runs
```sql
CREATE TABLE public.games (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    jackpot_id UUID REFERENCES public.jackpots(id),
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    odds JSONB
);
```

### Task 40: Build Jackpots Display Page
**Objective**: Show current jackpots in frontend
**Start**: No jackpots display
**End**: Page showing live jackpot data
**Test**: /dashboard/jackpots shows current SportPesa data
```typescript
// app/dashboard/jackpots/page.tsx
```

## Phase 5: Simulation Engine (Tasks 41-50)

### Task 41: Create Simulation Creation Form
**Objective**: Build form to create new simulation
**Start**: No way to create simulations
**End**: Form to input simulation parameters
**Test**: Form validates and shows all required fields
```typescript
// components/simulation/simulation-form.tsx
```

### Task 42: Add Simulation Fields to Database
**Objective**: Extend simulations table with required fields
**Start**: Basic simulations table
**End**: Table includes combinations, cost, status fields
**Test**: Can insert simulation with all required fields
```sql
ALTER TABLE simulations ADD COLUMN total_combinations INTEGER;
ALTER TABLE simulations ADD COLUMN cost_per_bet DECIMAL(10,2);
ALTER TABLE simulations ADD COLUMN total_cost DECIMAL(15,2);
```

### Task 43: Create Simulation API Endpoint
**Objective**: Build API to create new simulations
**Start**: No simulation creation API
**End**: POST /api/v1/simulations endpoint works
**Test**: Create simulation via API and see it in database
```python
# Handle simulation creation in FastAPI
```

### Task 44: Connect Form to API
**Objective**: Submit simulation form to backend
**Start**: Form doesn't submit
**End**: Form creates simulation and redirects
**Test**: Fill form, submit, see new simulation in list
```typescript
// Handle form submission in frontend
```

### Task 45: Create Bet Combinations Table
**Objective**: Store individual bet combinations
**Start**: No place to store combinations
**End**: Bet combinations table with proper schema
**Test**: Table exists and can store combination data
```sql
CREATE TABLE public.bet_combinations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    simulation_id UUID REFERENCES public.simulations(id),
    combination_number INTEGER NOT NULL,
    predictions JSONB NOT NULL
);
```

### Task 46: Build Combination Generator Class
**Objective**: Generate bet combinations algorithmically
**Start**: No combination generation
**End**: Class that generates N combinations for jackpot
**Test**: Generator creates specified number of combinations
```python
# app/services/simulation/generator.py
```

### Task 47: Create Background Task System
**Objective**: Setup async task processing
**Start**: No background processing
**End**: FastAPI background tasks configured
**Test**: Can queue and execute background tasks
```python
# Use FastAPI BackgroundTasks or Celery
```

### Task 48: Implement Combination Generation Task
**Objective**: Generate combinations in background
**Start**: Combinations generated synchronously
**End**: Combinations generated via background task
**Test**: Create simulation, combinations generated async
```python
# Background task to generate combinations
```

### Task 49: Add Progress Tracking
**Objective**: Track simulation progress
**Start**: No progress visibility
**End**: Progress field updated during generation
**Test**: Progress updates from 0 to 100 during generation
```python
# Update simulation progress in database
```

### Task 50: Build Progress Display
**Objective**: Show simulation progress in frontend
**Start**: No progress visibility
**End**: Progress bar showing generation status
**Test**: Progress bar updates as combinations generate
```typescript
// Real-time progress updates via polling/websocket
```

## Phase 6: Results Analysis (Tasks 51-60)

### Task 51: Create Results Analysis Class
**Objective**: Analyze bet combinations against actual results
**Start**: No results analysis
**End**: Class that can check combinations against outcomes
**Test**: Analyzer correctly identifies winning combinations
```python
# app/services/simulation/analyzer.py
```

### Task 52: Add Actual Results to Games Table
**Objective**: Store actual game results
**Start**: Games table only has predictions
**End**: Games table includes actual results
**Test**: Can update games with actual outcomes (1,X,2)
```sql
ALTER TABLE games ADD COLUMN actual_result TEXT;
```

### Task 53: Build Results Input Interface
**Objective**: Admin interface to input actual results
**Start**: No way to input results
**End**: Form to input game results
**Test**: Can input results for all games in jackpot
```typescript
// Admin interface to update game results
```

### Task 54: Create Simulation Results Table
**Objective**: Store analysis results
**Start**: No place to store results
**End**: Table storing win/loss analysis
**Test**: Results table populated after analysis
```sql
CREATE TABLE public.simulation_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    simulation_id UUID REFERENCES public.simulations(id),
    total_winning_combinations INTEGER,
    total_payout DECIMAL(15,2),
    net_loss DECIMAL(15,2)
);
```

### Task 55: Implement Results Analysis Task
**Objective**: Run analysis as background task
**Start**: No results analysis
**End**: Background task analyzes all combinations
**Test**: Analysis task completes and stores results
```python
# Background task to analyze simulation results
```

### Task 56: Build Results Display Page
**Objective**: Show simulation results to user
**Start**: No results display
**End**: Page showing win/loss analysis
**Test**: Results page shows analysis with charts
```typescript
// app/dashboard/simulations/[id]/results/page.tsx
```

### Task 57: Add Results Charts
**Objective**: Visualize results with charts
**Start**: Results shown as text only
**End**: Charts showing win distribution and costs
**Test**: Charts render with correct data
```bash
npm install recharts
```

### Task 58: Calculate Investment Alternatives
**Objective**: Show what money could earn in investments
**Start**: Only gambling results shown
**End**: Comparison with savings/investment returns
**Test**: Investment calculator shows alternative returns
```typescript
// Investment comparison component
```

### Task 59: Build Results Summary Email
**Objective**: Email results to user
**Start**: No email notifications
**End**: Email template with results summary
**Test**: Email sent with complete results analysis
```python
# Email service with results template
```

### Task 60: Implement Email Notifications
**Objective**: Send email when simulation completes
**Start**: No notifications
**End**: Users receive email with results
**Test**: Complete simulation and receive email
```python
# Email notification background task
```

## Phase 7: Polish & MVP Completion (Tasks 61-70)

### Task 61: Add Loading States
**Objective**: Show loading indicators throughout app
**Start**: No loading feedback
**End**: Loading states for all async operations
**Test**: Loading indicators appear during data fetching
```typescript
// Loading components for all async operations
```

### Task 62: Add Error Handling
**Objective**: Handle and display errors gracefully
**Start**: Errors crash or show cryptic messages
**End**: User-friendly error messages throughout
**Test**: API errors show helpful messages to users
```typescript
// Error boundary and error handling
```

### Task 63: Implement Toast Notifications
**Objective**: Show success/error notifications
**Start**: No user feedback for actions
**End**: Toast notifications for user actions
**Test**: Actions show appropriate toast messages
```bash
npm install react-hot-toast
```

### Task 64: Add Form Validation
**Objective**: Validate all forms client-side
**Start**: No client-side validation
**End**: All forms validate before submission
**Test**: Forms show validation errors for invalid input
```bash
npm install react-hook-form @hookform/resolvers zod
```

### Task 65: Style the Application
**Objective**: Apply consistent styling throughout
**Start**: Unstyled or basic styling
**End**: Professional, consistent design
**Test**: All pages follow design system
```typescript
// Tailwind CSS styling for all components
```

### Task 66: Add Responsive Design
**Objective**: Make app work on mobile devices
**Start**: Desktop-only design
**End**: Responsive design for all screen sizes
**Test**: App works well on mobile and tablet
```css
/* Responsive Tailwind classes */
```

### Task 67: Setup Automated Scraping
**Objective**: Schedule regular data scraping
**Start**: Manual scraping only
**End**: Automated hourly scraping
**Test**: Jackpot data updates automatically
```python
# Scheduled tasks for regular scraping
```

### Task 68: Add Data Validation
**Objective**: Validate all data inputs
**Start**: No data validation
**End**: All inputs validated with Pydantic
**Test**: Invalid data rejected with clear messages
```python
# Pydantic models for data validation
```

### Task 69: Implement Rate Limiting
**Objective**: Prevent API abuse
**Start**: No rate limiting
**End**: Rate limits on all API endpoints
**Test**: Too many requests return 429 status
```python
# Rate limiting middleware
```

### Task 70: Add Security Headers
**Objective**: Secure the application
**Start**: Basic security
**End**: Security headers and HTTPS enforcement
**Test**: Security headers present in responses
```python
# Security middleware and headers
```

## Testing Strategy

After each task, perform these tests:

### Functional Tests
- **Unit Tests**: Test individual functions/components
- **Integration Tests**: Test component interactions
- **API Tests**: Test all endpoints with various inputs
- **End-to-End Tests**: Test complete user workflows

### Manual Testing Checklist
- [ ] Feature works as expected
- [ ] Error handling works correctly
- [ ] UI is responsive and accessible
- [ ] Data persists correctly
- [ ] Security measures are in place

### Performance Tests
- [ ] Page load times under 3 seconds
- [ ] API responses under 500ms
- [ ] Database queries optimized
- [ ] Memory usage reasonable

## Deployment Checklist

### Environment Setup
- [ ] Production database configured
- [ ] Environment variables set
- [ ] Secrets properly managed
- [ ] Monitoring configured

### Security Checklist
- [ ] HTTPS enabled
- [ ] Rate limiting active
- [ ] Input validation everywhere
- [ ] Authentication secure
- [ ] Database access restricted

### Performance Checklist
- [ ] Images optimized
- [ ] Code minified
- [ ] Caching configured
- [ ] CDN setup
- [ ] Database indexed

This plan breaks down the MVP into 70 discrete, testable tasks. Each task has a clear objective, starting point, ending point, and test criteria. An engineering LLM can work through these tasks one by one, with testing after each task to ensure quality and catch issues early.