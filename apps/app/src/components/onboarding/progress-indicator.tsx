interface ProgressIndicatorProps {
  currentStep: "organization" | "workspace";
}

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  return (
    <div
      className="flex items-center justify-center gap-2"
      role="progressbar"
      aria-label="Прогресс онбординга"
    >
      <div
        className={`h-2 w-16 rounded-full transition-colors ${
          currentStep === "organization" ? "bg-primary" : "bg-primary/30"
        }`}
        aria-label="Шаг 1: Организация"
      />
      <div
        className={`h-2 w-16 rounded-full transition-colors ${
          currentStep === "workspace" ? "bg-primary" : "bg-muted"
        }`}
        aria-label="Шаг 2: Воркспейс"
      />
    </div>
  );
}
