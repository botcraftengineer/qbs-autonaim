import { Badge, Button } from "@qbs-autonaim/ui";
import { ExternalLink, MapPin } from "lucide-react";

interface VacancyHeaderProps {
  title: string;
  region: string | null;
  url: string | null;
  isActive: boolean | null;
}

export function VacancyHeader({
  title,
  region,
  url,
  isActive,
}: VacancyHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {isActive ? (
              <Badge variant="default" className="h-6">
                Активна
              </Badge>
            ) : (
              <Badge variant="secondary" className="h-6">
                Неактивна
              </Badge>
            )}
          </div>
          {region && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{region}</span>
            </div>
          )}
        </div>
      </div>

      {url && (
        <div>
          <Button variant="outline" size="sm" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Открыть на hh.ru
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
