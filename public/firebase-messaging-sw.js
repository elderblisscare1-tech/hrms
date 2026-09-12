// This file must be in the public directory
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// NOTE: You must fill these in with your actual Firebase config
// from your .env.local file because process.env is not available here.
const firebaseConfig = {
  apiKey: "AIzaSyACMApWHbeMhdoCZRszbfE0uYlnZ2vuS7U",
  authDomain: "elderblisscare1.firebaseapp.com",
  projectId: "elderblisscare1",
  storageBucket: "elderblisscare1.firebasestorage.app",
  messagingSenderId: "528225851763",
  appId: "1:528225851763:android:56308d306029f1b19a4d06"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();
  
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: '/favicon.ico'
    };
  
    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (error) {
  console.log("Firebase messaging sw error:", error);
}
