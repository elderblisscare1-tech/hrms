import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { directResetPasswordSchema } from "@/lib/schemas/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = directResetPasswordSchema.parse(body);

    // Fetch the user by email using Firebase Admin SDK
    try {
      const userRecord = await adminAuth.getUserByEmail(data.email);
      
      // Update the user's password directly
      await adminAuth.updateUser(userRecord.uid, {
        password: data.password,
      });

      return NextResponse.json(
        { message: "Password updated successfully" },
        { status: 200 }
      );
    } catch (firebaseError: any) {
      if (firebaseError.code === "auth/user-not-found") {
        return NextResponse.json(
          { error: "No user found with this email address." },
          { status: 404 }
        );
      }
      throw firebaseError;
    }
  } catch (error: any) {
    console.error("Direct password reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset password. Please check your inputs or try again later." },
      { status: 500 }
    );
  }
}
