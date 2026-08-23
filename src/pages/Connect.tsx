import React, { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Radar, Search, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/UserContext";

type Profile = { id: string; full_name: string; job_title: string; company: string; avatar_url: string };
type Connection = { id: string; requester_id: string; recipient_id: string; status: "pending" | "accepted" | "rejected" | "cancelled" };

export default function Connect() {
  const { user } = useUser();
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<Profile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const term = query.trim().replace(/[%,()]/g, "");
    const { data: profiles, error } = await supabase.rpc("discover_profiles", { p_query: term, p_limit: 30 });
    const { data: relationships } = await supabase.from("connections").select("id,requester_id,recipient_id,status").or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);
    if (error) toast.error("Unable to load people. Please try again.");
    setPeople((profiles || []) as Profile[]);
    setConnections((relationships || []) as Connection[]);
    setLoading(false);
  };

  useEffect(() => { const timer = window.setTimeout(load, 250); return () => window.clearTimeout(timer); }, [user?.id, query]);
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`connections:${user.id}`).on("postgres_changes", { event: "*", schema: "public", table: "connections", filter: `requester_id=eq.${user.id}` }, load).on("postgres_changes", { event: "*", schema: "public", table: "connections", filter: `recipient_id=eq.${user.id}` }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const relationship = (id: string) => connections.find(c => c.requester_id === id || c.recipient_id === id);
  const request = async (recipientId: string) => {
    setSubmitting(recipientId);
    const { error } = await supabase.rpc("request_connection", { p_recipient_id: recipientId });
    if (error) toast.error(error.message.includes("duplicate") ? "A connection request already exists." : "Could not send request.");
    else { toast.success("Connection request sent."); await load(); }
    setSubmitting(null);
  };
  const accept = async (id: string) => {
    setSubmitting(id);
    const { error } = await supabase.rpc("respond_to_connection", { p_connection_id: id, p_accept: true });
    error ? toast.error("Could not accept request.") : toast.success("Connection accepted and added to your Vault.");
    await load(); setSubmitting(null);
  };
  const pendingReceived = useMemo(() => connections.filter(c => c.recipient_id === user?.id && c.status === "pending"), [connections, user?.id]);

  return <div className="p-6 space-y-6">
    <header><div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-300"><Radar className="h-4 w-4" /> Real-time network</div><h1 className="mt-2 text-4xl font-light text-white">Connect</h1><p className="mt-2 text-sm text-white/55">Discover active platform members and manage consent-based connections.</p></header>
    {pendingReceived.length > 0 && <section className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4"><h2 className="font-bold text-white">Incoming requests</h2>{pendingReceived.map(c => <div key={c.id} className="mt-3 flex items-center justify-between"><span className="text-sm text-white/70">A member wants to connect.</span><button onClick={() => accept(c.id)} disabled={submitting === c.id} className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-black disabled:opacity-50"><Check className="mr-1 inline h-3 w-3" /> Accept</button></div>)}</section>}
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3"><Search className="h-4 w-4 text-white/40" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, company, or role" className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/30" /></div>
    {loading ? <div className="py-12 text-center text-white/50"><Loader2 className="mx-auto h-5 w-5 animate-spin" /> Loading members…</div> : people.length === 0 ? <div className="rounded-xl border border-white/10 p-8 text-center text-sm text-white/50">No active members match this search.</div> : <div className="space-y-3">{people.map(person => { const rel = relationship(person.id); const received = rel?.recipient_id === user?.id && rel.status === "pending"; return <article key={person.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-4"><img src={person.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(person.full_name)}`} alt="" className="h-11 w-11 rounded-full" /><div className="min-w-0 flex-1"><h2 className="truncate font-semibold text-white">{person.full_name || "Platform member"}</h2><p className="truncate text-xs text-white/50">{[person.job_title, person.company].filter(Boolean).join(" · ") || "Member"}</p></div>{received ? <button onClick={() => accept(rel!.id)} className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-black">Accept</button> : rel?.status === "accepted" ? <span className="text-xs font-bold text-emerald-300"><Users className="mr-1 inline h-4 w-4" />Connected</span> : rel ? <span className="text-xs text-white/45">Request pending</span> : <button onClick={() => request(person.id)} disabled={submitting === person.id} className="rounded-lg border border-cyan-400/40 px-3 py-2 text-xs font-bold text-cyan-300 disabled:opacity-50">{submitting === person.id ? "Sending…" : <><UserPlus className="mr-1 inline h-4 w-4" />Connect</>}</button>}</article>; })}</div>}
  </div>;
}
