import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const userId = searchParams.get('id');

  if (status === 'success' && userId) {
    try {
      await pool.query("UPDATE users SET face_enabled = TRUE WHERE id = ?", [userId]);
      return NextResponse.redirect(new URL(`/profile/${userId}?message=Face 2FA enabled successfully`, request.url));
    } catch (error) {
      console.error("Error enabling face 2FA:", error);
    }
  }

  return NextResponse.redirect(new URL(`/profile/${userId || ''}?error=Face registration failed`, request.url));
}
