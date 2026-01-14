import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Progress,
} from "@qbs-autonaim/ui";
import {
  Calendar,
  Clock,
  Copy,
  Edit,
  ExternalLink,
  Eye,
  MessageSquare,
  MoreHorizontal,
  Power,
  RefreshCw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
// Импортируем только функцию, без зависимостей от DB
const getPlatformDisplayName = (source: string) => {
  const names: Record<string, string> = {
    MANUAL: 'Ручной ввод',
    KWORK: 'KWork',
    FL_RU: 'FL.ru',
    FREELANCE_RU: 'Freelance.ru',
    HABR: 'Habr Freelance',
    AVITO: 'Avito',
    SUPERJOB: 'SuperJob',
    WEB_LINK: 'Другая платформа',
    TELEGRAM: 'Telegram'
  };
  return names[source as keyof typeof names] || source;
};

interface GigCardProps {
  gig: {
    id: string;
    title: string;
    description?: string | null;
    type: string;
    budgetMin?: number | null;
    budgetMax?: number | null;

    deadline?: Date | null;
    estimatedDuration?: string | null;
    views?: number | null;
    responses?: number | null;
    newResponses?: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    url?: string | null;
    source: string;
    externalId?: string | null;
  };
  orgSlug: string;
  workspaceSlug: string;
  onEdit?: (gigId: string) => void;
  onDelete?: (gigId: string) => void;
  onDuplicate?: (gigId: string) => void;
  onToggleActive?: (gigId: string) => void;
  onSyncResponses?: (gigId: string) => void;
}

function formatBudget(min?: number | null, max?: number | null) {
  if (!min && !max) return null;

  const curr = "₽";
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("ru-RU").format(amount);
  };

  if (min && max) {
    return `${formatAmount(min)} - ${formatAmount(max)} ${curr}`;
  }

  if (min) {
    return `от ${formatAmount(min)} ${curr}`;
  }

  if (max) {
    return `до ${formatAmount(max)} ${curr}`;
  }

  return null;
}

function formatDate(date: Date) {
  const now = new Date();
  const diffInDays = Math.floor(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffInDays === 0) {
    return "Сегодня";
  } else if (diffInDays === 1) {
    return "Завтра";
  } else if (diffInDays === -1) {
    return "Вчера";
  } else if (diffInDays > 0 && diffInDays <= 7) {
    return `Через ${diffInDays} дн.`;
  } else if (diffInDays < 0 && diffInDays >= -7) {
    return `${Math.abs(diffInDays)} дн. назад`;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function getGigTypeLabel(type: string) {
  const types: Record<string, string> = {
    DEVELOPMENT: "Разработка",
    DESIGN: "Дизайн",
    COPYWRITING: "Копирайтинг",
    MARKETING: "Маркетинг",
    TRANSLATION: "Перевод",
    VIDEO: "Видео",
    AUDIO: "Аудио",
    DATA_ENTRY: "Ввод данных",
    RESEARCH: "Исследования",
    CONSULTING: "Консультации",
    OTHER: "Другое",
  };

  return types[type] || type;
}

export function GigCard({
  gig,
  orgSlug,
  workspaceSlug,
  onDelete,
  onDuplicate,
  onToggleActive,
}: GigCardProps) {
  const budget = formatBudget(gig.budgetMin, gig.budgetMax);
  const isOverdue = gig.deadline && gig.deadline < new Date();

  // Определяем срочность по дедлайну
  const getUrgencyClass = () => {
    if (!gig.deadline || !gig.isActive) return "";

    const now = new Date();
    const deadline = new Date(gig.deadline);
    const diffInHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (isOverdue) return "border-red-300 bg-red-50/50";
    if (diffInHours <= 24) return "border-orange-300 bg-orange-50/50";
    if (diffInHours <= 72) return "border-yellow-300 bg-yellow-50/50";
    return "";
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${getUrgencyClass()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {getGigTypeLabel(gig.type)}
              </Badge>

              <Badge
                variant={gig.isActive ? "default" : "outline"}
                className={`text-xs ${gig.isActive ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}`}
              >
                {gig.isActive ? "Активно" : "Неактивно"}
              </Badge>

              {gig.source !== "MANUAL" && gig.source !== "WEB_LINK" && (
                <Badge variant="outline" className="text-xs">
                  {getPlatformDisplayName(gig.source)}
                </Badge>
              )}

              {(gig.newResponses || 0) > 0 && (
                <Badge
                  variant="default"
                  className="text-xs bg-orange-100 text-orange-800 hover:bg-orange-200"
                >
                  +{gig.newResponses} новых
                </Badge>
              )}
            </div>

            {(gig.newResponses || 0) > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Новые отклики</span>
                  <span>
                    {gig.newResponses}/{gig.responses || 0}
                  </span>
                </div>
                <Progress
                  value={
                    ((gig.newResponses || 0) /
                      Math.max(gig.responses || 1, 1)) *
                    100
                  }
                  className="h-1.5"
                />
              </div>
            )}

            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gig.id}`}
              className="block"
            >
              <CardTitle className="text-lg hover:text-primary transition-colors line-clamp-2">
                {gig.title}
              </CardTitle>
            </Link>

            <CardDescription className="text-sm">
              Создано {formatDate(gig.createdAt)}
              {gig.updatedAt && gig.updatedAt !== gig.createdAt && (
                <> • Обновлено {formatDate(gig.updatedAt)}</>
              )}
            </CardDescription>
          </div>

          <div className="flex items-center gap-1">
            {/* Быстрые действия */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => onToggleActive?.(gig.id)}
              title={gig.isActive ? "Деактивировать" : "Активировать"}
            >
              <Power
                className={`h-4 w-4 ${gig.isActive ? "text-green-600" : "text-gray-400"}`}
              />
            </Button>

            {gig.url && gig.externalId && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => onSyncResponses?.(gig.id)}
                title="Синхронизировать отклики"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => onDuplicate?.(gig.id)}
              title="Дублировать задание"
            >
              <Copy className="h-4 w-4" />
            </Button>

            {/* Меню дополнительных действий */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Открыть меню</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gig.id}`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Посмотреть
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gig.id}/edit`}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Редактировать
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gig.id}/responses`}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Отклики ({gig.responses || 0})
                  </Link>
                </DropdownMenuItem>
                {gig.url && (
                  <DropdownMenuItem asChild>
                    <a href={gig.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Открыть на {getPlatformDisplayName(gig.source)}
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete?.(gig.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {gig.description && (
        <CardContent className="pt-0 pb-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {gig.description}
          </p>
        </CardContent>
      )}

      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {budget && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="font-medium text-foreground">{budget}</span>
              </div>
            )}

            {gig.estimatedDuration && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{gig.estimatedDuration}</span>
              </div>
            )}

            {gig.deadline && (
              <div
                className={`flex items-center gap-1 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}
              >
                <Calendar className="h-4 w-4" />
                <span>{formatDate(gig.deadline)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-muted-foreground">
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gig.id}/responses`}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              <span
                className={`font-medium ${
                  (gig.responses || 0) > 0
                    ? (gig.responses || 0) > 5
                      ? "text-green-600"
                      : "text-blue-600"
                    : "text-muted-foreground"
                }`}
              >
                {gig.responses || 0}
              </span>
              {(gig.views || 0) > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({Math.round(((gig.responses || 0) / (gig.views || 1)) * 100)}
                  %)
                </span>
              )}
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
