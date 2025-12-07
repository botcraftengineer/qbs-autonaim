"use client";

import {
  HR_SELECTION_STATUS_LABELS,
  RESPONSE_STATUS_LABELS,
} from "@selectio/db/schema";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
} from "@selectio/ui";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, ExternalLink, User } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { SiteHeader } from "~/components/layout";
import { useTRPC } from "~/trpc/react";

interface ResponseDetailPageProps {
  params: Promise<{ workspaceSlug: string; id: string }>;
}

export default function ResponseDetailPage({
  params,
}: ResponseDetailPageProps) {
  const { workspaceSlug, id } = use(params);
  const trpc = useTRPC();

  const { data: response, isLoading } = useQuery(
    trpc.vacancy.responses.getById.queryOptions({ id }),
  );

  if (isLoading) {
    return (
      <>
        <SiteHeader title="Загрузка..." />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <Skeleton className="h-10 w-40 mb-4" />
                <div className="space-y-6">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!response) {
    return (
      <>
        <SiteHeader title="Не найдено" />
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="text-muted-foreground">Отклик не найден</p>
        </div>
      </>
    );
  }

  return (
    <>
      <SiteHeader
        title={`Отклик от ${response.candidateName || "Кандидата"}`}
      />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <Link href={`/${workspaceSlug}`}>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Назад
                  </Button>
                </Link>
                {response.conversation && (
                  <Link href={`/${workspaceSlug}/chat/${id}`}>
                    <Button variant="default" size="sm">
                      💬 Открыть чат
                    </Button>
                  </Link>
                )}
              </div>

              <div className="space-y-6 md:space-y-8">
                <Card className="shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1.5">
                        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                          <User className="h-5 w-5 shrink-0" />
                          {response.candidateName || "Имя не указано"}
                        </CardTitle>
                        <CardDescription className="text-base">
                          {response.vacancy?.title || "Вакансия"}
                        </CardDescription>
                      </div>
                      {response.screening?.detailedScore !== undefined && (
                        <Badge
                          className="self-start text-sm"
                          variant={
                            response.screening.detailedScore >= 80
                              ? "default"
                              : response.screening.detailedScore >= 60
                                ? "secondary"
                                : "outline"
                          }
                        >
                          Оценка: {response.screening.detailedScore}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    {response.resumeUrl && (
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={response.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Открыть резюме
                          </Button>
                        </Link>
                        {response.resumePdfUrl && (
                          <Link
                            href={response.resumePdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                          >
                            <Button variant="outline" size="sm">
                              <Download className="mr-2 h-4 w-4" />
                              Скачать PDF
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}

                    <Separator />

                    <div className="grid gap-3 text-sm sm:text-base">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-muted-foreground">Статус:</span>
                        <Badge variant="outline">
                          {RESPONSE_STATUS_LABELS[response.status]}
                        </Badge>
                      </div>
                      {response.hrSelectionStatus && (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-muted-foreground">
                            Решение HR:
                          </span>
                          <Badge variant="outline">
                            {
                              HR_SELECTION_STATUS_LABELS[
                                response.hrSelectionStatus
                              ]
                            }
                          </Badge>
                        </div>
                      )}
                      {response.createdAt && (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-muted-foreground">
                            Дата отклика:
                          </span>
                          <span>
                            {new Date(response.createdAt).toLocaleDateString(
                              "ru-RU",
                            )}
                          </span>
                        </div>
                      )}
                      {response.phone && (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-muted-foreground">
                            Телефон:
                          </span>
                          <span className="break-all">{response.phone}</span>
                        </div>
                      )}
                      {response.telegramUsername && (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-muted-foreground">
                            Telegram:
                          </span>
                          <span className="break-all">
                            @{response.telegramUsername}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {response.screening?.analysis && (
                  <Card className="shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl sm:text-2xl">
                        Скрининг резюме
                      </CardTitle>
                      {response.screening.score && (
                        <CardDescription className="text-base">
                          Оценка: {response.screening.score}/5 • Детальная
                          оценка: {response.screening.detailedScore}/100
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div
                        className="prose prose-sm sm:prose-base max-w-none dark:prose-invert [&_span]:inline-block [&_span]:my-1"
                        dangerouslySetInnerHTML={{
                          __html: response.screening.analysis,
                        }}
                      />
                    </CardContent>
                  </Card>
                )}

                {response.conversation?.interviewScoring && (
                  <Card className="shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl sm:text-2xl">
                        Интервью в Telegram
                      </CardTitle>
                      <CardDescription className="text-base">
                        Оценка: {response.conversation.interviewScoring.score}/5
                        • Детальная оценка:{" "}
                        {response.conversation.interviewScoring.detailedScore}
                        /100
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {response.conversation.interviewScoring.analysis && (
                        <div
                          className="prose prose-sm sm:prose-base max-w-none dark:prose-invert mb-6"
                          dangerouslySetInnerHTML={{
                            __html:
                              response.conversation.interviewScoring.analysis,
                          }}
                        />
                      )}

                      {response.conversation.messages &&
                        response.conversation.messages.length > 0 && (
                          <>
                            <Separator className="my-6" />
                            <div className="space-y-4">
                              <h3 className="text-base font-semibold sm:text-lg">
                                История диалога
                              </h3>
                              <div className="space-y-3">
                                {response.conversation.messages.map(
                                  (message) => (
                                    <div
                                      key={message.id}
                                      className={`rounded-lg p-3 sm:p-4 ${
                                        message.sender === "CANDIDATE"
                                          ? "bg-muted/50 ml-0 mr-4 sm:mr-8"
                                          : "bg-primary/5 ml-4 mr-0 sm:ml-8"
                                      }`}
                                    >
                                      <div className="mb-1 flex items-center justify-between gap-2">
                                        <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                                          {message.sender === "CANDIDATE"
                                            ? "Кандидат"
                                            : "Бот"}
                                        </span>
                                        <span className="text-xs text-muted-foreground/70">
                                          {new Date(
                                            message.createdAt,
                                          ).toLocaleString("ru-RU", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                      </div>
                                      <p className="text-sm leading-relaxed sm:text-base">
                                        {message.contentType === "VOICE" &&
                                        message.voiceTranscription
                                          ? `🎤 ${message.voiceTranscription}`
                                          : message.content}
                                      </p>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          </>
                        )}
                    </CardContent>
                  </Card>
                )}

                {response.experience && (
                  <Card className="shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl sm:text-2xl">
                        Резюме
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div
                        className="prose prose-sm sm:prose-base lg:prose-lg max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{
                          __html: response.experience,
                        }}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
