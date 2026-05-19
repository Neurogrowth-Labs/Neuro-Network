import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "./drawer";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

/**
 * MobileDropdown: renders as DropdownMenu on desktop, bottom Drawer on mobile.
 * Props:
 *   trigger: ReactNode - the trigger button element (no onClick needed)
 *   title: optional string header shown in drawer
 *   items: Array<
 *     | { label, icon?, onClick, destructive? }
 *     | { separator: true }
 *   >
 */
export function MobileDropdown({ trigger, items = [], title }: any) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (!isMobile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent className="bg-[#1a1a2e] border-white/10 text-white text-sm">
          {items.map((item: any, i: number) =>
            item.separator ? (
              <DropdownMenuSeparator key={i} className="bg-white/5" />
            ) : (
              <DropdownMenuItem
                key={i}
                onClick={item.onClick}
                className={
                  item.destructive
                    ? "text-red-400 focus:text-red-400 focus:bg-red-500/10"
                    : ""
                }
              >
                {item.icon && <item.icon className="w-3.5 h-3.5 mr-2" />}
                {item.label}
              </DropdownMenuItem>
            ),
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const mobileTrigger = React.cloneElement(trigger, {
    onClick: (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      setOpen(true);
    },
  });

  return (
    <>
      {mobileTrigger}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="bg-[#0f0f18] border-white/10 text-white">
          {title && (
            <DrawerHeader>
              <DrawerTitle className="text-white text-sm font-medium">
                {title}
              </DrawerTitle>
            </DrawerHeader>
          )}
          <div className="px-4 pb-8 space-y-1">
            {items.map((item: any, i: number) =>
              item.separator ? (
                <div key={i} className="h-px bg-white/5 my-1" />
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    item.onClick?.();
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm transition-colors",
                    item.destructive
                      ? "text-red-400 hover:bg-red-500/10"
                      : "text-white/70 hover:bg-white/5",
                  )}
                >
                  {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
                  {item.label}
                </button>
              ),
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
