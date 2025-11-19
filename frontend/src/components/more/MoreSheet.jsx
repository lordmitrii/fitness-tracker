import { useEffect, useRef, useState } from "react";
import MoreContent from "./MoreContent";

const MoreSheet = ({ open, onClose }) => {
  const sheetRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [entering, setEntering] = useState(false);
  const [closing, setClosing] = useState(false);

  const OPEN_DUR = 300;
  const CLOSE_DUR = 200;

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      setEntering(true);
      const id1 = requestAnimationFrame(() => {
        const id2 = requestAnimationFrame(() => setEntering(false));
        return () => cancelAnimationFrame(id2);
      });
      return () => cancelAnimationFrame(id1);
    } else if (mounted) {
      setClosing(true);
      const to = setTimeout(() => {
        setMounted(false);
        setClosing(false);
      }, CLOSE_DUR);
      return () => clearTimeout(to);
    }
  }, [open, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mounted, onClose]);

  const onBackdropMouseDown = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!mounted) return null;

  const animDur = entering
    ? `duration-${OPEN_DUR}`
    : closing
    ? `duration-${CLOSE_DUR}`
    : `duration-${OPEN_DUR}`;
  const animEase = entering
    ? "ease-[cubic-bezier(0.2,0.8,0.2,1)]"
    : closing
    ? "ease-[cubic-bezier(0.4,0,1,1)]"
    : "ease-[cubic-bezier(0.2,0.8,0.2,1)]";

  const backdropBase = `fixed inset-0 bg-black/10 transition-opacity ${animDur} ${animEase}`;
  const backdropClass =
    entering || closing
      ? `${backdropBase} opacity-0`
      : `${backdropBase} opacity-100`;

  const sheetBase = `
    fixed inset-x-0 bottom-0 z-50
    bg-transparent shadow-2xl
    pt-[env(safe-area-inset-top)]
    sm:max-w-md sm:mx-auto w-full
    h-full overflow-auto
    transform-gpu will-change-transform
    transition-transform ${animDur} ${animEase}
  `.replace(/\s+/g, " ");

  const sheetClass =
    entering || closing
      ? `${sheetBase} translate-y-full`
      : `${sheetBase} translate-y-0`;

  return (
    <div className="fixed inset-0 z-40" onMouseDown={onBackdropMouseDown}>
      <div className={backdropClass} />
      <div ref={sheetRef} className={sheetClass}>
        <MoreContent onDone={onClose} variant="sheet" />
      </div>
    </div>
  );
};

export default MoreSheet;
