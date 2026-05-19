import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Radar, X, Wifi, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const SESSION_TTL_MINUTES = 60;

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function ProximityWidget({ user }: any) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [eventName, setEventName] = useState("");
  const [locating, setLocating] = useState(false);
  const [mySession, setMySession] = useState<any>(null);

  const { data: cards = [] } = useQuery({
    queryKey: ["my-cards"],
    queryFn: () => base44.entities.BusinessCard?.list?.("-created_date") || [],
  });

  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!eventName.trim()) throw new Error("Enter an event name");
      setLocating(true);
      let lat = null,
        lng = null;
      try {
        const pos: any = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 6000 }),
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        /* optional */
      }
      setLocating(false);

      const activeCard = cards[0];
      const expiresAt = new Date(
        Date.now() + SESSION_TTL_MINUTES * 60000,
      ).toISOString();
      return base44.entities.ProximitySession.create({
        user_email: user?.email || "demo@neuro.net",
        user_name: user?.full_name || "Demo",
        card_id: activeCard?.id || "",
        card_slug: activeCard?.card_slug || "",
        event_name: eventName.trim(),
        latitude: lat,
        longitude: lng,
        proximity_code: genCode(),
        status: "active",
        expires_at: expiresAt,
      });
    },
    onSuccess: (session) => {
      setMySession(session);
      queryClient.invalidateQueries({ queryKey: ["proximity-sessions"] });
      toast.success(
        `Checked in to "${session.event_name}" — scanning for nearby contacts`,
      );
    },
    onError: (e: any) => {
      setLocating(false);
      toast.error(e.message || "Check-in failed");
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: () =>
      base44.entities.ProximitySession.update(mySession.id, {
        status: "expired",
      }),
    onSuccess: () => {
      setMySession(null);
      queryClient.invalidateQueries({ queryKey: ["proximity-sessions"] });
      toast.success("Checked out");
    },
  });

  return (
    <div className="rounded-xl border border-white/5 overflow-hidden bg-white/[0.02]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Radar className="w-4 h-4 text-cyan-400" />
          <h2 className="font-black text-[10px] uppercase tracking-widest text-white/50">
            Proximity Share
          </h2>
        </div>
        <Link
          to="/alerts"
          className="text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300"
        >
          Full View →
        </Link>
      </div>

      <div className="p-4">
        {!mySession ? (
          <div className="space-y-3">
            <p className="text-xs text-white/40 font-medium leading-relaxed">
              Check in at an event to detect nearby Neuro NetWorks users and
              share cards instantly.
            </p>
            <div className="flex gap-2">
              <Input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Event name…"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-10 text-sm flex-1 min-w-0 font-medium"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && eventName.trim())
                    checkInMutation.mutate();
                }}
              />
              <Button
                onClick={() => checkInMutation.mutate()}
                disabled={
                  checkInMutation.isPending || locating || !eventName.trim()
                }
                className="h-10 px-4 text-[10px] font-black uppercase tracking-widest text-[#0a0a0c] bg-white hover:bg-cyan-400 flex-shrink-0 gap-1.5 transition-colors"
              >
                {checkInMutation.isPending || locating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Radar className="w-3 h-3" /> Check In
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"
                  style={{ boxShadow: "0 0 6px rgba(34,211,238,0.8)" }}
                />
                <span className="text-sm font-bold text-cyan-300 tracking-tight truncate max-w-[150px]">
                  {mySession.event_name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => checkOutMutation.mutate()}
                disabled={checkOutMutation.isPending}
                className="h-7 w-7 text-white/30 hover:text-red-400 flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <Wifi className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  Your code
                </p>
                <p className="text-xl font-light tracking-[0.2em] text-white leading-none mt-1">
                  {mySession.proximity_code}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(mySession.proximity_code);
                  toast.success("Code copied!");
                }}
                className="border-white/10 text-white/60 hover:bg-white/10 hover:text-white text-[10px] font-black uppercase tracking-widest h-8 px-3 flex-shrink-0"
              >
                Copy
              </Button>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <p className="text-[10px] font-bold text-white/30 uppercase">
                Expires{" "}
                {formatDistanceToNow(new Date(mySession.expires_at), {
                  addSuffix: true,
                })}
              </p>
              <button
                onClick={() => navigate("/alerts")}
                className="text-[10px] uppercase font-black tracking-widest text-cyan-400 hover:text-cyan-300"
              >
                Quick Connect →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
