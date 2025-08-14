import { useEffect } from "react";

export default function useOutsidePointerClose(
  roots,
  onClose,
  {
    disabled = false,
    touchTapMovementThreshold = 6,
    includeEscapeKey = true,
    capture = true,
    keepOpenAttr = "data-keep-open",
  } = {}
) {
  useEffect(() => {
    if (disabled) return;

    const rootElems = normalizeRoots(roots);
    if (rootElems.length === 0) return;

    let startX = 0,
      startY = 0,
      touchMoved = false;

    const containsTarget = (e) => {
      const path = e.composedPath?.() ?? [];
      if (path.some((n) => isElem(n) && n.hasAttribute?.(keepOpenAttr))) {
        return true;
      }
      if (path.length) {
        return rootElems.some((root) => path.includes(root));
      }
      return rootElems.some((root) => root.contains(e.target));
    };

    const isPrimaryButton = (e) => e.button == null || e.button === 0;

    const onPointerDown = (e) => {
      if (!isPrimaryButton(e)) return;

      const inside = containsTarget(e);

      if (inside) {
        if (e.pointerType === "touch") {
          touchMoved = false;
          startX = e.clientX ?? 0;
          startY = e.clientY ?? 0;
        }
        return;
      }

      if (e.pointerType === "touch") {
        touchMoved = false;
        startX = e.clientX ?? 0;
        startY = e.clientY ?? 0;
        return;
      }

      onClose?.(e);
    };

    const onPointerMove = (e) => {
      if (e.pointerType !== "touch") return;
      const dx = (e.clientX ?? 0) - startX;
      const dy = (e.clientY ?? 0) - startY;
      if (Math.hypot(dx, dy) > touchTapMovementThreshold) touchMoved = true;
    };

    const onPointerUp = (e) => {
      if (e.pointerType !== "touch") return;
      const inside = containsTarget(e);
      if (!inside && !touchMoved) {
        onClose?.(e);
      }
    };

    const onKeyDown = (e) => {
      if (!includeEscapeKey) return;
      if (e.key === "Escape") onClose?.(e);
    };

    document.addEventListener("pointerdown", onPointerDown, capture);
    document.addEventListener("pointermove", onPointerMove, capture);
    document.addEventListener("pointerup", onPointerUp, capture);
    document.addEventListener("keydown", onKeyDown, capture);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, capture);
      document.removeEventListener("pointermove", onPointerMove, capture);
      document.removeEventListener("pointerup", onPointerUp, capture);
      document.removeEventListener("keydown", onKeyDown, capture);
    };
  }, [
    roots,
    onClose,
    disabled,
    touchTapMovementThreshold,
    includeEscapeKey,
    capture,
    keepOpenAttr,
  ]);
}

function normalizeRoots(roots) {
  const arr = Array.isArray(roots) ? roots : [roots];
  const elems = [];
  for (const r of arr) {
    if (!r) continue;
    if (r instanceof HTMLElement) elems.push(r);
    else if (r.current instanceof HTMLElement) elems.push(r.current);
  }
  return elems;
}

function isElem(n) {
  return n && typeof n === "object" && "nodeType" in n;
}
