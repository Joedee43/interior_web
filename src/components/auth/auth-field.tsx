"use client";

import { useState, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label: string;
}

export function AuthField({
  error,
  id,
  label,
  type,
  className,
  ...props
}: AuthFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const errorId = `${id}-error`;
  const isPasswordField = type === "password";
  const effectiveType = isPasswordField && showPassword ? "text" : type;

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          type={effectiveType}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "h-12 w-full rounded-xl border border-ink/15 bg-canvas px-4 text-base text-ink outline-none transition focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 aria-[invalid=true]:border-terracotta",
            isPasswordField && "pr-12",
            className,
          )}
          {...props}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={
              showPassword
                ? `Hide ${label.toLowerCase()}`
                : `Show ${label.toLowerCase()}`
            }
            aria-pressed={showPassword}
            data-testid={`${id}-toggle-password`}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-ink-muted transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
          >
            {showPassword ? (
              <svg
                className="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
            ) : (
              <svg
                className="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-sm text-terracotta">
          {error}
        </p>
      )}
    </div>
  );
}
