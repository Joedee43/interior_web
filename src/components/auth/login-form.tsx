"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { login } from "@/lib/auth/api";
import { authFormFailure } from "@/lib/auth/form-errors";
import { loginSchema, type LoginValues } from "@/lib/auth/schemas";
import { setAuthenticatedAccount } from "@/lib/query/client";
import { AuthField } from "./auth-field";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [requestId, setRequestId] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (account) => {
      setAuthenticatedAccount(queryClient, account);
      router.replace(nextPath);
      router.refresh();
    },
  });

  const submit = handleSubmit(async (values) => {
    setRequestId(undefined);
    mutation.reset();
    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      const failure = authFormFailure(error, "login");
      setRequestId(failure.requestId);
      for (const [field, message] of Object.entries(failure.fields)) {
        if (field === "email" || field === "password") {
          setError(field, { type: "server", message });
        }
      }
    }
  });
  const failure = mutation.error
    ? authFormFailure(mutation.error, "login")
    : undefined;

  return (
    <form noValidate onSubmit={submit} className="space-y-5">
      <AuthField
        id="email"
        label="Email address"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <AuthField
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />
      {failure && (
        <div role="alert" className="rounded-xl bg-terracotta/10 p-4 text-sm text-terracotta">
          <p>{failure.message}</p>
          {requestId && <p className="mt-1 font-mono text-xs">Request ID: {requestId}</p>}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-ink/65">
        New to Interior?{" "}
        <Link
          href={`/register?next=${encodeURIComponent(nextPath)}`}
          className="font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}

