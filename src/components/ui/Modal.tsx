import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  headerExtra?: ReactNode;
}

const SIZE_CLASS: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  headerExtra,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const timer = window.setTimeout(() => panelRef.current?.focus(), 20);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-fade-in bg-slate-900/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          "relative z-10 flex max-h-[94dvh] w-full animate-slide-up flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl outline-none sm:max-h-[88dvh] sm:rounded-2xl",
          SIZE_CLASS[size],
        )}
      >
        <div className="flex shrink-0 justify-center pt-2.5 sm:hidden">
          <div className="h-1.5 w-10 rounded-full bg-slate-300" />
        </div>
        <header className="flex shrink-0 items-start gap-3 px-5 pb-4 pt-3 sm:pt-5">
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className="text-xl font-bold leading-snug tracking-tight text-slate-900"
            >
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-1 text-sm leading-snug text-slate-600"
              >
                {description}
              </p>
            ) : null}
          </div>
          {headerExtra}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-1 -mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
          {children}
        </div>
        {footer ? (
          <footer className="shrink-0 border-t border-slate-200 bg-white px-5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] pt-3.5 sm:pb-4">
            {footer}
          </footer>
        ) : (
          <div className="shrink-0 pb-[env(safe-area-inset-bottom)] sm:hidden" />
        )}
      </div>
    </div>,
    document.body,
  );
}
