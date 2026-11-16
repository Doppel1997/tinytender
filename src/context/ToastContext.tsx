import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn, uid } from "../lib/utils";

type ToastVariant = "success" | "error" | "info";

interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastItem extends ToastInput {
  id: string;
}

interface ToastContextValue {
  pushToast: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; tile: string }
> = {
  success: { icon: CheckCircle2, tile: "bg-brand-50 text-brand-800" },
  error: { icon: AlertCircle, tile: "bg-red-50 text-red-700" },
  info: { icon: Info, tile: "bg-sky-50 text-sky-700" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: ToastInput) => {
      const id = uid();
      setToasts((current) => [...current.slice(-3), { ...toast, id }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-[80] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end"
      >
        {toasts.map((toast) => {
          const variant = toast.variant ?? "success";
          const styles = VARIANT_STYLES[variant];
          const Icon = styles.icon;
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-xl border border-slate-300 bg-white p-4 shadow-lift"
            >
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
                  styles.tile,
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[15px] font-bold leading-snug text-slate-900">
                  {toast.title}
                </p>
                {toast.description ? (
                  <p className="mt-1 text-sm leading-snug text-slate-600">
                    {toast.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Cerrar notificación"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider.");
  }
  return context;
}
