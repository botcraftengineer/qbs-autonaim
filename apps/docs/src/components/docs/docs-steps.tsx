import type React from "react";

interface Step {
  title: string;
  content: React.ReactNode;
}

interface DocsStepsProps {
  steps: Step[];
}

export function DocsSteps({ steps }: DocsStepsProps) {
  return (
    <div className="my-6 flex flex-col gap-6">
      {steps.map((step, index) => (
        <div key={`step-${index}-${step.title}`} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className="mt-2 h-full w-px bg-border" />
            )}
          </div>
          <div className="flex-1 pb-6">
            <h4 className="font-semibold text-foreground mb-2">{step.title}</h4>
            <div className="text-sm text-muted-foreground leading-relaxed">
              {step.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
