import React, { useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    // Prevent scrolling on background
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Fungsi untuk menghentikan propagasi event
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-center min-h-screen p-1">
        <div
          className="fixed inset-0 bg-black bg-opacity-60 transition-opacity"
          onClick={onClose}
        ></div>

        <div
          ref={modalRef}
          className="relative rounded w-full sm:w-[420px] mx-auto z-[10000] max-h-[85vh] overflow-y-auto bg-white shadow-xl text-black"
          onClick={stopPropagation} // Menghentikan propagasi event pada konten modal
        >
          <button
            onClick={onClose}
            className="absolute top-1 right-1 text-gray-600 p-0.5 hover:bg-gray-200 rounded-full bg-white border border-gray-200 transition-colors z-10"
            aria-label="Close modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <div className="text-sm p-2.5 text-black">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
