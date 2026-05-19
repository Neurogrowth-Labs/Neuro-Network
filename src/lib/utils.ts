import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createPageUrl(pageName: string) {
  return "/" + pageName.replace(/ /g, "-");
}

export const isIframe = window.self !== window.top;
