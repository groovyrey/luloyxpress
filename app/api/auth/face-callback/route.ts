import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const email = searchParams.get('email');
  const p = searchParams.get('p'); // The password we passed along

  if (status === 'success' && email && p) {
    // Redirect to a page that will auto-submit the login with bypass
    const url = new URL('/login/bypass', request.url);
    url.searchParams.set('email', email);
    url.searchParams.set('p', p);
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL('/login?error=Face verification failed', request.url));
}
