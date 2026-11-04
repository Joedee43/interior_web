"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { registerCustomer } from "@/lib/auth/api";
import { authFormFailure } from "@/lib/auth/form-errors";
import { registerSchema, type RegisterValues } from "@/lib/auth/schemas";
import { setAuthenticatedAccount } from "@/lib/query/client";
import { AuthField } from "./auth-field";

export function RegisterForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [requestId, setRequestId] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });
  const mutation = useMutation({
    mutationFn: registerCustomer,
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
      await mutation.mutateAsync({
        full_name: values.fullName,
        email: values.email,
        password: values.password,
      });
    } catch (error) {
      const failure = authFormFailure(error, "register");
      setRequestId(failure.requestId);
      for (const [field, message] of Object.entries(failure.fields)) {
        const formField = field === "full_name" ? "fullName" : field;
        if (formField === "fullName" || formField === "email" || formField === "password") {
          setError(formField, { type: "server", message });
        }
      }
    }
  });
  const failure = mutation.error
    ? authFormFailure(mutation.error, "register")
    : undefined;

  return (
    <form noValidate onSubmit={submit} className="space-y-5">
      <AuthField
        id="full-name"
        label="Full name"
        autoComplete="name"
        error={errors.fullName?.message}
        {...register("fullName")}
      />
      <AuthField
        id="register-email"
        label="Email address"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <AuthField
        id="register-password"
        label="Password"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <AuthField
        id="confirm-password"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      {failure && (
        <div role="alert" className="rounded-xl bg-terracotta/10 p-4 text-sm text-terracotta">
          <p>{failure.message}</p>
          {requestId && <p className="mt-1 font-mono text-xs">Request ID: {requestId}</p>}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-ink/65">
        Already have an account?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(nextPath)}`}
          className="font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

