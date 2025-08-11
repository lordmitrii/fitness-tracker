import { useState, useRef, useEffect } from "react";
import CloseIcon from "../../icons/CloseIcon";

const QuestionMarkTooltipModal = ({ text }) => {
  const [open, setOpen] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (open && modalRef.current && !modalRef.current.contains(e.target)) {
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
            className="bg-white rounded-2xl p-4 mx-2 max-w-3xl shadow-xl text-gray-900 border border-gray-400"
          >
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-700 hover:text-gray-900 transition"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="mt-2">{text}</div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuestionMarkTooltipModal;
