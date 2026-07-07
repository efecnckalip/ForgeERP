import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({
  open = false,
  onClose,
  title = "",
  children,
  footer,
  size = "md",
  closeOnOverlay = true,
}) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    full: "max-w-[95vw]",
  };

  const handleOverlayClick = () => {
    if (closeOnOverlay) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div
        className={`
          w-full
          ${sizes[size] || sizes.md}
          max-h-[90vh]
          overflow-hidden
          rounded-2xl
          border
          border-slate-700
          bg-slate-900
          shadow-2xl
          animate-in
          fade-in
          zoom-in-95
          duration-200
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}

        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}

        <div className="max-h-[65vh] overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer */}

        {footer && (
          <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}