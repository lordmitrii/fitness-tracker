import { RefObject, useEffect } from "react";
import { usePathname } from "expo-router";

interface ScrollableNode {
  scrollToOffset?: (options: { offset: number; animated?: boolean }) => void;
  scrollTo?: (options: { x?: number; y?: number; animated?: boolean }) => void;
  scrollToTop?: () => void;
}

type ScrollRef = RefObject<ScrollableNode | null | undefined> | undefined;

export default function useScrollToTop(ref?: ScrollRef) {
  const pathname = usePathname();

  useEffect(() => {
    if (!ref?.current) return;

    const node = ref.current;
    requestAnimationFrame(() => {
      try {
        if (node?.scrollToOffset) {
          node.scrollToOffset({ offset: 0, animated: false });
          return;
        }
        if (node?.scrollToTop) {
          node.scrollToTop();
          return;
        }
        node?.scrollTo?.({ x: 0, y: 0, animated: false });
      } catch (error) {
        console.warn("useScrollToTop failed", error);
      }
    });
  }, [pathname, ref]);
}
