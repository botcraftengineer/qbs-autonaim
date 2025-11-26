import { LangfuseSpanProcessor, type ShouldExportSpan } from "@langfuse/otel";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

// Фильтруем spans - отправляем только AI-запросы
const shouldExportSpan: ShouldExportSpan = ({ otelSpan }) => {
  const scopeName = otelSpan.instrumentationScope.name;
  // Экспортируем только spans от AI SDK
  return scopeName === "ai";
};

export const langfuseSpanProcessor = new LangfuseSpanProcessor({
  shouldExportSpan,
});

const tracerProvider = new NodeTracerProvider({
  spanProcessors: [langfuseSpanProcessor],
});

tracerProvider.register();

console.log("✅ Langfuse OpenTelemetry инициализирован");
