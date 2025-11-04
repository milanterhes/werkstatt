import type { AppRouter } from "@/server/trpc/router";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

export function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function getTRPCClient() {
  const clientTracer = trace.getTracer("werkstatt-client");

  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson,
        // Include credentials/cookies for authentication
        fetch(url, options) {
          return clientTracer.startActiveSpan(
            "http.fetch.trpc",
            {
              attributes: {
                "http.method": options?.method || "GET",
                "http.url": url.toString(),
              },
            },
            async (span) => {
              try {
                const response = await fetch(url, {
                  ...options,
                  credentials: "include",
                });

                span.setAttribute("http.status_code", response.status);
                span.setAttribute("http.status_text", response.statusText);

                if (!response.ok) {
                  span.setStatus({
                    code: SpanStatusCode.ERROR,
                    message: `HTTP ${response.status}: ${response.statusText}`,
                  });
                }

                return response;
              } catch (error) {
                span.setStatus({
                  code: SpanStatusCode.ERROR,
                  message:
                    error instanceof Error ? error.message : String(error),
                });
                span.recordException(
                  error instanceof Error ? error : new Error(String(error))
                );
                throw error;
              } finally {
                span.end();
              }
            }
          );
        },
      }),
    ],
  });
}
