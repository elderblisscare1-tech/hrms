import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const { uid, newPassword } = await request.json();

    if (!uid || !newPassword) {
      return NextResponse.json({ error: 'Missing uid or newPassword' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    if (!process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
      console.error("Missing Firebase Admin credentials in environment variables.");
      return NextResponse.json({ 
        error: 'Backend is missing Firebase Admin Credentials. Please add FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL to .env.local as per the walkthrough.' 
      }, { status: 500 });
    }

    // Update the password in Firebase Auth directly
    await adminAuth.updateUser(uid, {
      password: newPassword,
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Error updating password:', error);
    return NextResponse.json({ error: error.message || 'Failed to update password' }, { status: 500 });
  }
}
