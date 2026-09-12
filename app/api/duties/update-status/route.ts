import { NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { applicationId, status } = body;

    if (!applicationId || !status) {
      return NextResponse.json({ message: "Missing applicationId or status" }, { status: 400 });
    }

    if (status !== "approved" && status !== "rejected") {
      return NextResponse.json({ message: "Invalid status. Must be 'approved' or 'rejected'." }, { status: 400 });
    }

    const applicationRef = adminDb.collection("duty_applications").doc(applicationId);
    const applicationDoc = await applicationRef.get();

    if (!applicationDoc.exists) {
      return NextResponse.json({ message: "Application not found" }, { status: 404 });
    }

    const applicationData = applicationDoc.data();
    
    // Update the status
    await applicationRef.update({
      status: status,
      updatedAt: new Date().toISOString()
    });

    // Attempt to send push notification
    if (applicationData?.userId) {
      const userDoc = await adminDb.collection("users_ebcdutys").doc(applicationData.userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData?.fcmToken) {
          const dutyDoc = applicationData.dutyId 
            ? await adminDb.collection("duties").doc(applicationData.dutyId).get() 
            : null;
            
          const dutyTitle = dutyDoc?.exists ? dutyDoc.data()?.title : "a duty";

          const title = status === "approved" ? "Duty Approved!" : "Duty Update";
          const bodyMessage = status === "approved" 
            ? `Your application for ${dutyTitle} has been approved.` 
            : `Your application for ${dutyTitle} has been reviewed and rejected.`;

          try {
            await adminMessaging.send({
              token: userData.fcmToken,
              notification: {
                title: title,
                body: bodyMessage,
              },
              data: {
                click_action: "FLUTTER_NOTIFICATION_CLICK",
                applicationId: applicationId,
                status: status,
              }
            });
            console.log(`Successfully sent FCM to ${userData.fcmToken}`);
          } catch (fcmError) {
            console.error("Error sending FCM notification:", fcmError);
            // We don't fail the API request just because FCM failed, as the status was already updated.
          }
        }
      }
    }

    return NextResponse.json({ message: `Application ${status} successfully.` }, { status: 200 });
  } catch (error: any) {
    console.error("Error in /api/duties/update-status:", error);
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 });
  }
}
