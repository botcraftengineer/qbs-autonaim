"use client";

import { Card, ScrollArea } from "@qbs-autonaim/ui";
import { FileText } from "lucide-react";

interface VacancyDocument {
  title?: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  conditions?: string;
}

interface VacancyDocumentPreviewProps {
  document: VacancyDocument;
}

export function VacancyDocumentPreview({
  document,
}: VacancyDocumentPreviewProps) {
  const isEmpty =
    !document.title &&
    !document.description &&
    !document.requirements &&
    !document.responsibilities &&
    !document.conditions;

  if (isEmpty) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <FileText
            className="mx-auto h-12 w-12 text-muted-foreground/50"
            aria-hidden="true"
          />
          <h3 className="mt-4 text-lg font-medium">Документ пуст</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Начните описывать вакансию в чате,
            <br />и документ будет формироваться автоматически
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-6">
        {document.title && (
          <div>
            <h1 className="text-3xl font-bold">{document.title}</h1>
          </div>
        )}

        {document.description && (
          <Card className="p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              О компании
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {document.description}
            </p>
          </Card>
        )}

        {document.responsibilities && (
          <Card className="p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Обязанности
            </h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {document.responsibilities}
            </div>
          </Card>
        )}

        {document.requirements && (
          <Card className="p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Требования
            </h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {document.requirements}
            </div>
          </Card>
        )}

        {document.conditions && (
          <Card className="p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Условия
            </h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {document.conditions}
            </div>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}
