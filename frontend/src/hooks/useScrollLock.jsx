import { useEffect } from "react";

export default function useScrollLock(locked) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    if (!locked) return;

    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [locked]);
}
