import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabase";
import { useUser } from "./UserContext";
import { toast } from "sonner";

interface AdminStateContextType {
  signupsEnabled: boolean;
  copilotSpeed: "turbo" | "balanced";
  maintenanceMode: boolean;
  toggleSetting: (setting: "signups" | "copilot" | "maintenance") => Promise<void>;
  broadcastAnnouncement: (subject: string, body: string, priority: "normal" | "urgent") => Promise<void>;
  realtimeLogs: Array<{ id: string; event: string; timestamp: string }>;
  profilesVersion: number;
  contactsVersion: number;
  notesVersion: number;
}

const AdminStateContext = createContext<AdminStateContextType | undefined>(undefined);

export function AdminStateProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, setProfile } = useUser();
  const [signupsEnabled, setSignupsEnabled] = useState<boolean>(() => {
    return localStorage.getItem("setting_signups_enabled") !== "false";
  });
  const [copilotSpeed, setCopilotSpeed] = useState<"turbo" | "balanced">(() => {
    return (localStorage.getItem("setting_copilot_speed") as "turbo" | "balanced") || "turbo";
  });
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(() => {
    return localStorage.getItem("setting_maintenance_mode") === "true";
  });
  
  // Versions used to trigger reactive re-fetching in active views
  const [profilesVersion, setProfilesVersion] = useState(0);
  const [contactsVersion, setContactsVersion] = useState(0);
  const [notesVersion, setNotesVersion] = useState(0);

  const [realtimeLogs, setRealtimeLogs] = useState<Array<{ id: string; event: string; timestamp: string }>>([
    {
      id: "init",
      event: "Supabase Realtime Engine Initialized.",
      timestamp: new Date().toISOString(),
    }
  ]);

  useEffect(() => {
    // 1. Setup a dedicated channel for lightweight, instant broadcast messaging
    const broadcastChannel = supabase.channel("admin_state_broadcast", {
      config: {
        broadcast: { ack: false, self: true },
      },
    });

    broadcastChannel
      .on("broadcast", { event: "settings-change" }, (response: any) => {
        const payload = response.payload;
        if (payload) {
          if (payload.signupsEnabled !== undefined) {
            setSignupsEnabled(payload.signupsEnabled);
            localStorage.setItem("setting_signups_enabled", String(payload.signupsEnabled));
          }
          if (payload.copilotSpeed !== undefined) {
            setCopilotSpeed(payload.copilotSpeed);
            localStorage.setItem("setting_copilot_speed", payload.copilotSpeed);
          }
          if (payload.maintenanceMode !== undefined) {
            setMaintenanceMode(payload.maintenanceMode);
            localStorage.setItem("setting_maintenance_mode", String(payload.maintenanceMode));
            
            // Instantly notify current online fellows
            if (payload.maintenanceMode) {
              toast.error("SYSTEM NOTICE: The Super Admin has enabled Platform Maintenance Mode.", {
                duration: 8000,
              });
            } else {
              toast.success("SYSTEM NOTICE: Scheduled platform maintenance has concluded. All services are active.", {
                duration: 5000,
              });
            }
          }

          setRealtimeLogs((prev) => [
            {
              id: crypto.randomUUID(),
              event: `Settings update broadcast received: Signups=${payload.signupsEnabled}, Copilot=${payload.copilotSpeed}, Maintenance=${payload.maintenanceMode}`,
              timestamp: new Date().toISOString(),
            },
            ...prev.slice(0, 30),
          ]);
        }
      })
      .on("broadcast", { event: "global-alert" }, (response: any) => {
        const payload = response.payload;
        if (payload) {
          const isUrgent = payload.priority === "urgent";
          toast(isUrgent ? "🚨 URGENT BROADCAST" : "📢 GLOBAL ANNOUNCEMENT", {
            description: `${payload.subject}: ${payload.body}`,
            duration: isUrgent ? 12000 : 8000,
            className: isUrgent ? "border-red-500 bg-red-950/90 text-white" : "border-cyan-500 bg-cyan-950/90 text-white",
          });

          // Also dispatch an event so layout/other parts can update
          window.dispatchEvent(new CustomEvent("admin-global-broadcast", { detail: payload }));

          setRealtimeLogs((prev) => [
            {
              id: crypto.randomUUID(),
              event: `Admin dispatched Broadcast: "${payload.subject}" [Priority: ${payload.priority}]`,
              timestamp: new Date().toISOString(),
            },
            ...prev.slice(0, 30),
          ]);
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Supabase Broadcast Subscribed!");
        }
      });

    // 2. Setup Postgres database subscriptions to listen to live backend edits
    const dbChannel = supabase.channel("admin_db_changes");

    dbChannel
      // Subscribe to changes on user profiles
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          setProfilesVersion((v) => v + 1);
          const eventType = payload.eventType;
          
          if (eventType === "UPDATE") {
            const updatedProfile = payload.new as any;
            
            // Check if this updated profile belongs to the current logged-in user
            if (user && updatedProfile.id === user.id) {
              setProfile((prev: any) => ({
                ...prev,
                ...updatedProfile,
              }));

              if (updatedProfile.status === "Suspended") {
                toast.error("SECURITY ALERT: Your user account has been SUSPENDED by the super administrator.", {
                  duration: Infinity,
                });
              } else {
                toast.success(`Your account level status is now: ${updatedProfile.status || "Active"}`);
              }
            }

            setRealtimeLogs((prev) => [
              {
                id: crypto.randomUUID(),
                event: `Database sync: Profile [${updatedProfile.email || updatedProfile.id}] updated (Role: ${updatedProfile.role}, Status: ${updatedProfile.status})`,
                timestamp: new Date().toISOString(),
              },
              ...prev.slice(0, 30),
            ]);
          } else if (eventType === "DELETE") {
            const deletedProfile = payload.old as any;
            if (user && deletedProfile.id === user.id) {
              toast.error("Your user record was deleted from the central directory.");
            }
          }
        }
      )
      // Subscribe to live modifications in contacts table
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contacts" },
        () => {
          setContactsVersion((v) => v + 1);
          setRealtimeLogs((prev) => [
            {
              id: crypto.randomUUID(),
              event: "Database sync: Contacts registry table mutated by admin panel.",
              timestamp: new Date().toISOString(),
            },
            ...prev.slice(0, 30),
          ]);
        }
      )
      // Subscribe to live modifications in notes table
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes" },
        () => {
          setNotesVersion((v) => v + 1);
          setRealtimeLogs((prev) => [
            {
              id: crypto.randomUUID(),
              event: "Database sync: Central transcription notes modified.",
              timestamp: new Date().toISOString(),
            },
            ...prev.slice(0, 30),
          ]);
        }
      )
      // Subscribe to incoming notifications (real-time notification delivery)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const newNotif = payload.new as any;
          if (newNotif && user && newNotif.user_id === user.id) {
            toast.info(`🔔 New Notification: ${newNotif.content}`, {
              duration: 8000,
            });
            // Fire custom event to notify App.tsx to append or fetch
            window.dispatchEvent(new CustomEvent("realtime-notification-received", { detail: newNotif }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(broadcastChannel);
      supabase.removeChannel(dbChannel);
    };
  }, [user, setProfile]);

  // Command wrapper to alter global states and broadcast instantly over Websockets
  const toggleSetting = async (setting: "signups" | "copilot" | "maintenance") => {
    let payloadUpdate: any = {};
    if (setting === "signups") {
      const next = !signupsEnabled;
      setSignupsEnabled(next);
      localStorage.setItem("setting_signups_enabled", String(next));
      payloadUpdate = { signupsEnabled: next };
    } else if (setting === "copilot") {
      const next = copilotSpeed === "turbo" ? "balanced" : "turbo";
      setCopilotSpeed(next);
      localStorage.setItem("setting_copilot_speed", next);
      payloadUpdate = { copilotSpeed: next };
    } else if (setting === "maintenance") {
      const next = !maintenanceMode;
      setMaintenanceMode(next);
      localStorage.setItem("setting_maintenance_mode", String(next));
      payloadUpdate = { maintenanceMode: next };
    }

    // Dispatch message to all connected peers
    const broadcastChannel = supabase.channel("admin_state_broadcast");
    await broadcastChannel.send({
      type: "broadcast",
      event: "settings-change",
      payload: payloadUpdate,
    });
  };

  // Dispatch global system broadcasts to all users
  const broadcastAnnouncement = async (subject: string, body: string, priority: "normal" | "urgent") => {
    const broadcastChannel = supabase.channel("admin_state_broadcast");
    await broadcastChannel.send({
      type: "broadcast",
      event: "global-alert",
      payload: { subject, body, priority },
    });
  };

  return (
    <AdminStateContext.Provider
      value={{
        signupsEnabled,
        copilotSpeed,
        maintenanceMode,
        toggleSetting,
        broadcastAnnouncement,
        realtimeLogs,
        profilesVersion,
        contactsVersion,
        notesVersion,
      }}
    >
      {children}
    </AdminStateContext.Provider>
  );
}

export function useAdminState() {
  const context = useContext(AdminStateContext);
  if (context === undefined) {
    throw new Error("useAdminState must be used within an AdminStateProvider");
  }
  return context;
}
