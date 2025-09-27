import { useEffect, useMemo, useRef, useState } from "react";

function isEditable(el) {
  if (!el) return false;
  const tag = (el.tagName || "").toLowerCase();
  if (tag === "textarea" || tag === "select") return true;
  if (tag === "input") {
    const type = (el.type || "").toLowerCase();
    const nonText = new Set(["checkbox", "radio", "range", "color", "file"]);
    return !nonText.has(type);
  }
  if (el.isContentEditable) return true;
  return false;
}

export default function useKeyboardVisible(options) {
  const { threshold = 150, iosGuard = true } = options || {};
  const [visible, setVisible] = useState(false);
  const baselineRef = useRef(null);
  const rafRef = useRef(null);
  const vv = typeof window !== "undefined" ? window.visualViewport : undefined;

  const isIOS = useMemo(() => {
    if (!iosGuard || typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    return /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
  }, [iosGuard]);

  useEffect(() => {
    const getHeights = () => {
      const layoutHeight = document.documentElement
        ? document.documentElement.clientHeight
        : 0;
      const inner = window.innerHeight || 0;
      const vvHeight = (vv && vv.height) || inner || layoutHeight;
      return { vvHeight, inner, layoutHeight };
    };

    const init = () => {
      const { vvHeight, inner, layoutHeight } = getHeights();
      const candidate = Math.max(vvHeight, inner, layoutHeight);
      if (candidate > 0) baselineRef.current = candidate;
    };

    const compute = () => {
      const { vvHeight, inner, layoutHeight } = getHeights();
      const current = Math.min(vvHeight, inner || vvHeight);
      const baseline = baselineRef.current != null ? baselineRef.current : current;
      const diff = Math.max(0, baseline - current);
      const focused = isEditable(document.activeElement);

      if (!focused) {
        baselineRef.current = Math.max(current, layoutHeight, inner);
        if (visible) {
          window.setTimeout(() => setVisible(false), 50);
        }
        return;
      }

      setVisible(diff > threshold);
    };

    const onChange = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(compute);
    };

    init();

    vv && vv.addEventListener("resize", onChange);
    vv && vv.addEventListener("scroll", onChange);
    window.addEventListener("orientationchange", onChange, { passive: true });
    document.addEventListener("focusin", onChange);
    document.addEventListener("focusout", onChange);

    let t1, t2, t3;
    if (isIOS) {
      t1 = window.setTimeout(onChange, 0);
      t2 = window.setTimeout(onChange, 120);
      t3 = window.setTimeout(onChange, 260);
    }

    return () => {
      vv && vv.removeEventListener("resize", onChange);
      vv && vv.removeEventListener("scroll", onChange);
      window.removeEventListener("orientationchange", onChange);
      document.removeEventListener("focusin", onChange);
      document.removeEventListener("focusout", onChange);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
      if (t3) clearTimeout(t3);
    };
  }, [visible, vv, isIOS, threshold]);

  return visible;
}
