"use client";

import { Card } from "@qbs-autonaim/ui";

interface DocumentSectionProps {
  title: string;
  content: string;
}

export function DocumentSection({ title, content }: DocumentSectionProps) {
  return (
    <Card className="p-3 transition-all duration-300 md:p-4">
      <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:mb-2 md:text-sm">
        {title}
      </h2>
      <div className="whitespace-pre-wrap text-xs leading-relaxed md:text-sm">
        {content}
      </div>
    </Card>
  );
}
