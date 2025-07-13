import { useState, useRef, useEffect } from "react";

const QuestionMarkTooltip = ({ text }) => {
  const [open, setOpen] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    console.log("Tooltip opened:", open);
    function handleClick(e) {
      if (open && modalRef.current && !modalRef.current.contains(e.target)) {
        console.log("Clicked outside, closing tooltip");
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold shadow-sm hover:bg-blue-200 transition outline-none"
        onClick={() => setOpen(true)}
        aria-label="Show info"
      >
        ?
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm"
          tabIndex={-1}
        >
          <div
            ref={modalRef}
            className="bg-white rounded-2xl p-4 max-w-sm shadow-xl text-gray-900 border border-gray-400"
          >
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  console.log("Closing tooltip");
                }}
                className="text-gray-600 hover:text-gray-900 transition"
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
            <div className="mt-2">{text}</div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuestionMarkTooltip;
