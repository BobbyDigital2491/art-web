import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for login page and static assets
  if (
    pathname === '/login' ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // Check Supabase session
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    // Redirect to /login for unauthenticated users
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.search = request.nextUrl.search; // Preserve query params
    return NextResponse.redirect(redirectUrl);
  }

  // Allow authenticated users to proceed
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};