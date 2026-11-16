import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "dangerGhost";

type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand-800 text-white shadow-sm hover:bg-brand-900 active:bg-brand-950",
  secondary:
    "bg-brand-50 text-brand-900 hover:bg-brand-100 active:bg-brand-200/70",
  outline:
    "border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100",
  ghost:
    "text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200/70",
  danger: "bg-red-700 text-white shadow-sm hover:bg-red-800 active:bg-red-900",
  dangerGhost: "text-red-800 hover:bg-red-50 active:bg-red-100",
};

const SIZES: Record<Size, string> = {
  sm: "h-11 gap-2 rounded-lg px-3.5 text-sm",
  md: "h-12 gap-2 rounded-xl px-4 text-[15px]",
  lg: "h-[52px] gap-2 rounded-xl px-5 text-base",
  icon: "h-11 w-11 rounded-xl",
  "icon-sm": "h-10 w-10 rounded-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}
