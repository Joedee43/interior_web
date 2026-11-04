"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/api";
import { authFormFailure } from "@/lib/auth/form-errors";
import { clearAuthenticatedState } from "@/lib/query/client";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      clearAuthenticatedState(queryClient);
      router.replace("/");
      router.refresh();
    },
  });
  const failure = mutation.error
    ? authFormFailure(mutation.error, "login")
    : undefined;

  return (
    <div className={compact ? "relative" : undefined}>
      <Button
        variant={compact ? "quiet" : "secondary"}
        size={compact ? "sm" : "md"}
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? "Signing out…" : "Sign out"}
      </Button>
      {failure && (
        <p
          role="alert"
          className={
            compact
              ? "absolute right-0 top-full mt-2 w-64 rounded-xl border border-terracotta/20 bg-canvas p-3 text-xs text-terracotta shadow-lg"
              : "mt-3 text-sm text-terracotta"
          }
        >
          Sign out failed. {failure.requestId && `Request ID: ${failure.requestId}`}
        </p>
      )}
    </div>
  );
}

