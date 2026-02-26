import { NextRequest } from "next/server";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function resolveAppBaseUrl(request: NextRequest): string {
  const envBaseUrl =
    process.env.APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (envBaseUrl) {
    return trimTrailingSlash(envBaseUrl);
  }

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol =
    forwardedProto || (process.env.NODE_ENV === "development" ? "http" : "https");
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host") || "";

  if (!host) {
    throw new Error("Cannot resolve app base URL.");
  }

  return `${protocol}://${host}`;
}
