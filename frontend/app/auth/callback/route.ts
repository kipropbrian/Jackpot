import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    const supabase = createServerSupabaseClient();
    
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code);
    
    // Redirect to the dashboard after successful authentication
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If no code provided, redirect to login
  return NextResponse.redirect(new URL('/auth/login', request.url));
}
