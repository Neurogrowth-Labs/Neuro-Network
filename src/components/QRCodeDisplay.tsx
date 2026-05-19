import React, { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, SlidersHorizontal, Palette } from "lucide-react";

interface QRCodeDisplayProps {
  value: string;
}

export function QRCodeDisplay({ value }: QRCodeDisplayProps) {
  const [color, setColor] = useState("#D4AF37");
  const [size, setSize] = useState(200);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleDownload = () => {
    if (!svgRef.current) return;

    // Create a canvas to convert SVG to PNG
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    // Ensure the canvas is sized appropriately, perhaps with some padding
    const padding = 20;
    canvas.width = size + padding * 2;
    canvas.height = size + padding * 2;

    img.onload = () => {
      if (ctx) {
        // Draw white background
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the image
        ctx.drawImage(img, padding, padding);

        // Convert to data URL and download
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = "cardvault-qr.png";
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  if (!value) {
    return (
      <div className="text-white/60 p-4 border border-white/20 rounded-lg">
        No value provided for QR Code.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-6 space-y-6 bg-white/5 border border-white/10 rounded-xl max-w-sm">
      <div className="bg-white p-4 rounded-xl shadow-lg transition-transform duration-300">
        <QRCodeSVG
          value={value}
          size={size}
          fgColor={color}
          bgColor="#FFFFFF"
          level="H"
          marginSize={1}
          ref={svgRef}
        />
      </div>

      <div className="w-full space-y-4">
        {/* Color Picker Controls */}
        <div className="flex flex-col space-y-2">
          <label className="flex items-center text-sm font-medium text-white/80">
            <Palette className="w-4 h-4 mr-2" />
            QR Color
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 rounded border-0 bg-transparent cursor-pointer"
            />
            <span className="text-white/60 text-sm font-mono">
              {color.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Size Slider Controls */}
        <div className="flex flex-col space-y-2">
          <label className="flex items-center text-sm font-medium text-white/80">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Size: {size}px
          </label>
          <input
            type="range"
            min="100"
            max="400"
            step="10"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full accent-white"
          />
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        className="flex items-center justify-center w-full py-2 px-4 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors"
      >
        <Download className="w-4 h-4 mr-2" />
        Download QR Code
      </button>
    </div>
  );
}
