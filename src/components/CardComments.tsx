import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Lightbulb,
  ThumbsUp,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const TYPE_CONFIG: any = {
  comment: {
    icon: MessageSquare,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    label: "Comment",
  },
  suggestion: {
    icon: Lightbulb,
    color: "text-white",
    bg: "bg-white/10",
    label: "Suggestion",
  },
  approval: {
    icon: ThumbsUp,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    label: "Approval",
  },
};

export default function CardComments({ cardId }: any) {
  const [message, setMessage] = useState("");
  const [type, setType] = useState("comment");
  const [user, setUser] = useState<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth
      .me()
      .then(setUser)
      .catch(() => {});
  }, []);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["card-comments", cardId],
    queryFn: () => base44.entities.CardComment.filter({ card_id: cardId }),
    enabled: !!cardId,
  });

  useEffect(() => {
    if (!cardId) return;
    const unsub = base44.entities.CardComment.subscribe((event: any) => {
      queryClient.setQueryData(["card-comments", cardId], (old: any = []) => {
        if (event.type === "create" && event.data?.card_id === cardId)
          return [...old, event.data];
        if (event.type === "update" && event.data?.card_id === cardId)
          return old.map((c: any) => (c.id === event.id ? event.data : c));
        if (event.type === "delete")
          return old.filter((c: any) => c.id !== event.id);
        return old;
      });
    });
    return () => unsub();
  }, [cardId, queryClient]);

  const addMutation = useMutation({
    mutationFn: () =>
      base44.entities.CardComment.create({
        card_id: cardId,
        message,
        type,
        author_name: user?.full_name || "You",
        author_email: user?.email || "",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-comments", cardId] });
      setMessage("");
      toast.success("Comment added");
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) =>
      base44.entities.CardComment.update(id, { resolved: true }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["card-comments", cardId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => base44.entities.CardComment.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["card-comments", cardId] }),
  });

  const active = comments.filter((c: any) => !c.resolved);
  const resolved = comments.filter((c: any) => c.resolved);

  if (!cardId)
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-8 h-8 text-white/10 mx-auto mb-2" />
        <p className="text-sm text-white/25">
          Save your card first to enable collaboration comments.
        </p>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-cyan-400" />
        <p className="text-sm font-bold tracking-tight">Team Collaboration</p>
        {active.length > 0 && (
          <span className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded px-2 py-0.5 bg-cyan-500/10 text-cyan-400">
            {active.length} open
          </span>
        )}
      </div>

      <div className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <div className="grid grid-cols-2 gap-2 w-max">
          {Object.entries(TYPE_CONFIG).map(([t, cfg]: any) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex items-center justify-start gap-1.5 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all ${type === t ? `${cfg.bg} ${cfg.color}` : "bg-white/5 text-white/30 hover:bg-white/10"}`}
            >
              <cfg.icon className="w-3 h-3" />
              {cfg.label}
            </button>
          ))}
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            type === "suggestion"
              ? "Suggest a design change…"
              : type === "approval"
                ? "Approve this design…"
                : "Leave a comment for your team…"
          }
          className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 text-sm font-medium tracking-tight text-white placeholder:text-white/20 resize-none min-h-[80px] focus:outline-none focus:border-cyan-500/40"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey && message.trim())
              addMutation.mutate();
          }}
        />
        <button
          onClick={() => addMutation.mutate()}
          disabled={!message.trim() || addMutation.isPending}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest text-[#0a0a0c] disabled:opacity-40 transition-all bg-white hover:bg-cyan-400"
        >
          {addMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          Post
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-cyan-400/40 animate-spin" />
        </div>
      ) : active.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="w-7 h-7 text-white/8 mx-auto mb-2" />
          <p className="text-xs text-white/20">No open feedback yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((c: any) => {
            const cfg = TYPE_CONFIG[c.type] || TYPE_CONFIG.comment;
            return (
              <div key={c.id} className="relative pl-8">
                <div
                  className={`absolute left-0 top-0 w-6 h-6 rounded flex items-center justify-center text-[10px] font-black tracking-tighter uppercase text-[#0a0a0c] bg-white`}
                >
                  {(c.author_name || "T")[0]}
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl rounded-tl-none group">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-black uppercase tracking-widest ${cfg.color}`}
                      >
                        {cfg.label}
                      </span>
                      <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>{" "}
                        Unresolved
                      </span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20">
                      {c.created_date
                        ? format(new Date(c.created_date), "h:mm a")
                        : "Just now"}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed font-medium tracking-tight mb-2">
                    {c.message}
                  </p>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => resolveMutation.mutate(c.id)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 text-[9px] font-black uppercase tracking-widest text-white/50 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                      title="Resolve"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Resolve
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(c.id)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 text-[9px] font-black uppercase tracking-widest text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {resolved.length > 0 && (
        <details className="group">
          <summary className="text-[10px] font-black uppercase tracking-widest text-white/20 cursor-pointer hover:text-white/40 transition-colors flex items-center gap-1.5 focus:outline-none select-none">
            <CheckCircle2 className="w-3 h-3" />
            {resolved.length} resolved
          </summary>
          <div className="mt-4 space-y-3 opacity-50">
            {resolved.map((c: any) => (
              <div
                key={c.id}
                className="rounded-xl border border-white/5 p-4 bg-white/[0.01]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                      {c.author_name}
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                      Resolved
                    </span>
                  </div>
                </div>
                <p className="text-xs font-medium tracking-tight text-white/30 pl-5">
                  {c.message}
                </p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
