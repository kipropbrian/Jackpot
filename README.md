# Gambling Awareness Web App

A web application designed to help users understand the real odds of winning jackpots through simulation.

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
