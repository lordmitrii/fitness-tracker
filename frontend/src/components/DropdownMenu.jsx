import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { HorizontalDots, VerticalDots } from "../icons/DotsIcon";
import CloseIcon from "../icons/CloseIcon";

const DROPDOWN_WIDTH = 250;

const DropdownMenu = ({
  dotsHorizontal = false,
  dotsHidden = false,
  isLeft = false,
  menu,
}) => {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const close = () => setOpen(false);

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

  // useEffect(() => {
  //   if (open && buttonRef.current) {
  //     const rect = buttonRef.current.getBoundingClientRect();
  //     setDropdownPos({
  //       top: rect.top + window.scrollY,
  //       left: isLeft
  //         ? rect.left + window.scrollX
  //         : rect.right - DROPDOWN_WIDTH + window.scrollX,
  //     });
  //   }
  // }, [open]);

  const handleOpen = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.top + window.scrollY,
        left: isLeft
          ? rect.left + window.scrollX
          : rect.right - DROPDOWN_WIDTH + window.scrollX,
      });
      setOpen(true);
    }
  };

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
        className={`p-2 rounded-full transition cursor-pointer text-gray-700 hover:text-gray-900 ${
          dotsHidden ? "invisible" : ""
        }`}
        onClick={handleOpen}
      >
        {/* Three dots icon */}
        {!dotsHorizontal ? <VerticalDots /> : <HorizontalDots />}
      </button>

      {open &&
        dropdownPos &&
        createPortal(
          <div
            ref={menuRef}
            className={`absolute z-50 bg-white rounded-xl shadow-lg border border-gray-200 p-4 transition-all duration-200`}
            style={{
              width: DROPDOWN_WIDTH,
              top: dropdownPos.top,
              left: dropdownPos.left,
            }}
            tabIndex={-1}
          >
            <div className={`flex ${isLeft ? "justify-start" : "justify-end"}`}>
              <button
                className="text-gray-700 hover:text-gray-900 transition"
                onClick={() => setOpen(false)}
              >
                <CloseIcon />
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
