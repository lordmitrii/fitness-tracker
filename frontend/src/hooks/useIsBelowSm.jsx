import { useEffect, useState } from "react";

export function useIsBelowSm() {
  const query = "(max-width: 639px)";
  const getMatch = () =>
    typeof window !== "undefined" &&
    typeof window.matchMedia !== "undefined" &&
    window.matchMedia(query).matches;

  const [isBelowSm, setIsBelowSm] = useState(getMatch());

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = (e) => setIsBelowSm(e.matches);
    mql.addEventListener?.("change", onChange);
    return () => {
      mql.removeEventListener?.("change", onChange);
    };
  }, []);

  return isBelowSm;
}
