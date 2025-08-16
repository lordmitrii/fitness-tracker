import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function useScrollToTop(scrollRef) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    if (scrollRef.current) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
      });
    }
  }, [location.pathname, location.search]);

  return null;
}

export default useScrollToTop;
