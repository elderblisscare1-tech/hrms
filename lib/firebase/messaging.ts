import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { app } from "./client";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";

export const requestForToken = async () => {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.log("Firebase Messaging is not supported in this browser.");
      return null;
    }

    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();
    
    if (permission === "granted") {
      let registration: ServiceWorkerRegistration | undefined;
      
      if ('serviceWorker' in navigator) {
        try {
          registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        } catch (swError) {
          console.error("Service Worker registration failed:", swError);
        }
      }

      const currentToken = await getToken(messaging, { 
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });
      
      if (currentToken) {
        return currentToken;
      } else {
        console.log("No registration token available. Request permission to generate one.");
        return null;
      }
    } else {
      console.log("Notification permission denied");
      return null;
    }
  } catch (err) {
    console.error("An error occurred while retrieving token. ", err);
    return null;
  }
};

export const onMessageListener = async () => {
  const supported = await isSupported();
  if (!supported) return new Promise((resolve) => resolve(null));

  const messaging = getMessaging(app);
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};
