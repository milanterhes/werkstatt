import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { registerOTel } from "@vercel/otel";

export function register() {
  const traceExporter = new OTLPTraceExporter({
    url: `https://${process.env.INGESTING_HOST}/v1/traces`,
    headers: {
      Authorization: `Bearer ${process.env.SOURCE_TOKEN}`,
    },
  });

  registerOTel({ serviceName: "werkstatt", traceExporter });
}
