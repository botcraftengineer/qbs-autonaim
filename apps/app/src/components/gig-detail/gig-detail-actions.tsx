import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
} from "@qbs-autonaim/ui";
import { Bot, Edit, MessageSquare, Share2 } from "lucide-react";
import Link from "next/link";

interface GigDetailActionsProps {
  gig: {
    title: string;
  };
  orgSlug: string;
  workspaceSlug: string;
  gigId: string;
  responseCounts?: { total: number; new: number } | null;
  onShare: () => void;
  onOpenAIChat: () => void;
}

export function GigDetailActions({
  gig: _gig,
  orgSlug,
  workspaceSlug,
  gigId,
  responseCounts,
  onShare,
  onOpenAIChat,
}: GigDetailActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Действия</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Button
            className="w-full min-h-[44px] touch-action-manipulation bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            onClick={onOpenAIChat}
          >
            <Bot className="h-4 w-4 mr-2" aria-hidden="true" />
            AI Помощник
            <span className="ml-auto text-xs opacity-75">Новинка</span>
          </Button>

          <Button
            asChild
            variant="default"
            className="w-full min-h-[44px] touch-action-manipulation hover:shadow-lg transition-all duration-200 group"
          >
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/responses`}
            >
              <MessageSquare
                className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200"
                aria-hidden="true"
              />
              <span className="flex-1 text-left">Посмотреть отклики</span>
              <div className="flex items-center gap-2 ml-auto">
                {responseCounts?.total !== undefined && (
                  <Badge
                    variant="secondary"
                    className="bg-white/15 text-white/90 hover:bg-white/25 transition-colors"
                  >
                    {responseCounts.total}
                  </Badge>
                )}
                {responseCounts?.new !== undefined &&
                  responseCounts.new > 0 && (
                    <Badge
                      variant="destructive"
                      className="bg-orange-500 hover:bg-orange-600 text-white animate-pulse shadow-sm"
                    >
                      +{responseCounts.new}
                    </Badge>
                  )}
              </div>
            </Link>
          </Button>
        </div>

        <Separator />

        <div className="space-y-2">
          <Button
            variant="outline"
            asChild
            className="w-full min-h-[44px] touch-action-manipulation"
          >
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/edit`}
            >
              <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
              Редактировать задание
            </Link>
          </Button>

          <Button
            variant="outline"
            className="w-full min-h-[44px] touch-action-manipulation"
            onClick={onShare}
          >
            <Share2 className="h-4 w-4 mr-2" aria-hidden="true" />
            Поделиться ссылкой
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
