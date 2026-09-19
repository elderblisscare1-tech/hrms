"use client";

import React from "react";
import { Bell, Search, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, useCompanyId } from "@/lib/auth/auth-context";
import { signOut } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { requestForToken, onMessageListener } from "@/lib/firebase/messaging";
import type { Notification } from "@/lib/schemas/notification";

export function Topbar() {
  const { user, claims } = useAuth();
  const companyId = useCompanyId();
  const router = useRouter();
  const [darkMode, setDarkMode] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  // Setup FCM and permissions
  React.useEffect(() => {
    async function setupFCM() {
      if (!user) return;
      const token = await requestForToken();
      if (token && companyId) {
        // Here you would typically save the token to the user's document in Firestore
        // e.g. updateDoc(doc(db, "users", user.uid), { fcmToken: token });
      }
    }
    setupFCM();

    onMessageListener().then((payload: any) => {
      console.log("Received foreground message:", payload);
      // Optional: show a toast notification here
    }).catch(err => console.log('failed: ', err));
  }, [user, companyId]);

  // Fetch notifications
  React.useEffect(() => {
    if (!companyId) return;
    const q = query(
      collection(db, `companies/${companyId}/notifications`),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = [];
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() } as Notification);
      });
      setNotifications(notifs);
    });
    return () => unsubscribe();
  }, [companyId]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (notificationId: string) => {
    if (!companyId) return;
    try {
      await updateDoc(doc(db, `companies/${companyId}/notifications`, notificationId), {
        isRead: true
      });
    } catch (e) {
      console.error("Error marking as read", e);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const userInitials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.95)] px-6 backdrop-blur-sm">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <Input
            type="search"
            placeholder="Search employees, departments..."
            className="pl-9 h-9 bg-[hsl(var(--secondary))] border-transparent focus-visible:bg-[hsl(var(--background))]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <Button variant="ghost" size="icon-sm" onClick={toggleDarkMode} className="text-[hsl(var(--muted-foreground))]">
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="relative text-[hsl(var(--muted-foreground))]">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[hsl(var(--destructive))] text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notif) => (
                  <DropdownMenuItem 
                    key={notif.id} 
                    className={`flex flex-col items-start p-3 gap-1 cursor-pointer ${!notif.isRead ? 'bg-[hsl(var(--primary)/0.05)]' : ''}`}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className="flex w-full justify-between gap-2">
                      <span className={`font-semibold text-sm ${!notif.isRead ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
                        {notif.title}
                      </span>
                      {notif.createdAt && (
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs line-clamp-2 ${!notif.isRead ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
                      {notif.message}
                    </p>
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Separator */}
        <div className="h-8 w-px bg-[hsl(var(--border))] mx-1" />

        {/* User profile */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors duration-200"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
          </Avatar>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium leading-tight">{user?.displayName || user?.email?.split("@")[0]}</p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              {claims?.role?.replace("_", " ") || "User"}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}
