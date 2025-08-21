import { useEffect, useRef, useState } from "react";

const THRESHOLD = 100;
const HYSTERESIS = 12;
const MAX_PULL = 110;
const DAMPING = 0.35;
const TOP_EPSILON = 8;
const DEADZONE = 10;
const REFRESH_MS = 300;

const isTouchEnv = () =>
  (typeof window !== "undefined" &&
    (navigator.maxTouchPoints > 0 ||
      window.matchMedia?.("(hover: none) and (pointer: coarse)").matches)) ||
  false;

export default function usePullToRefresh(ref, onRefresh) {
  const startY = useRef(0);
  const startedAtTop = useRef(false);
  const dragging = useRef(false);
  const tookOver = useRef(false);
  const pointerIdRef = useRef(null);
  const cancelTimer = useRef(null);

  const [offset, setOffset] = useState(0);
  const [uiOffset, setUiOffset] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | pull | ready | refreshing

  const reset = () => {
    dragging.current = false;
    tookOver.current = false;
    pointerIdRef.current = null;
    setStatus("idle");
    setOffset(0);
  };

  const armCancelTimer = () => {
    if (cancelTimer.current) clearTimeout(cancelTimer.current);
    cancelTimer.current = setTimeout(() => {
      if (dragging.current || offset > 0) reset();
    }, 1500);
  };

  useEffect(() => () => clearTimeout(cancelTimer.current), []);

  useEffect(() => {
    let raf;
    const tick = () => {
      const k = 0.22;
      const next = uiOffset + (offset - uiOffset) * k;
      if (Math.abs(next - uiOffset) > 0.2) {
        setUiOffset(next);
        raf = requestAnimationFrame(tick);
      } else {
        setUiOffset(offset);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [offset, uiOffset]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const getY = (e) =>
      e?.clientY ??
      e?.touches?.[0]?.clientY ??
      e?.changedTouches?.[0]?.clientY ??
      0;

    const beginPull = () => {
      dragging.current = true;
      setStatus("pull");
      tookOver.current = true;
      armCancelTimer();
    };

    const onDown = (e) => {
      if (e.pointerType === "mouse" && !isTouchEnv()) return;

      if (status !== "refreshing" && (status !== "idle" || offset > 0)) {
        reset();
        return;
      }

      startY.current = getY(e);
      startedAtTop.current = el.scrollTop <= TOP_EPSILON;
      dragging.current = false;
      tookOver.current = false;
      pointerIdRef.current = e.pointerId ?? null;

      // capture pointer so we keep receiving move/up
      el.setPointerCapture?.(e.pointerId);
    };

    const onMove = (e) => {
      if (e.pointerType === "mouse" && !isTouchEnv()) return;
      armCancelTimer();

      const dy = getY(e) - startY.current;

      if (!dragging.current) {
        if (
          dy > DEADZONE &&
          (startedAtTop.current || el.scrollTop <= TOP_EPSILON)
        ) {
          el.scrollTop = 0;
          e.preventDefault();
          beginPull();
        } else {
          return;
        }
      }

      if (dy <= 0) {
        reset();
        return;
      }

      const damped =
        dy < THRESHOLD ? dy : THRESHOLD + (dy - THRESHOLD) * DAMPING;
      const clamped = Math.min(damped, MAX_PULL);
      e.preventDefault();

      setOffset(clamped);
      if (status !== "refreshing") {
        if (status === "pull" && clamped >= THRESHOLD) setStatus("ready");
        else if (status === "ready" && clamped <= THRESHOLD - HYSTERESIS)
          setStatus("pull");
      }
    };

    const onUp = (e) => {
      if (e.pointerType === "mouse" && !isTouchEnv()) return;
      if (!dragging.current) {
        // reset();  causes the state reset to happen immediately
        return;
      }

      clearTimeout(cancelTimer.current);

      if (status === "ready") {
        setStatus("refreshing");
        try {
          navigator.vibrate?.(8);
        } catch {}
        (async () => {
          try {
            await Promise.resolve(onRefresh?.());
          } catch (error) {
            console.error("Pull-to-refresh failed:", error);
          }
          await new Promise((r) => setTimeout(r, REFRESH_MS));

          if (!prefersReduced) requestAnimationFrame(() => setOffset(0));
          else setOffset(0);

          reset();
        })();
      } else {
        reset();
      }
      dragging.current = false;
    };

    const onPointerLeave = () => {
      if (status !== "refreshing") {
        reset();
      }
    };
    const onLostPointerCapture = () => {
      if (status !== "refreshing") {
        reset();
      }
    };

    const onWindowBlur = () => reset();

    const onVisibilityChange = () => {
      if (document.hidden) reset();
    };

    const onAnyPointerDown = (e) => {
      if (dragging.current && e.pointerId !== pointerIdRef.current) reset();
    };

    const opts = { passive: false };
    el.addEventListener("pointerdown", onDown, opts);
    el.addEventListener("pointermove", onMove, opts);
    el.addEventListener("pointerup", onUp, opts);
    el.addEventListener("pointercancel", onUp, opts);
    el.addEventListener("pointerleave", onPointerLeave, opts);
    el.addEventListener("lostpointercapture", onLostPointerCapture, opts);

    el.addEventListener("touchstart", onDown, { passive: true });
    el.addEventListener("touchmove", onMove, opts);
    el.addEventListener("touchend", onUp, { passive: true });
    el.addEventListener("touchcancel", onUp, { passive: true });

    document.addEventListener("pointerdown", onAnyPointerDown, true);
    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      el.removeEventListener("pointerdown", onDown, opts);
      el.removeEventListener("pointermove", onMove, opts);
      el.removeEventListener("pointerup", onUp, opts);
      el.removeEventListener("pointercancel", onUp, opts);
      el.removeEventListener("pointerleave", onPointerLeave, opts);
      el.removeEventListener("lostpointercapture", onLostPointerCapture, opts);

      el.removeEventListener("touchstart", onDown);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onUp);
      el.removeEventListener("touchcancel", onUp);

      document.removeEventListener("pointerdown", onAnyPointerDown, true);
      window.removeEventListener("blur", onWindowBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);

      clearTimeout(cancelTimer.current);
    };
  }, [ref, status, onRefresh, offset]);

  return { offset, uiOffset, status, THRESHOLD };
}
