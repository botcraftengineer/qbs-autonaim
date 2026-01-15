"use client";

import { Button, ScrollArea } from "@qbs-autonaim/ui";
import { FileText, Loader2 } from "lucide-react";
import type { VacancyDocument } from "./types";
import { DocumentSection } from "./document-section";

interface DocumentPreviewProps {
  document: VacancyDocument;
  hasMinimalContent: boolean;
  onSave: () => void;
  isSaving: boolean;
  isGenerating: boolean;
}

export function DocumentPreview({
  document,
  hasMinimalContent,
  onSave,
  isSaving,
  isGenerating,
}: DocumentPreviewProps) {
  const isEmpty =
    !document.title &&
    !document.description &&
    !document.requirements &&
    !document.responsibilities &&
    !document.conditions &&
    !document.bonuses;

  if (isEmpty) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 md:p-8">
        <div className="text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground/50 md:h-12 md:w-12" />
          <h3 className="mt-3 text-base font-medium md:mt-4 md:text-lg">
            Документ пуст
          </h3>
          <p className="mt-1.5 text-xs text-muted-foreground md:mt-2 md:text-sm">
            Начните диалог с ассистентом,
            <br />и документ появится здесь
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <ScrollArea className="flex-1" style={{ overscrollBehavior: "contain" }}>
        <article className="space-y-4 p-4 md:space-y-6 md:p-6">
          {document.title && (
            <header>
              <h1 className="text-xl font-bold md:text-2xl">
                {document.title}
              </h1>
            </header>
          )}

          {/* Структурированный документ вакансии */}
          <div className="space-y-6">
            {document.description && (
              <>
                <DocumentSection
                  title="Описание вакансии"
                  content={document.description}
                />
                <div className="text-center text-muted-foreground text-lg font-light">
                  —
                </div>
              </>
            )}

            {document.requirements && (
              <>
                <DocumentSection
                  title="Требования"
                  content={document.requirements}
                />
                <div className="text-center text-muted-foreground text-lg font-light">
                  —
                </div>
              </>
            )}

            {document.responsibilities && (
              <>
                <DocumentSection
                  title="Обязанности"
                  content={document.responsibilities}
                />
                <div className="text-center text-muted-foreground text-lg font-light">
                  —
                </div>
              </>
            )}

            {(document.conditions || document.bonuses) && (
              <>
                {document.conditions && (
                  <>
                    <DocumentSection
                      title="Условия"
                      content={document.conditions}
                    />
                    <div className="text-center text-muted-foreground text-lg font-light">
                      —
                    </div>
                  </>
                )}
                <DocumentSection
                  title="Премии и другие мотивационные выплаты"
                  content={
                    document.bonuses ||
                    (document.conditions
                      ? "Информация о премиях и мотивационных выплатах будет указана в условиях работы выше."
                      : "Премии и мотивационные выплаты не указаны.")
                  }
                />
              </>
            )}
          </div>

          {/* Дополнительные секции для внутренних нужд */}
          {(document.customBotInstructions ||
            document.customInterviewQuestions) && (
            <div className="mt-8 pt-6 border-t border-muted">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                Дополнительные настройки
              </h3>

              {document.customBotInstructions && (
                <DocumentSection
                  title="Инструкции для бота"
                  content={document.customBotInstructions}
                />
              )}

              {document.customInterviewQuestions && (
                <DocumentSection
                  title="Вопросы для интервью"
                  content={document.customInterviewQuestions}
                />
              )}
            </div>
          )}
        </article>
      </ScrollArea>

      {hasMinimalContent && (
        <div className="border-t p-3 md:p-4">
          <Button
            onClick={onSave}
            disabled={isSaving || isGenerating}
            className="w-full transition-all hover:scale-[1.02] active:scale-[0.98]"
            size="lg"
            style={{ touchAction: "manipulation" }}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Создаю…
              </>
            ) : isGenerating ? (
              "Дождитесь завершения генерации"
            ) : (
              "Создать вакансию"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
