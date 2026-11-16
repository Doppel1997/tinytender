import type { ReactNode } from "react";
import { Store } from "lucide-react";
import { cn } from "../../lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  eyebrow?: string;
}
export function PageHeader({ title, subtitle, actions, eyebrow }: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 md:mb-6">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-[13px] font-semibold text-brand-800">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-[27px] font-extrabold leading-tight tracking-tight text-slate-900 md:text-[31px]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 max-w-xl text-[15px] leading-relaxed text-slate-600">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ size = "md", className }: LogoProps) {
  const box = {
    sm: "h-8 w-8 rounded-lg",
    md: "h-9 w-9 rounded-lg",
    lg: "h-11 w-11 rounded-xl",
  }[size];
  const icon = {
    sm: "h-[18px] w-[18px]",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }[size];
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center bg-brand-800",
        box,
        className,
      )}
    >
      <Store className={cn("text-brand-50", icon)} strokeWidth={2} />
    </span>
  );
}
