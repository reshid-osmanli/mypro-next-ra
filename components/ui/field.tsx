"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type FieldProps = {
  label?: string;
  error?: string | null;
  hint?: string;
  className?: string;
  inputClassName?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

/**
 * KUTUBI Input — quiet, clean, accessible.
 * h-11, radius-sm, 2px brand ring on focus, inline error (no shake).
 */
export function Field({
  label,
  error,
  hint,
  className,
  inputClassName,
  id,
  ...rest
}: FieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const errorId = `${fieldId}-error`;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <label htmlFor={fieldId} className="block text-body-sm font-semibold text-ink">
          {label}
        </label>
      ) : null}
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "h-11 w-full rounded-sm border border-line bg-surface px-4 text-body text-ink",
          "outline-none transition-colors duration-instant",
          "placeholder:text-ink-faint",
          "focus:border-brand focus:ring-2 focus:ring-brand/25",
          error && "border-accent-danger focus:border-accent-danger focus:ring-accent-danger/20",
          inputClassName
        )}
        {...rest}
      />
      {error ? (
        <p id={errorId} className="text-caption text-accent-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-caption text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}
