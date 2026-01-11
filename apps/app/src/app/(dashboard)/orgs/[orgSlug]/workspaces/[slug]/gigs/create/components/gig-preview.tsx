"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
} from "@qbs-autonaim/ui";
import {
  Check,
  ChevronRight,
  FileText,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import type { GigDraft } from "./types";
import { gigTypeOptions } from "./types";

interface GigPreviewProps {
  draft: GigDraft;
  showForm: boolean;
  isCreating: boolean;
  onEdit: () => void;
  onCreate: () => void;
  children?: React.ReactNode; // for form
}

export function GigPreview({
  draft,
  showForm,
  isCreating,
  onEdit,
  onCreate,
  children,
}: GigPreviewProps) {
  const typeOption = gigTypeOptions.find((t) => t.value === draft.type);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Предпросмотр</CardTitle>
              <CardDescription>
                Задание формируется в реальном времени
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="gap-2"
          >
            {showForm ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            {showForm ? "Скрыть" : "Редактировать"}
          </Button>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4">
        {!showForm ? (
          <PreviewContent
            draft={draft}
            typeOption={typeOption}
            isCreating={isCreating}
            onCreate={onCreate}
          />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

interface PreviewContentProps {
  draft: GigDraft;
  typeOption: (typeof gigTypeOptions)[number] | undefined;
  isCreating: boolean;
  onCreate: () => void;
}

function PreviewContent({
  draft,
  typeOption,
  isCreating,
  onCreate,
}: PreviewContentProps) {
  const isEmpty = !draft.title && !draft.description;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg">
          {draft.title || (
            <span className="text-muted-foreground italic">
              Название задания…
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary">
            {typeOption?.emoji} {typeOption?.label || "Другое"}
          </Badge>
          {draft.estimatedDuration && (
            <Badge variant="outline">⏱ {draft.estimatedDuration}</Badge>
          )}
        </div>
      </div>

      {draft.description && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">
            Описание
          </h4>
          <p className="text-sm whitespace-pre-wrap">{draft.description}</p>
        </div>
      )}

      {draft.deliverables && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">
            Что нужно сделать
          </h4>
          <p className="text-sm whitespace-pre-wrap">{draft.deliverables}</p>
        </div>
      )}

      {draft.requiredSkills && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">
            Требуемые навыки
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {draft.requiredSkills
              .split(/[,;]/)
              .map((s) => s.trim())
              .filter((s) => s.length > 0)
              .map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
          </div>
        </div>
      )}

      {(draft.budgetMin || draft.budgetMax) && (
        <div className="flex items-center gap-2 pt-2 border-t">
          <span className="text-sm font-medium">💰 Бюджет:</span>
          <span className="text-sm tabular-nums">
            {draft.budgetMin === draft.budgetMax
              ? new Intl.NumberFormat("ru-RU", {
                  style: "currency",
                  currency: "RUB",
                  maximumFractionDigits: 0,
                }).format(draft.budgetMin || 0)
              : `${new Intl.NumberFormat("ru-RU", {
                  style: "currency",
                  currency: "RUB",
                  maximumFractionDigits: 0,
                }).format(draft.budgetMin || 0)} – ${new Intl.NumberFormat(
                  "ru-RU",
                  {
                    style: "currency",
                    currency: "RUB",
                    maximumFractionDigits: 0,
                  },
                ).format(draft.budgetMax || 0)}`}
          </span>
        </div>
      )}

      {isEmpty && (
        <div className="text-center py-8 text-muted-foreground">
          <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>
            Опишите задачу в чате,
            <br />и ТЗ появится здесь
          </p>
        </div>
      )}

      {draft.title && (
        <Button
          onClick={onCreate}
          disabled={isCreating}
          className="w-full mt-4"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Создание…
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Создать задание
            </>
          )}
        </Button>
      )}
    </div>
  );
}
