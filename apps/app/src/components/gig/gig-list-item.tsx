import { Badge } from "@qbs-autonaim/ui";

interface GigListItemProps {
  gig: {
    id: string;
    title: string;
    type: string;
    isActive: boolean;
    responses?: number | null;
  };
  orgSlug: string;
  workspaceSlug: string;
  onDelete?: (gigId: string) => void;
}

function getGigTypeLabel(type: string) {
  const types: Record<string, string> = {
    DEVELOPMENT: "Разработка",
    DESIGN: "Дизайн",
    COPYWRITING: "Копирайтинг",
    MARKETING: "Маркетинг",
    OTHER: "Другое",
  };
  return types[type] || type;
}

export function GigListItem({
  gig,
  orgSlug,
  workspaceSlug,
  onDelete,
}: GigListItemProps) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge variant="secondary" className="text-xs">
              {getGigTypeLabel(gig.type)}
            </Badge>

            <Badge
              variant={gig.isActive ? "default" : "outline"}
              className={`text-xs ${gig.isActive ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}`}
            >
              {gig.isActive ? "Активно" : "Неактивно"}
            </Badge>
          </div>

          <h3 className="font-semibold line-clamp-1">
            {gig.title}
          </h3>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <span>Отклики: {gig.responses || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}