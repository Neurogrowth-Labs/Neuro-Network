import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const TAB_ROOTS = ["/", "/vault", "/editor"];

const getRootForPath = (pathname: string) =>
  TAB_ROOTS.find((r) => pathname === r || pathname.startsWith(r + "/")) || null;

export function useTabHistoryTracker() {
  const location = useLocation();
  useEffect(() => {
    const root = getRootForPath(location.pathname);
    if (root) {
      sessionStorage.setItem(
        `cv-tab:${root}`,
        location.pathname + location.search,
      );
    }
  }, [location.pathname, location.search]);
}

export function useNavigateToTab() {
  const navigate = useNavigate();
  return (rootPath: string) => {
    const stored = sessionStorage.getItem(`cv-tab:${rootPath}`);
    navigate(stored || rootPath);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
}
