import { useEffect, useRef, useState } from "react";

const THRESHOLD = 72;
const HYSTERESIS = 12;
const MAX_PULL = 84;
const DAMPING = 0.35;
const TOP_EPSILON = 8;
const DEADZONE = 10;

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
  const [offset, setOffset] = useState(0);
  const [uiOffset, setUiOffset] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | pull | ready | refreshing

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
    };

    const onDown = (e) => {
      if (e.pointerType === "mouse" && !isTouchEnv()) return;
      startY.current = getY(e);
      startedAtTop.current = el.scrollTop <= TOP_EPSILON;
      dragging.current = false;
      tookOver.current = false;
      // capture pointer so we keep receiving move/up
      el.setPointerCapture?.(e.pointerId);
    };

    const onMove = (e) => {
      if (e.pointerType === "mouse" && !isTouchEnv()) return;
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
        setStatus("idle");
        setOffset(0);
        dragging.current = false;
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
      if (!dragging.current) return;

      if (status === "ready") {
        setStatus("refreshing");
        try {
          navigator.vibrate?.(8);
        } catch {}
        Promise.resolve(onRefresh?.());
        if (!prefersReduced) requestAnimationFrame(() => setOffset(0));
        else setOffset(0);
      } else {
        setStatus("idle");
        setOffset(0);
      }
      dragging.current = false;
    };

    const opts = { passive: false };
    el.addEventListener("pointerdown", onDown, opts);
    el.addEventListener("pointermove", onMove, opts);
    el.addEventListener("pointerup", onUp, opts);
    el.addEventListener("pointercancel", onUp, opts);

    el.addEventListener("touchstart", onDown, { passive: true });
    el.addEventListener("touchmove", onMove, opts);
    el.addEventListener("touchend", onUp, { passive: true });

    return () => {
      el.removeEventListener("pointerdown", onDown, opts);
      el.removeEventListener("pointermove", onMove, opts);
      el.removeEventListener("pointerup", onUp, opts);
      el.removeEventListener("pointercancel", onUp, opts);
      el.removeEventListener("touchstart", onDown);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onUp);
    };
  }, [ref, status, onRefresh]);

  return { offset, uiOffset, status, THRESHOLD };
}
