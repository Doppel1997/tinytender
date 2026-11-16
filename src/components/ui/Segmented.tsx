import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<SegmentedOption<T>>;
  className?: string;
  ariaLabel?: string;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex w-full items-center gap-1 rounded-xl bg-slate-200/70 p-1",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              "flex h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
              active
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-700 hover:text-slate-900",
            )}
          >
            {Icon ? (
              <Icon
                className={cn(
                  "h-4 w-4",
                  active ? "text-brand-800" : "text-slate-600",
                )}
              />
            ) : null}
            {option.label}
            {typeof option.count === "number" ? (
              <span
                className={cn(
                  "rounded px-1 text-xs font-bold tabular-nums",
                  active
                    ? "bg-brand-50 text-brand-800"
                    : "bg-slate-300/70 text-slate-700",
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
