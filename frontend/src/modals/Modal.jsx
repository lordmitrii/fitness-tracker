import { useEffect, useRef } from "react";
import useScrollLock from "../hooks/useScrollLock";

const Modal = ({ onRequestClose, children }) => {
  useScrollLock(true);
  const modalContentRef = useRef();

  useEffect(() => {
    const handleKeyDown = (e) => e.key === "Escape" && onRequestClose?.();
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onRequestClose]);

  return (
    <div className="fixed inset-0 z-40 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/10 backdrop-blur-sm animate-fade-in"
        onClick={onRequestClose}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <div
          ref={modalContentRef}
          className="relative bg-white rounded-xl shadow-xl p-6 mx-2 max-w-3xl w-full max-h-[90vh] modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
