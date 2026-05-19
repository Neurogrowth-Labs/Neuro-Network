import React, { useState } from "react";
import CardPreview from "../components/CardPreview";
import AICardGenerator from "../components/AICardGenerator";
import CardComments from "../components/CardComments";
import { MY_CARD } from "./Dashboard";

export default function Editor() {
  const [card, setCard] = useState(MY_CARD);

  const applyAI = (concept: any) => {
    setCard((prev) => ({
      ...prev,
      ...concept,
    }));
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-4xl font-light tracking-tighter text-white mb-2">
          AI Studio
        </h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
          Design and collaborate on your digital identity.
        </p>
      </div>

      <div className="relative">
        <CardPreview card={card} />
      </div>

      <AICardGenerator card={card} onApply={applyAI} />

      <div className="pt-6 border-t border-white/5">
        <CardComments cardId="mock-card-id" />
      </div>
    </div>
  );
}
