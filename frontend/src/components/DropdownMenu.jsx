import {
  memo,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { HorizontalDots, VerticalDots } from "../icons/DotsIcon";
import CloseIcon from "../icons/CloseIcon";

const DROPDOWN_WIDTH = 250;
const MARGIN = 8;

function readPxVar(name, fallback = 0) {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  if (!raw) return fallback;

  if (raw.endsWith("rem")) {
    const rem = parseFloat(raw);
    const fontSize = parseFloat(
      getComputedStyle(document.documentElement).fontSize
    );
    return rem * fontSize;
  }

  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

const DropdownMenu = ({ dotsHorizontal = false, dotsHidden = false, menu }) => {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    transformOrigin: "top right",
  });
  const [ready, setReady] = useState(false);
  const [closeCorner, setCloseCorner] = useState("top-right");

  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  const computePos = useCallback(() => {
    const btn = buttonRef.current;
    const menuEl = menuRef.current;
    if (!btn || !menuEl) return;

    const rect = btn.getBoundingClientRect();

    const scrollX = window.scrollX || document.documentElement.scrollLeft || 0;
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const viewportW = document.documentElement.clientWidth;
    const viewportH = window.innerHeight;

    let cssBottomSafe = readPxVar("--menubar-height", 0);
    let cssLeftSafe = readPxVar("--menubar-width", 0);
    console.log(cssBottomSafe);

    const bottomVisibleYViewport = viewportH - cssBottomSafe - MARGIN;
    const bottomVisibleYPage = scrollY + viewportH - cssBottomSafe - MARGIN;

    const menuWidth = DROPDOWN_WIDTH;
    const menuHeight = menuEl.offsetHeight;

    const shouldOpenUp =
      rect.bottom + MARGIN + menuHeight > bottomVisibleYViewport;

    let top = shouldOpenUp
      ? rect.top + scrollY - menuHeight - MARGIN
      : rect.bottom + scrollY + MARGIN;

    const minTop = MARGIN + scrollY;
    const maxTop = bottomVisibleYPage - menuHeight;
    top = Math.min(Math.max(top, minTop), Math.max(minTop, maxTop));

    const minLeft = MARGIN + scrollX + cssLeftSafe;
    const maxLeft = viewportW + scrollX - menuWidth - MARGIN;

    let left = rect.right + scrollX - menuWidth;
    if (left < minLeft) left = rect.left + scrollX;
    left = Math.min(Math.max(left, minLeft), maxLeft);

    const openingVertical = shouldOpenUp ? "bottom" : "top";
    const triggerCenterX = rect.left + rect.width / 2 + scrollX;
    const menuCenterX = left + menuWidth / 2;
    const openingHorizontal = menuCenterX < triggerCenterX ? "left" : "right";

    let corner = "top-right";
    if (!shouldOpenUp && openingHorizontal === "right") corner = "top-left";
    if (!shouldOpenUp && openingHorizontal === "left") corner = "top-right";
    if (shouldOpenUp && openingHorizontal === "left") corner = "bottom-right";
    if (shouldOpenUp && openingHorizontal === "right") corner = "bottom-left";
    setCloseCorner(corner);

    setDropdownPos({
      top,
      left,
      transformOrigin: `${openingVertical} ${openingHorizontal}`,
    });

    setReady(true);
  }, []);

  const handleOpen = useCallback(() => setOpen(true), []);

  useEffect(() => {
    function handleClick(e) {
      if (
        open &&
        buttonRef.current &&
        menuRef.current &&
        !buttonRef.current.contains(e.target) &&
        !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    setReady(false);

    const onResize = () => computePos();
    const onScroll = () => setOpen(false);

    const id = requestAnimationFrame(() => computePos());

    window.addEventListener("resize", onResize);
    document.addEventListener("scroll", onScroll, {
      passive: true,
      capture: true,
    });

    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("scroll", onScroll, { capture: true });
      cancelAnimationFrame(id);
    };
  }, [open, computePos]);

  const cornerClass =
    closeCorner === "top-right"
      ? "top-2 right-2"
      : closeCorner === "top-left"
      ? "top-2 left-2"
      : closeCorner === "bottom-left"
      ? "bottom-2 left-2"
      : "bottom-2 right-2";

  return (
    <>
      <button
        ref={buttonRef}
        className={`p-2 rounded-full transition cursor-pointer text-gray-700 hover:text-gray-900 ${
          dotsHidden ? "invisible" : ""
        }`}
        onClick={handleOpen}
      >
        {!dotsHorizontal ? <VerticalDots /> : <HorizontalDots />}
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={[
              "absolute z-50 bg-white rounded-2xl shadow-xl shadow-gray-300/60 border border-gray-400 py-8 px-4",
              "transition-transform transition-opacity duration-150",
              ready
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95 pointer-events-none",
            ].join(" ")}
            style={{
              width: DROPDOWN_WIDTH,
              top: dropdownPos.top,
              left: dropdownPos.left,
              transformOrigin: dropdownPos.transformOrigin,
            }}
            tabIndex={-1}
          >
            <button
              className={`absolute ${cornerClass} text-gray-700 hover:text-gray-900 transition`}
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <CloseIcon />
            </button>
            {menu({ close })}
          </div>,
          document.body
        )}
    </>
  );
};

export default memo(DropdownMenu);
