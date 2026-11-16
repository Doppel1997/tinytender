import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

const inputBase =
  "w-full rounded-xl border border-slate-300 bg-white text-base text-slate-900 shadow-sm transition placeholder:text-slate-500 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-600";

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  optional,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={htmlFor}
        className="flex flex-wrap items-baseline gap-x-1.5 text-sm font-semibold text-slate-800"
      >
        {label}
        {required ? <span className="text-red-700">*</span> : null}
        {optional ? (
          <span className="text-[13px] font-medium text-slate-500">
            (opcional)
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="text-[13px] font-semibold leading-snug text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] leading-snug text-slate-600">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBase, "h-12 px-3.5", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(inputBase, "min-h-[84px] resize-none px-3.5 py-3", className)}
      {...props}
    />
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  containerClassName?: string;
}

export function Select({
  className,
  containerClassName,
  children,
  ...props
}: SelectProps) {
  return (
    <div className={cn("relative w-full", containerClassName)}>
      <select
        className={cn(
          inputBase,
          "h-12 appearance-none px-3.5 pr-10 text-base",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-600" />
    </div>
  );
}

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
        checked ? "bg-brand-700" : "bg-slate-400",
      )}
    >
      <span
        className={cn(
          "inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-[30px]" : "translate-x-1",
        )}
      />
    </button>
  );
}
