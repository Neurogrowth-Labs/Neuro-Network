import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, CheckCircle2 } from "lucide-react";

export default function NFCShareAnimation({ contact, onClose }: any) {
  const [phase, setPhase] = useState("ready"); // ready → transmitting → done

  useEffect(() => {
    if (!contact) return;
    const t1 = setTimeout(() => setPhase("transmitting"), 100);
    const t2 = setTimeout(() => setPhase("done"), 2200);
    const t3 = setTimeout(() => {
      onClose?.();
    }, 3800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [contact, onClose]);

  useEffect(() => {
    if (phase === "transmitting" && navigator.vibrate) {
      navigator.vibrate([60, 30, 80, 30, 60]);
    }
    if (phase === "done" && navigator.vibrate) {
      navigator.vibrate([100, 20, 100]);
    }
  }, [phase]);

  return (
    <AnimatePresence>
      {contact && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={phase === "done" ? () => onClose?.() : undefined}
          style={{
            background: "rgba(10,10,12,0.96)",
            backdropFilter: "blur(24px)",
          }}
        >
          {phase === "transmitting" && (
            <>
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border"
                  style={{ borderColor: "rgba(34,211,238,0.35)" }}
                  initial={{ width: 80, height: 80, opacity: 0.9 }}
                  animate={{ width: "120vw", height: "120vw", opacity: 0 }}
                  transition={{
                    duration: 2,
                    delay: i * 0.45,
                    ease: "easeOut",
                    repeat: Infinity,
                  }}
                />
              ))}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: 160,
                  height: 160,
                  background:
                    "radial-gradient(circle, rgba(34,211,238,0.3) 0%, transparent 70%)",
                }}
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            </>
          )}

          {phase === "done" && (
            <>
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(34,211,238,0.4) 0%, transparent 70%)",
                }}
              />
              {[0, 1].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border"
                  style={{ borderColor: "rgba(34,211,238,0.5)" }}
                  initial={{ width: 100, height: 100, opacity: 0.8 }}
                  animate={{ width: "110vw", height: "110vw", opacity: 0 }}
                  transition={{
                    duration: 1.2,
                    delay: i * 0.3,
                    ease: "easeOut",
                  }}
                />
              ))}
            </>
          )}

          <motion.div
            className="relative z-10 flex flex-col items-center gap-6 text-center px-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.1,
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
          >
            <div className="relative">
              {phase !== "done" ? (
                <motion.div
                  className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(8,145,178,0.15))",
                    border: "1px solid rgba(34,211,238,0.3)",
                  }}
                  animate={
                    phase === "transmitting"
                      ? {
                          boxShadow: [
                            "0 0 20px rgba(34,211,238,0.2)",
                            "0 0 50px rgba(34,211,238,0.5)",
                            "0 0 20px rgba(34,211,238,0.2)",
                          ],
                        }
                      : {}
                  }
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  <Wifi className="w-10 h-10 text-cyan-400" />
                </motion.div>
              ) : (
                <motion.div
                  className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{
                    background: "rgba(34,211,238,0.15)",
                    border: "1px solid rgba(34,211,238,0.4)",
                    boxShadow: "0 0 40px rgba(34,211,238,0.3)",
                  }}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                >
                  <CheckCircle2 className="w-10 h-10 text-cyan-400" />
                </motion.div>
              )}
            </div>

            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white/70"
              style={{
                background:
                  "linear-gradient(135deg, rgba(34,211,238,0.12), rgba(8,145,178,0.12))",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {contact.full_name?.[0]?.toUpperCase()}
            </div>

            <div>
              <p className="text-2xl font-black text-white tracking-tighter">
                {contact.full_name}
              </p>
              {contact.job_title && (
                <p className="text-sm text-white/40 mt-1 font-medium">
                  {contact.job_title}
                  {contact.company ? ` · ${contact.company}` : ""}
                </p>
              )}
            </div>

            <div className="flex flex-col items-center gap-2">
              {phase === "ready" && (
                <p className="text-sm text-white/30 uppercase tracking-widest font-black">
                  Initializing NFC transfer…
                </p>
              )}
              {phase === "transmitting" && (
                <motion.p
                  className="text-sm font-black uppercase tracking-widest"
                  style={{ color: "#22d3ee" }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  Transmitting contact…
                </motion.p>
              )}
              {phase === "done" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-base font-black text-cyan-400 uppercase tracking-widest">
                    Transfer Complete!
                  </p>
                  <p className="text-xs text-white/30 mt-1">
                    Tap anywhere to close
                  </p>
                </motion.div>
              )}
            </div>

            {phase === "transmitting" && (
              <div
                className="w-48 h-1 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg,#22d3ee,#0891b2)",
                  }}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
