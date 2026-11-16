import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface SectionCardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: SectionCardProps) {
  return (
    <section className={cn("card overflow-hidden", className)}>
      <header className="flex items-start justify-between gap-3 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold leading-snug tracking-tight text-slate-900">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm leading-snug text-slate-600">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className={cn("px-4 pb-4 sm:px-5 sm:pb-5", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 text-center",
        compact ? "py-7" : "py-10",
        className,
      )}
    >
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-slate-600 ring-1 ring-slate-200">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-3 text-base font-bold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-[300px] text-sm leading-relaxed text-slate-600">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
