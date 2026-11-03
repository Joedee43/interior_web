import { ApiError } from "./error";

export async function browserApiFetch<T>(
  path: `/v1/${string}`,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: withJsonAccept(init.headers),
  });

  return readApiResponse<T>(response);
}

export async function readApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw await ApiError.fromResponse(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

function withJsonAccept(headers?: HeadersInit): Headers {
  const result = new Headers(headers);
  if (!result.has("Accept")) {
    result.set("Accept", "application/json");
  }
  return result;
}
