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
} from "@qbs-autonaim/ui";
import {
  Calendar,
  Clock,
  DollarSign,
  Edit,
  ExternalLink,
  Eye,
  MessageSquare,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import Link from "next/link";

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
  };
  orgSlug: string;
  workspaceSlug: string;
  onEdit?: (gigId: string) => void;
  onDelete?: (gigId: string) => void;
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
}: GigCardProps) {
  const budget = formatBudget(gig.budgetMin, gig.budgetMax);
  const isOverdue = gig.deadline && gig.deadline < new Date();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {getGigTypeLabel(gig.type)}
              </Badge>

              {!gig.isActive && (
                <Badge variant="outline" className="text-xs">
                  Неактивно
                </Badge>
              )}

              {gig.source !== "manual" && (
                <Badge variant="outline" className="text-xs">
                  {gig.source}
                </Badge>
              )}

              {(gig.newResponses || 0) > 0 && (
                <Badge variant="default" className="text-xs">
                  +{gig.newResponses}
                </Badge>
              )}
            </div>

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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
                    Открыть на {gig.source}
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
                <DollarSign className="h-4 w-4" />
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
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{gig.views || 0}</span>
            </div>

            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gig.id}/responses`}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{gig.responses || 0}</span>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
