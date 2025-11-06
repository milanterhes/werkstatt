import { trace } from "@opentelemetry/api";

/**
 * Shared OpenTelemetry tracer instance for service layer instrumentation.
 *
 * This tracer is used across all service functions to create spans
 * that automatically link to the parent Next.js request trace via AsyncLocalStorage.
 */
export const serviceTracer = trace.getTracer("werkstatt-services");
