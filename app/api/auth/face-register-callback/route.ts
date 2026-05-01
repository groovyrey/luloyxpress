import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const userId = searchParams.get('id');
  
  const session = await auth();

  if (status === 'success' && userId) {
    try {
      await pool.query("UPDATE users SET face_enabled = TRUE WHERE id = ?", [userId]);
      
      // If user is already logged in, go to profile, otherwise go to login
      if (session?.user?.id === userId) {
        return NextResponse.redirect(new URL(`/profile/${userId}?message=Face 2FA enabled successfully`, request.url));
      } else {
        return NextResponse.redirect(new URL(`/login?message=Face 2FA enabled! Please sign in.`, request.url));
      }
    } catch (error) {
      console.error("Error enabling face 2FA:", error);
    }
  }

  return NextResponse.redirect(new URL(`/profile/${userId || ''}?error=Face registration failed`, request.url));
}
