import { useEffect, useRef } from "react";

export default function useScrollLock(locked) {
  const scrollYRef = useRef(0);

  useEffect(() => {
    const body = document.body;

    if (locked) {
      scrollYRef.current = window.scrollY;

      const originalOverflow = body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;

      body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      return () => {
        body.style.overflow = originalOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        window.scrollTo(0, scrollYRef.current);
      };
    }
  }, [locked]);
}
