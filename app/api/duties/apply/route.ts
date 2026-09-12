import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized", error: "Missing token" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (err) {
      return NextResponse.json({ message: "Unauthorized", error: "Invalid token" }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const body = await req.json();
    const { dutyId, applicantName, applicantPhone, aadharFront, aadharBack } = body;

    if (!dutyId || !applicantName || !applicantPhone) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Check if user has already applied
    const applicationsRef = adminDb.collection("duty_applications");
    const existingSnapshot = await applicationsRef
      .where("dutyId", "==", dutyId)
      .where("userId", "==", userId)
      .get();

    if (!existingSnapshot.empty) {
      return NextResponse.json({ message: "You have already applied for this duty." }, { status: 409 });
    }

    // Save application
    const applicationData = {
      dutyId,
      userId,
      applicantName,
      applicantPhone,
      aadharFront: aadharFront || null,
      aadharBack: aadharBack || null,
      status: "pending",
      appliedAt: FieldValue.serverTimestamp(),
    };

    await applicationsRef.add(applicationData);

    return NextResponse.json({ message: "Application submitted successfully" }, { status: 201 });
  } catch (error: any) {
    console.error("Error in /api/duties/apply:", error);
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 });
  }
}
