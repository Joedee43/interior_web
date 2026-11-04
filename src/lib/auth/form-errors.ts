import { ApiError } from "@/lib/api/error";

export interface AuthFormFailure {
  message: string;
  requestId?: string;
  fields: Record<string, string>;
}

export function authFormFailure(
  error: unknown,
  mode: "login" | "register",
): AuthFormFailure {
  if (error instanceof ApiError) {
    if (error.code === "validation_failed") {
      return {
        message: "Check the highlighted fields and try again.",
        requestId: error.requestId,
        fields: error.details ?? {},
      };
    }
    if (mode === "register" && error.code === "email_taken") {
      return {
        message: "An account with this email already exists.",
        requestId: error.requestId,
        fields: { email: "An account with this email already exists" },
      };
    }
    if (mode === "login" && error.code === "invalid_credentials") {
      return {
        message: "Invalid email or password.",
        requestId: error.requestId,
        fields: {},
      };
    }
    if (error.code === "rate_limited") {
      return {
        message: "Too many attempts. Wait a moment and try again.",
        requestId: error.requestId,
        fields: {},
      };
    }
    return {
      message: "The account service could not complete this request.",
      requestId: error.requestId,
      fields: {},
    };
  }
  return {
    message: "The account service could not be reached. Try again.",
    fields: {},
  };
}

