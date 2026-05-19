import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "./drawer";
import { Check } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

/**
 * MobileSelect: renders as standard Select on desktop, bottom Drawer on mobile.
 * Props:
 *   value, onValueChange - controlled value
 *   options: Array<{ value: string, label: string }>
 *   placeholder, title: strings
 *   triggerClassName: class for the trigger button
 *   triggerContent: ReactNode prepended inside trigger (e.g. an icon)
 */
export function MobileSelect({
  value,
  onValueChange,
  options = [],
  placeholder,
  title,
  triggerClassName,
  triggerContent,
}: any) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const selected = options.find((o: any) => o.value === value);

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={triggerClassName}>
          {triggerContent}
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
          {options.map((o: any) => (
            <SelectItem key={o.value} value={o.value} className="capitalize">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 h-9 px-3 rounded-md border text-sm capitalize",
          triggerClassName,
        )}
      >
        {triggerContent}
        <span className="flex-1 text-left">
          {selected?.label || placeholder}
        </span>
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="bg-[#0f0f18] border-white/10 text-white">
          <DrawerHeader>
            <DrawerTitle className="text-white text-base">
              {title || placeholder}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-safe space-y-1 pb-8">
            {options.map((o: any) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onValueChange(o.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm transition-colors capitalize",
                  o.value === value
                    ? "bg-amber-500/10 text-amber-400"
                    : "text-white/70 hover:bg-white/5",
                )}
              >
                {o.label}
                {o.value === value && (
                  <Check className="w-4 h-4 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
