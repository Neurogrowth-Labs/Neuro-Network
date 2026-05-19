import React, { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import CardPreview from "./CardPreview";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function CardPDFDownload({ card }: any) {
  const [generating, setGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!previewRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [90, 55],
      });
      pdf.addImage(imgData, "PNG", 0, 0, 90, 55);
      pdf.save(`${card.full_name || "business-card"}.pdf`);
    } catch (e) {
      console.error("PDF generation failed", e);
    }
    setGenerating(false);
  };

  return (
    <>
      <div className="fixed -left-[9999px] -top-[9999px] w-[340px]">
        <div ref={previewRef}>
          <CardPreview card={card} />
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={generating}
        className="border-white/10 text-[9px] font-black uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/5 bg-transparent min-h-[44px] px-4 rounded-xl"
        title="Download PDF"
      >
        {generating ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
        ) : (
          <Download className="w-3.5 h-3.5 mr-2" />
        )}
        PDF
      </Button>
    </>
  );
}
