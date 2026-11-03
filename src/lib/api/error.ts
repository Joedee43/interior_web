export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: Record<string, string>;
  request_id?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, string>;
  readonly requestId?: string;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.status = status;
    this.code = payload.code;
    this.details = payload.details;
    this.requestId = payload.request_id;
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    const requestId = response.headers.get("x-request-id") ?? undefined;

    try {
      const body: unknown = await response.json();
      if (isApiErrorEnvelope(body)) {
        return new ApiError(response.status, {
          ...body.error,
          request_id: body.error.request_id ?? requestId,
        });
      }
    } catch {
      // A proxy or infrastructure error may not use the Go API envelope.
    }

    return new ApiError(response.status, {
      code: "unexpected_response",
      message: "The server returned an unexpected response.",
      request_id: requestId,
    });
  }
}

function isApiErrorEnvelope(
  value: unknown,
): value is { error: ApiErrorPayload } {
  if (typeof value !== "object" || value === null || !("error" in value)) {
    return false;
  }
  const error = value.error;
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    "message" in error &&
    typeof error.message === "string"
  );
}
