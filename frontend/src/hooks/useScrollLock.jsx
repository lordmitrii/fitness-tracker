import { useLayoutEffect } from "react";

const useScrollLock = (isLocked) => {
  useLayoutEffect(() => {
    const body = document.body;
    const originalOverflow = body.style.overflow;
    const computedOverflow = window.getComputedStyle(body).overflow;

    if (isLocked) {
      if (computedOverflow !== "hidden") {
        body.style.overflow = "hidden";
      }
    } else {
      body.style.overflow = originalOverflow;
    }

    return () => {
      body.style.overflow = originalOverflow;
    };
  }, [isLocked]);
};

export default useScrollLock;
