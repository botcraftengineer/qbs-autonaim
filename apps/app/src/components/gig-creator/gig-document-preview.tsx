"use client";

import { Button, Card, ScrollArea } from "@qbs-autonaim/ui";
import { FileText, Loader2 } from "lucide-react";

interface GigDocument {
  title?: string;
  description?: string;
  deliverables?: string;
  requiredSkills?: string;
  budgetRange?: string;
  timeline?: string;
}

interface GigDocumentPreviewProps {
  document: GigDocument;
  onGigCreated?: () => void;
  isCreating?: boolean;
}

export function GigDocumentPreview({
  document,
  onGigCreated,
  isCreating = false,
}: GigDocumentPreviewProps) {
  const isEmpty =
    !document.title &&
    !document.description &&
    !document.deliverables &&
    !document.requiredSkills &&
    !document.budgetRange &&
    !document.timeline;

  const hasMinimalContent = !!document.title;

  if (isEmpty) {
    return (
      <output
        className="flex h-full items-center justify-center p-8"
        aria-label="Документ пуст"
      >
        <div className="text-center">
          <FileText
            className="mx-auto h-12 w-12 text-muted-foreground/50"
            aria-hidden="true"
          />
          <h3 className="mt-4 text-lg font-medium">Документ пуст</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Начните описывать задание в чате,
            <br />и документ будет формироваться автоматически
          </p>
        </div>
      </output>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1">
        <article className="space-y-6 p-6">
          {document.title && (
            <header>
              <h1 className="min-w-0 wrap-break-word text-3xl font-bold">
                {document.title}
              </h1>
            </header>
          )}

          {document.description && (
            <Card className="p-4">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Описание проекта
              </h2>
              <div className="min-w-0 wrap-break-word whitespace-pre-wrap text-sm leading-relaxed">
                {document.description}
              </div>
            </Card>
          )}

          {document.deliverables && (
            <Card className="p-4">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Что нужно сделать
              </h2>
              <div className="min-w-0 wrap-break-word whitespace-pre-wrap text-sm leading-relaxed">
                {document.deliverables}
              </div>
            </Card>
          )}

          {document.requiredSkills && (
            <Card className="p-4">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Требуемые навыки
              </h2>
              <div className="min-w-0 wrap-break-word whitespace-pre-wrap text-sm leading-relaxed">
                {document.requiredSkills}
              </div>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {document.budgetRange && (
              <Card className="p-4">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Бюджет
                </h2>
                <div className="min-w-0 wrap-break-word text-sm font-medium tabular-nums">
                  {document.budgetRange}
                </div>
              </Card>
            )}

            {document.timeline && (
              <Card className="p-4">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Сроки
                </h2>
                <div className="min-w-0 wrap-break-word text-sm font-medium">
                  {document.timeline}
                </div>
              </Card>
            )}
          </div>
        </article>
      </ScrollArea>

      {hasMinimalContent && onGigCreated && (
        <div className="border-t p-4">
          <Button
            onClick={onGigCreated}
            disabled={isCreating}
            className="w-full"
            size="lg"
            style={{ touchAction: "manipulation" }}
            aria-label="Создать задание из сгенерированного документа"
          >
            {isCreating ? (
              <>
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                Создаю задание…
              </>
            ) : (
              "Создать задание"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
