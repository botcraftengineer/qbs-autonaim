"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";
import { IconCheck, IconCopy, IconExternalLink } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

export default function VacancyDetailPage() {
  const {
    id,
    orgSlug,
    slug: workspaceSlug,
  } = useParams<{
    id: string;
    orgSlug: string;
    slug: string;
  }>();
  const { workspace } = useWorkspace();
  const api = useTRPC();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  const { data, isLoading } = useQuery({
    ...api.freelancePlatforms.getVacancyById.queryOptions({
      id,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id && !!id,
  });

  const { data: shortlistData, isLoading: shortlistLoading } = useQuery({
    ...api.freelancePlatforms.getShortlist.queryOptions({
      vacancyId: id,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id && !!id,
  });

  const shortlist = shortlistData?.candidates ?? [];

  const handleCopyLink = async () => {
    if (!data?.interviewLink?.url) return;

    try {
      await navigator.clipboard.writeText(data.interviewLink.url);
      setCopiedLink(true);
      toast.success("Ссылка скопирована");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Не удалось скопировать ссылку");
    }
  };

  const handleCopyTemplate = async () => {
    if (!data?.vacancy || !data?.interviewLink?.url) return;

    const template = `${data.vacancy.description || data.vacancy.title}

Для отклика пройдите короткое AI-интервью (10–15 минут):
${data.interviewLink.url}

После прохождения интервью мы свяжемся с вами при положительном решении.`;

    try {
      await navigator.clipboard.writeText(template);
      setCopiedTemplate(true);
      toast.success("Шаблон скопирован");
      setTimeout(() => setCopiedTemplate(false), 2000);
    } catch {
      toast.error("Не удалось скопировать шаблон");
    }
  };

  const getPlatformName = (source: string) => {
    const platforms: Record<string, string> = {
      kwork: "Kwork",
      fl: "FL.ru",
      weblancer: "Weblancer",
      upwork: "Upwork",
      freelancer: "Freelancer",
      fiverr: "Fiverr",
      hh: "HeadHunter",
      avito: "Avito",
      superjob: "SuperJob",
    };
    return platforms[source] || source;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Загрузка…</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!data?.vacancy) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Вакансия не найдена</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { vacancy, responseStats, interviewLink } = data;
  const isFreelancePlatform = [
    "kwork",
    "fl",
    "weblancer",
    "upwork",
    "freelancer",
    "fiverr",
  ].includes(vacancy.source);

  return (
    <div className="space-y-4">
      {/* Информация о вакансии */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl md:text-2xl">
                {vacancy.title}
              </CardTitle>
              <CardDescription className="mt-2 flex items-center gap-2">
                <Badge variant="outline">
                  {getPlatformName(vacancy.source)}
                </Badge>
                {vacancy.isActive ? (
                  <Badge variant="default">Активна</Badge>
                ) : (
                  <Badge variant="secondary">Неактивна</Badge>
                )}
              </CardDescription>
            </div>
            {vacancy.url && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={vacancy.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Открыть вакансию на платформе"
                >
                  <IconExternalLink className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline ml-2">На платформе</span>
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {vacancy.description && (
            <div>
              <h3 className="font-semibold mb-2">Описание</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {vacancy.description}
              </p>
            </div>
          )}
          {vacancy.requirements && (
            <div>
              <h3 className="font-semibold mb-2">Требования</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {String(vacancy.requirements)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ссылка на интервью (только для фриланс-платформ) */}
      {isFreelancePlatform && interviewLink && (
        <Card>
          <CardHeader>
            <CardTitle>Ссылка на AI-интервью</CardTitle>
            <CardDescription>
              Добавьте эту ссылку в описание вакансии на фриланс-платформе
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-sm break-all">
                {interviewLink.url}
              </div>
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="min-h-[44px] md:min-h-0 shrink-0"
                aria-label="Скопировать ссылку на интервью"
              >
                {copiedLink ? (
                  <>
                    <IconCheck className="size-4" aria-hidden="true" />
                    Скопировано
                  </>
                ) : (
                  <>
                    <IconCopy className="size-4" aria-hidden="true" />
                    Копировать
                  </>
                )}
              </Button>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-sm">
                Шаблон для описания вакансии
              </h4>
              <p className="text-xs text-muted-foreground mb-2">
                Используйте этот текст при размещении вакансии на фриланс-платформе
              </p>
              <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap mb-2">
                {vacancy.description || vacancy.title}
                {"\n\n"}
                Для отклика пройдите короткое AI-интервью (10–15&nbsp;минут):
                {"\n"}
                {interviewLink.url}
                {"\n\n"}
                После прохождения интервью мы свяжемся с вами при положительном
                решении.
              </div>
              <Button
                onClick={handleCopyTemplate}
                variant="outline"
                size="sm"
                className="min-h-[44px] md:min-h-0"
                aria-label="Скопировать шаблон описания"
              >
                {copiedTemplate ? (
                  <>
                    <IconCheck className="size-4" aria-hidden="true" />
                    Скопировано
                  </>
                ) : (
                  <>
                    <IconCopy className="size-4" aria-hidden="true" />
                    Копировать шаблон
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Статистика откликов */}
      <Card>
        <CardHeader>
          <CardTitle>Статистика откликов</CardTitle>
          <CardDescription>Отклики по источникам импорта</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {responseStats.HH_API}
              </div>
              <div className="text-sm text-muted-foreground">
                Из HeadHunter&nbsp;API
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {responseStats.FREELANCE_MANUAL}
              </div>
              <div className="text-sm text-muted-foreground">
                Импортировано вручную
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {responseStats.FREELANCE_LINK}
              </div>
              <div className="text-sm text-muted-foreground">
                По ссылке на интервью
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Всего откликов: <span className="font-semibold tabular-nums">{responseStats.HH_API + responseStats.FREELANCE_MANUAL + responseStats.FREELANCE_LINK}</span>
          </div>
        </CardContent>
      </Card>

      {/* Секция импорта откликов (только для фриланс-платформ) */}
      {isFreelancePlatform && (
        <Card>
          <CardHeader>
            <CardTitle>Импорт откликов</CardTitle>
            <CardDescription>
              Импортируйте отклики фрилансеров с платформы для AI-анализа
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                asChild
                variant="default"
                className="min-h-[44px] md:min-h-0"
              >
                <Link
                  href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${id}/import`}
                >
                  Импортировать отклики
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Шортлист */}
      <Card>
        <CardHeader>
          <CardTitle>Шортлист кандидатов</CardTitle>
          <CardDescription>
            Лучшие кандидаты по результатам AI-анализа
          </CardDescription>
        </CardHeader>
        <CardContent>
          {shortlistLoading ? (
            <div className="text-sm text-muted-foreground" role="status" aria-live="polite">
              Загрузка…
            </div>
          ) : !shortlist || shortlist.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Шортлист пока пуст
              </p>
              <p className="text-xs text-muted-foreground">
                Импортируйте отклики и проведите интервью для формирования шортлиста
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {shortlist.slice(0, 5).map((candidate, index) => (
                <div
                  key={candidate.responseId}
                  className="flex items-center justify-between rounded-lg border p-3 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div 
                      className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm shrink-0"
                      aria-label={`Место ${index + 1}`}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{candidate.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Оценка:{" "}
                        <span className="font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {candidate.overallScore}
                        </span>
                        /100
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    asChild
                    className="shrink-0 min-h-[44px] md:min-h-0"
                  >
                    <Link
                      href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/responses/${candidate.responseId}`}
                      aria-label={`Посмотреть профиль ${candidate.name}`}
                    >
                      Подробнее
                    </Link>
                  </Button>
                </div>
              ))}
              {shortlist.length > 5 && (
                <Button 
                  variant="outline" 
                  className="w-full min-h-[44px] md:min-h-0" 
                  asChild
                >
                  <Link
                    href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${id}/shortlist`}
                  >
                    Показать всех ({shortlist.length})
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
