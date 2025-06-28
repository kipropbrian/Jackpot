# Jackpot - Sports Betting Simulation Platform

A full-stack application for simulating sports betting combinations and analyzing results.

## Features

- User authentication and authorization
- Sports betting simulation with combination generation
- Real-time progress tracking
- Results analysis when games are complete
- **Email notifications for simulation completion** ✨ NEW
- Admin interface for managing jackpots and users
- Responsive web interface

## Email Notifications

The platform now sends email notifications when simulation analysis is complete:

### Features:

- **Beautiful HTML emails** with detailed analysis results
- **User preferences** - users can opt in/out of email notifications
- **Comprehensive results** including win rate, payout details, and actual game results
- **Direct link** to view full results in the app

### Setup:

1. Get a free Resend API key at [resend.com](https://resend.com)
2. Add to your `.env` file:
   ```
   RESEND_API_KEY=your_api_key_here
   EMAIL_FROM=notifications@resend.dev
   FRONTEND_URL=http://localhost:3000
   ```
3. Run the database migration to add email preferences:
   ```sql
   -- This adds email preference columns to profiles table
   ALTER TABLE profiles
   ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true,
   ADD COLUMN IF NOT EXISTS email_simulation_completion BOOLEAN DEFAULT true;
   ```

### User Controls:

- Users can manage email preferences in their profile page
- Global email notification toggle
- Specific toggle for simulation completion emails
- Users are opted-in by default but can disable anytime

## Tech Stack

### Backend

- FastAPI (Python web framework)
- Supabase (Database & Authentication)
- Resend (Email service)
- Background task processing

### Frontend

- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS
- React Query for state management

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 18+
- Supabase account
- Resend account (for email notifications)

### Installation

1. Clone the repository
2. Set up backend dependencies:

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Set up frontend dependencies:

   ```bash
   cd frontend
   npm install
   ```

4. Configure environment variables:

   - Copy `.env.example` to `.env`
   - Add your Supabase credentials
   - Add your Resend API key
   - Set other required variables

5. Run database migrations:

   - Apply the migrations in the `supabase/migrations/` directory
   - Ensure the latest email preferences migration is applied

6. Start the development servers:

   ```bash
   # Backend
   cd backend && python run.py

   # Frontend
   cd frontend && npm run dev
   ```

## Database Schema

The application uses Supabase with the following key tables:

- `profiles` - User profiles and preferences (including email settings)
- `jackpots` - Sports betting jackpots
- `games` - Individual games within jackpots
- `simulations` - User simulation configurations
- `bet_combinations` - Generated betting combinations
- `simulation_results` - Analysis results
- `notifications` - In-app notifications

## Email Template Design

The email notifications feature beautiful, mobile-responsive HTML emails that include:

- Gradient header with app branding
- Success/failure status indicators
- Detailed results table with win rates and payouts
- Visual representation of actual game results
- Call-to-action button to view full results
- Footer with preference management link

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Technology Stack

- **Frontend**: Next.js 14 (App Router) with TypeScript
- **Backend**: FastAPI (Python)
- **Database & Auth**: Supabase
- **Deployment**: Vercel (Frontend) + Railway/DigitalOcean (Backend)

## Project Structure

The project is organized into two main directories:

- `frontend/`: Next.js application
- `backend/`: FastAPI application (to be implemented)

## Getting Started

### Frontend Development

1. Navigate to the frontend directory:

   ```
   cd frontend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the development server:

   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Environment Variables

The application requires the following environment variables:

### Frontend (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Development Roadmap

This project is being developed in phases as outlined in the tasks.md file:

1. Foundation Setup
2. Authentication System
3. Basic Dashboard
4. SportPesa Scraper
5. Simulation Engine
6. Results Analysis
7. Education Content
8. UI Polish & Optimization

## Backend Development
