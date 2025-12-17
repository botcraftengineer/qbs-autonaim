"use client";

import {
  HR_SELECTION_STATUS_LABELS,
  RESPONSE_STATUS_LABELS,
} from "@qbs-autonaim/db/schema";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
} from "@qbs-autonaim/ui";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Award,
  Briefcase,
  Calendar,
  Download,
  ExternalLink,
  MessageSquare,
  Pause,
  Phone,
  Play,
  Send,
  User,
} from "lucide-react";
import Link from "next/link";
import { use, useRef, useState } from "react";
import { SiteHeader } from "~/components/layout";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useTRPC } from "~/trpc/react";

interface ResponseDetailPageProps {
  params: Promise<{ workspaceSlug: string; id: string }>;
}

function SafeHtml({ html, className }: { html: string; className?: string }) {
  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
  );
}

function VoicePlayer({ url, duration }: { url: string; duration: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(() => false);
    setCurrentTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={togglePlay}
        aria-label={
          isPlaying
            ? "Приостановить голосовое сообщение"
            : "Воспроизвести голосовое сообщение"
        }
        aria-pressed={isPlaying}
        className="h-8 w-8 shrink-0 p-0"
      >
        {isPlaying ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
      </Button>
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">
          🎤 Голосовое сообщение
          {audioDuration > 0 && (
            <span className="ml-2">
              {formatTime(currentTime)} / {formatTime(audioDuration)}
            </span>
          )}
          {!audioDuration && duration && (
            <span className="ml-2">{duration}</span>
          )}
        </div>
      </div>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
        aria-label="Аудио голосового сообщения"
      >
        <track kind="captions" />
      </audio>
    </div>
  );
}

export default function ResponseDetailPage({
  params,
}: ResponseDetailPageProps) {
  const { workspaceSlug, id } = use(params);
  const trpc = useTRPC();
  const { workspaceId } = useWorkspaceContext();

  const { data: response, isLoading } = useQuery({
    ...trpc.vacancy.responses.get.queryOptions({
      id,
      workspaceId: workspaceId ?? "",
    }),
    enabled: Boolean(workspaceId),
  });

  if (!workspaceId) {
    return (
      <>
        <SiteHeader title="Ошибка" />
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="text-muted-foreground">
            Рабочее пространство не найдено
          </p>
        </div>
      </>
    );
  }

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getAvatarUrl = (name: string) => {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=3b82f6,8b5cf6,ec4899,f59e0b,10b981`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

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
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Открыть чат
                    </Button>
                  </Link>
                )}
              </div>

              <div className="space-y-6 md:space-y-8">
                <Card className="border-2 shadow-lg">
                  <CardHeader className="pb-6">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-4">
                        <Avatar className="h-16 w-16 border-2 border-primary/10 sm:h-20 sm:w-20">
                          <AvatarImage
                            src={getAvatarUrl(
                              response.candidateName || "Кандидат",
                            )}
                            alt={response.candidateName || "Кандидат"}
                          />
                          <AvatarFallback className="bg-primary/10 text-lg font-semibold">
                            {getInitials(response.candidateName || "Кандидат")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                          <CardTitle className="text-2xl sm:text-3xl">
                            {response.candidateName || "Имя не указано"}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 text-base">
                            <Briefcase className="h-4 w-4" />
                            {response.vacancy?.title || "Вакансия"}
                          </CardDescription>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="gap-1">
                              {RESPONSE_STATUS_LABELS[response.status]}
                            </Badge>
                            {response.hrSelectionStatus && (
                              <Badge variant="secondary" className="gap-1">
                                {
                                  HR_SELECTION_STATUS_LABELS[
                                    response.hrSelectionStatus
                                  ]
                                }
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {response.screening?.detailedScore !== undefined && (
                        <div className="flex flex-col items-start gap-2 sm:items-end">
                          <div className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Общая оценка
                            </span>
                          </div>
                          <div
                            className={`text-4xl font-bold ${getScoreColor(response.screening.detailedScore)}`}
                          >
                            {response.screening.detailedScore}
                            <span className="text-2xl text-muted-foreground">
                              /100
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-0">
                    <Separator />

                    <div className="grid gap-4 sm:grid-cols-2">
                      {response.phone && (
                        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Phone className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">
                              Телефон
                            </p>
                            <p className="truncate font-medium">
                              {response.phone}
                            </p>
                          </div>
                        </div>
                      )}
                      {response.telegramUsername && (
                        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Send className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">
                              Telegram
                            </p>
                            <p className="truncate font-medium">
                              @{response.telegramUsername}
                            </p>
                          </div>
                        </div>
                      )}
                      {response.createdAt && (
                        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">
                              Дата отклика
                            </p>
                            <p className="truncate font-medium">
                              {new Date(response.createdAt).toLocaleDateString(
                                "ru-RU",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {response.resumeUrl && (
                      <>
                        <Separator />
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
                      </>
                    )}
                  </CardContent>
                </Card>

                {response.screening?.analysis && (
                  <Card className="border-2 shadow-md">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                            <Award className="h-6 w-6 text-primary" />
                            Скрининг резюме
                          </CardTitle>
                          {response.screening.score && (
                            <CardDescription className="text-base">
                              Оценка: {response.screening.score}/5
                            </CardDescription>
                          )}
                        </div>
                        {response.screening.detailedScore !== undefined && (
                          <Badge
                            variant={getScoreBadgeVariant(
                              response.screening.detailedScore,
                            )}
                            className="text-base px-3 py-1"
                          >
                            {response.screening.detailedScore}/100
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <SafeHtml
                        html={response.screening.analysis}
                        className="prose prose-sm sm:prose-base max-w-none dark:prose-invert [&_span]:inline-block [&_span]:my-1"
                      />
                    </CardContent>
                  </Card>
                )}

                {response.conversation?.interviewScoring && (
                  <Card className="border-2 shadow-md">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                            <MessageSquare className="h-6 w-6 text-primary" />
                            Интервью в Telegram
                          </CardTitle>
                          <CardDescription className="text-base">
                            Оценка:{" "}
                            {response.conversation.interviewScoring.score}/5
                          </CardDescription>
                        </div>
                        {response.conversation.interviewScoring
                          .detailedScore !== undefined && (
                          <Badge
                            variant={getScoreBadgeVariant(
                              response.conversation.interviewScoring
                                .detailedScore,
                            )}
                            className="text-base px-3 py-1"
                          >
                            {
                              response.conversation.interviewScoring
                                .detailedScore
                            }
                            /100
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {response.conversation.interviewScoring.analysis && (
                        <SafeHtml
                          html={response.conversation.interviewScoring.analysis}
                          className="prose prose-sm sm:prose-base max-w-none dark:prose-invert mb-6"
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
                                  (message) => {
                                    const senderName =
                                      message.sender === "CANDIDATE"
                                        ? response.candidateName
                                          ? response.candidateName
                                              .split(" ")
                                              .slice(0, 2)
                                              .join(" ")
                                          : "Кандидат"
                                        : response.vacancy?.workspace?.name ||
                                          "Бот";

                                    const isCandidate =
                                      message.sender === "CANDIDATE";

                                    return (
                                      <div
                                        key={message.id}
                                        className={`flex gap-3 ${
                                          isCandidate
                                            ? "flex-row"
                                            : "flex-row-reverse"
                                        }`}
                                      >
                                        <Avatar className="h-8 w-8 shrink-0 border sm:h-10 sm:w-10">
                                          <AvatarImage
                                            src={getAvatarUrl(senderName)}
                                            alt={senderName}
                                          />
                                          <AvatarFallback className="text-xs">
                                            {getInitials(senderName)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div
                                          className={`flex-1 space-y-1 ${
                                            isCandidate
                                              ? "mr-4 sm:mr-12"
                                              : "ml-4 sm:ml-12"
                                          }`}
                                        >
                                          <div
                                            className={`flex items-center gap-2 ${
                                              isCandidate
                                                ? "flex-row"
                                                : "flex-row-reverse"
                                            }`}
                                          >
                                            <span className="text-xs font-semibold sm:text-sm">
                                              {senderName}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
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
                                          <div
                                            className={`rounded-2xl border-2 p-3 sm:p-4 ${
                                              isCandidate
                                                ? "bg-muted/50 border-muted"
                                                : "bg-primary/5 border-primary/20"
                                            }`}
                                          >
                                            {message.contentType === "VOICE" ? (
                                              <div className="space-y-2">
                                                {"voiceUrl" in message &&
                                                message.voiceUrl ? (
                                                  <VoicePlayer
                                                    url={message.voiceUrl}
                                                    duration={
                                                      message.voiceDuration ||
                                                      ""
                                                    }
                                                  />
                                                ) : null}
                                                {message.voiceTranscription ? (
                                                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                                                    {message.voiceTranscription}
                                                  </p>
                                                ) : !("voiceUrl" in message) ||
                                                  !message.voiceUrl ? (
                                                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                                                    Аудиозапись недоступна
                                                  </p>
                                                ) : null}
                                              </div>
                                            ) : (
                                              <p className="text-sm leading-relaxed sm:text-base">
                                                {message.content}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          </>
                        )}
                    </CardContent>
                  </Card>
                )}

                {response.experience && (
                  <Card className="border-2 shadow-md">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                        <Briefcase className="h-6 w-6 text-primary" />
                        Резюме
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <SafeHtml
                        html={response.experience}
                        className="prose prose-sm sm:prose-base lg:prose-lg max-w-none dark:prose-invert [&_p]:leading-relaxed [&_p]:mb-3"
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
