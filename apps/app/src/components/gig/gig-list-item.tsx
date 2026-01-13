import { Badge } from "@qbs-autonaim/ui";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

interface GigListItemProps {
  gig: {
    id: string;
    title: string;
    type: string;
    isActive: boolean;
    responses?: number | null;
    views?: number | null;
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
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gig.id}/responses`}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              <span className={`font-medium ${
                (gig.responses || 0) > 0
                  ? (gig.responses || 0) > 5
                    ? "text-green-600"
                    : "text-blue-600"
                  : "text-muted-foreground"
              }`}>
                {gig.responses || 0}
              </span>
              {(gig.views || 0) > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({Math.round(((gig.responses || 0) / (gig.views || 1)) * 100)}%)
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}