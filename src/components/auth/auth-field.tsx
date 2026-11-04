import type { InputHTMLAttributes } from "react";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label: string;
}

export function AuthField({ error, id, label, ...props }: AuthFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="mt-2 h-12 w-full rounded-xl border border-ink/15 bg-canvas px-4 text-base text-ink outline-none transition focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 aria-[invalid=true]:border-terracotta"
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-2 text-sm text-terracotta">
          {error}
        </p>
      )}
    </div>
  );
}

