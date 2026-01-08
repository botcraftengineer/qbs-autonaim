"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Progress,
  ScrollArea,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@qbs-autonaim/ui";
import {
  Award,
  Banknote,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Mail,
  MessageSquare,
  Phone,
  Star,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";

type GigResponseDetail = RouterOutputs["gig"]["responses"]["get"];

interface ResponseDetailCardProps {
  response: GigResponseDetail & {
    interviewScoring?: {
      score: number;
      detailedScore: number;
      analysis: string | null;
    } | null;
    conversation?: {
      id: string;
      status: string;
      messages: Array<{
        id: string;
        sender: string;
        content: string;
        contentType: string;
        voiceTranscription: string | null;
        createdAt: Date;
      }>;
    } | null;
  };
  onAccept?: () => void;
  onReject?: () => void;
  onMessage?: () => void;
  isProcessing?: boolean;
}

const STATUS_CONFIG = {
  NEW: { label: "Новый", variant: "default" as const, icon: FileText },
  EVALUATED: {
    label: "Оценен",
    variant: "secondary" as const,
    icon: CheckCircle2,
  },
  INTERVIEW: {
    label: "Интервью",
    variant: "default" as const,
    icon: MessageSquare,
  },
  NEGOTIATION: {
    label: "Переговоры",
    variant: "outline" as const,
    icon: TrendingUp,
  },
  COMPLETED: {
    label: "Завершен",
    variant: "secondary" as const,
    icon: CheckCircle2,
  },
  SKIPPED: {
    label: "Пропущен",
    variant: "destructive" as const,
    icon: XCircle,
  },
};

const HR_STATUS_CONFIG = {
  INVITE: { label: "Пригласить", variant: "default" as const },
  RECOMMENDED: { label: "Рекомендован", variant: "secondary" as const },
  NOT_RECOMMENDED: { label: "Не рекомендован", variant: "outline" as const },
  REJECTED: { label: "Отклонен", variant: "destructive" as const },
  SELECTED: { label: "Выбран", variant: "default" as const },
  CONTRACT_SENT: { label: "Контракт отправлен", variant: "secondary" as const },
  IN_PROGRESS: { label: "В работе", variant: "default" as const },
  DONE: { label: "Выполнено", variant: "secondary" as const },
};

const IMPORT_SOURCE_LABELS = {
  MANUAL: "Вручную",
  KWORK: "Kwork",
  FL_RU: "FL.ru",
  WEBLANCER: "Weblancer",
  UPWORK: "Upwork",
  FREELANCE_RU: "Freelance.ru",
  WEB_LINK: "Веб-ссылка",
};

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatCurrency(amount: number | null, currency: string | null) {
  if (!amount) return "—";
  const currencySymbol =
    currency === "USD" ? "$" : currency === "EUR" ? "€" : "₽";
  return `${amount.toLocaleString("ru-RU")}&nbsp;${currencySymbol}`;
}

export function ResponseDetailCard({
  response,
  onAccept,
  onReject,
  onMessage,
  isProcessing,
}: ResponseDetailCardProps) {
  const statusConfig = STATUS_CONFIG[response.status];
  const StatusIcon = statusConfig.icon;
  const hasScreening = !!response.screening;
  const hasInterviewScoring = !!response.interviewScoring;
  const hasConversation =
    !!response.conversation && response.conversation.messages.length > 0;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 shrink-0">
                <User className="h-8 w-8 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <CardTitle className="text-2xl mb-2">
                  {response.candidateName || response.candidateId}
                </CardTitle>

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(response.respondedAt || response.createdAt)}
                    </span>
                  </div>

                  {response.rating && (
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-foreground">
                        {response.rating}
                      </span>
                    </div>
                  )}

                  {response.importSource &&
                    response.importSource !== "MANUAL" && (
                      <div className="flex items-center gap-1.5">
                        <ExternalLink className="h-4 w-4" />
                        <span>
                          {IMPORT_SOURCE_LABELS[response.importSource]}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Badge variant={statusConfig.variant} className="gap-1.5">
                  <StatusIcon className="h-3.5 w-3.5" />
                  {statusConfig.label}
                </Badge>

                {response.hrSelectionStatus && (
                  <Badge
                    variant={
                      HR_STATUS_CONFIG[response.hrSelectionStatus].variant
                    }
                  >
                    {HR_STATUS_CONFIG[response.hrSelectionStatus].label}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Quick Actions */}
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {onAccept && (
              <Button
                onClick={onAccept}
                disabled={isProcessing}
                size="sm"
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Принять
              </Button>
            )}

            {onMessage && (
              <Button
                onClick={onMessage}
                disabled={isProcessing}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Написать
              </Button>
            )}

            {onReject && (
              <Button
                onClick={onReject}
                disabled={isProcessing}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                Отклонить
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Screening Results */}
      {hasScreening && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Результаты скрининга
            </CardTitle>
            <CardDescription>
              Автоматическая оценка соответствия кандидата требованиям
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Overview */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Общая оценка</span>
                  <span className="text-2xl font-bold">
                    {response.screening.score}/5
                  </span>
                </div>
                <Progress
                  value={(response.screening.score / 5) * 100}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Детальная оценка</span>
                  <span className="text-2xl font-bold">
                    {response.screening.detailedScore}/100
                  </span>
                </div>
                <Progress
                  value={response.screening.detailedScore}
                  className="h-2"
                />
              </div>
            </div>

            <Separator />

            {/* Analysis Details */}
            <div className="space-y-4">
              {response.screening.analysis && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Анализ портфолио
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {response.screening.analysis}
                  </p>
                </div>
              )}

              {response.screening.priceAnalysis && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Анализ цены
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {response.screening.priceAnalysis}
                  </p>
                </div>
              )}

              {response.screening.deliveryAnalysis && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Анализ сроков
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {response.screening.deliveryAnalysis}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interview Scoring Results */}
      {hasInterviewScoring && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Результаты интервью
            </CardTitle>
            <CardDescription>
              Оценка кандидата на основе AI-интервью
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Overview */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Общая оценка</span>
                  <span className="text-2xl font-bold">
                    {response.interviewScoring.score}/5
                  </span>
                </div>
                <Progress
                  value={(response.interviewScoring.score / 5) * 100}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Детальная оценка</span>
                  <span className="text-2xl font-bold">
                    {response.interviewScoring.detailedScore}/100
                  </span>
                </div>
                <Progress
                  value={response.interviewScoring.detailedScore}
                  className="h-2"
                />
              </div>
            </div>

            <Separator />

            {/* Analysis */}
            {response.interviewScoring.analysis && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Анализ интервью
                </h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {response.interviewScoring.analysis}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Card>
        <Tabs defaultValue="proposal" className="w-full">
          <CardHeader className="pb-3">
            <TabsList
              className={cn(
                "grid w-full",
                hasConversation ? "grid-cols-5" : "grid-cols-4",
              )}
            >
              <TabsTrigger value="proposal">Предложение</TabsTrigger>
              <TabsTrigger value="portfolio">Портфолио</TabsTrigger>
              <TabsTrigger value="experience">Опыт</TabsTrigger>
              <TabsTrigger value="contacts">Контакты</TabsTrigger>
              {hasConversation && (
                <TabsTrigger value="dialog">Диалог</TabsTrigger>
              )}
            </TabsList>
          </CardHeader>

          <CardContent>
            {/* Proposal Tab */}
            <TabsContent value="proposal" className="space-y-4 mt-0">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Предложенная цена
                  </div>
                  <div
                    className="text-lg font-semibold"
                    dangerouslySetInnerHTML={{
                      __html: formatCurrency(
                        response.proposedPrice,
                        response.proposedCurrency,
                      ),
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Срок выполнения
                  </div>
                  <div className="text-lg font-semibold">
                    {response.proposedDeliveryDays
                      ? `${response.proposedDeliveryDays} ${response.proposedDeliveryDays === 1 ? "день" : response.proposedDeliveryDays < 5 ? "дня" : "дней"}`
                      : "—"}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Язык резюме
                  </div>
                  <div className="text-lg font-semibold uppercase">
                    {response.resumeLanguage || "RU"}
                  </div>
                </div>
              </div>

              {response.coverLetter && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">
                      Сопроводительное письмо
                    </h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {response.coverLetter}
                    </p>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio" className="space-y-4 mt-0">
              {response.portfolioLinks &&
                response.portfolioLinks.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Ссылки на работы</h4>
                    <div className="space-y-2">
                      {response.portfolioLinks.map((link) => (
                        <Button
                          key={link}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2"
                          asChild
                        >
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span className="truncate">{link}</span>
                          </a>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

              {response.portfolioFileId && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Файл портфолио</h4>
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Скачать портфолио
                  </Button>
                </div>
              )}

              {response.photoFileId && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Фото</h4>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Посмотреть фото
                  </Button>
                </div>
              )}

              {!response.portfolioLinks?.length &&
                !response.portfolioFileId &&
                !response.photoFileId && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Портфолио не предоставлено</p>
                  </div>
                )}
            </TabsContent>

            {/* Experience Tab */}
            <TabsContent value="experience" className="space-y-4 mt-0">
              {response.experience && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Опыт работы</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {response.experience}
                  </p>
                </div>
              )}

              {response.skills && response.skills.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Навыки</h4>
                    <div className="flex flex-wrap gap-2">
                      {response.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {!response.experience &&
                (!response.skills || response.skills.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Информация об опыте не предоставлена</p>
                  </div>
                )}
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="space-y-4 mt-0">
              <div className="grid gap-4 sm:grid-cols-2">
                {response.email && (
                  <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium mb-1">Email</div>
                      <a
                        href={`mailto:${response.email}`}
                        className="text-sm text-primary hover:underline break-all"
                      >
                        {response.email}
                      </a>
                    </div>
                  </div>
                )}

                {response.phone && (
                  <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium mb-1">Телефон</div>
                      <a
                        href={`tel:${response.phone}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {response.phone}
                      </a>
                    </div>
                  </div>
                )}

                {response.telegramUsername && (
                  <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
                    <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium mb-1">Telegram</div>
                      <a
                        href={`https://t.me/${response.telegramUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        @{response.telegramUsername}
                      </a>
                    </div>
                  </div>
                )}

                {response.profileUrl && (
                  <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
                    <ExternalLink className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium mb-1">Профиль</div>
                      <a
                        href={response.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline break-all"
                      >
                        {response.profileUrl}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {response.contacts && typeof response.contacts === "object" && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">
                      Дополнительные контакты
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(response.contacts).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-2 rounded-lg border"
                        >
                          <span className="text-sm font-medium capitalize">
                            {key}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {!response.email &&
                !response.phone &&
                !response.telegramUsername &&
                !response.profileUrl && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Phone className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Контактная информация не предоставлена</p>
                  </div>
                )}
            </TabsContent>

            {/* Dialog Tab */}
            {hasConversation && response.conversation && (
              <TabsContent value="dialog" className="space-y-4 mt-0">
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {response.conversation.messages.map((message) => {
                      const isBot = message.sender === "BOT";
                      const isVoice = message.contentType === "VOICE";

                      return (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-3",
                            isBot ? "flex-row" : "flex-row-reverse",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                              isBot ? "bg-primary/10" : "bg-muted",
                            )}
                          >
                            {isBot ? (
                              <Bot className="h-4 w-4 text-primary" />
                            ) : (
                              <User className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>

                          <div
                            className={cn(
                              "flex-1 space-y-1",
                              isBot ? "items-start" : "items-end",
                            )}
                          >
                            <div
                              className={cn(
                                "inline-block rounded-lg px-4 py-2 max-w-[80%]",
                                isBot
                                  ? "bg-muted text-foreground"
                                  : "bg-primary text-primary-foreground",
                              )}
                            >
                              {isVoice && message.voiceTranscription ? (
                                <div className="space-y-2">
                                  <div className="text-xs opacity-70">
                                    🎤 Голосовое сообщение
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                    {message.voiceTranscription}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                  {message.content}
                                </p>
                              )}
                            </div>
                            <div
                              className={cn(
                                "text-xs text-muted-foreground px-1",
                                isBot ? "text-left" : "text-right",
                              )}
                            >
                              {new Intl.DateTimeFormat("ru-RU", {
                                hour: "2-digit",
                                minute: "2-digit",
                              }).format(new Date(message.createdAt))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            )}
          </CardContent>
        </Tabs>
      </Card>

      {/* Metadata Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Метаданные</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">ID отклика</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {response.id}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Создан</span>
              <span>{formatDate(response.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Обновлен</span>
              <span>{formatDate(response.updatedAt)}</span>
            </div>
            {response.welcomeSentAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Приветствие отправлено
                </span>
                <span>{formatDate(response.welcomeSentAt)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
