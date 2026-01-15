import { Button, Card, CardContent } from "@qbs-autonaim/ui";
import { Briefcase, Plus } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  orgSlug: string;
  workspaceSlug: string;
  title?: string;
  description?: string;
  showCreateButton?: boolean;
}

export function EmptyState({
  orgSlug,
  workspaceSlug,
  title = "Нет заданий",
  description = "Создайте первое задание, чтобы начать поиск исполнителей",
  showCreateButton = true,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Briefcase className="h-8 w-8 text-muted-foreground" />
          </div>

          <h3 className="text-lg font-medium mb-2">{title}</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {description}
          </p>

          {showCreateButton && (
            <Button asChild>
              <Link
                href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/create`}
              >
                <Plus className="h-4 w-4 mr-2" />
                Создать задание
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
