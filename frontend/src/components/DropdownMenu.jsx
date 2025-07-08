import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

const DROPDOWN_WIDTH = 240;

const DropdownMenu = ({ dotsHidden = false, isLeft = false, menu }) => {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const close = () => setOpen(false);

  // Close menu when clicking outside
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
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.top + window.scrollY,
        left: isLeft
          ? rect.left + window.scrollX
          : rect.right - DROPDOWN_WIDTH + window.scrollX,
      });
    }
  }, [open]);

  useLayoutEffect(() => {
    function handleResize() {
      if (open && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.top + window.scrollY,
          left: isLeft
            ? rect.left + window.scrollX
            : rect.right - DROPDOWN_WIDTH + window.scrollX,
        });
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        className={`p-2 rounded-full transition cursor-pointer text-gray-600 hover:text-gray-900 ${
          dotsHidden ? "invisible" : ""
        }`}
        onClick={() => setOpen((o) => !o)}
      >
        {/* Three dots icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
          />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={`absolute z-50 bg-white rounded-xl shadow-lg border border-gray-200 p-4 transition-all duration-200 w-60`}
            style={{
              top: dropdownPos.top,
              left: dropdownPos.left,
            }}
            tabIndex={-1}
          >
            <div className={`flex ${isLeft ? "justify-start" : "justify-end"}`}>
              <button
                className="text-gray-400 hover:text-gray-700 transition"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {menu({ close })}
          </div>,
          document.body
        )}
    </>
  );
};

export default DropdownMenu;
