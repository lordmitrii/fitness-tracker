import { useEffect, useRef } from "react";
import useScrollLock from "../hooks/useScrollLock";
import { createPortal } from "react-dom";

const Modal = ({ onRequestClose, children, teleportTo = "modal-root" }) => {
  useScrollLock(true);
  const modalContentRef = useRef();

  const modalRoot = document.getElementById(teleportTo) || document.body;
  useEffect(() => {
    const handleKeyDown = (e) => e.key === "Escape" && onRequestClose?.();
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onRequestClose]);
  

  return createPortal(
    <div className="fixed inset-0 z-40 overflow-hidden h-[100vh]">
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
    </div>,
    modalRoot
  );
};

export default Modal;
