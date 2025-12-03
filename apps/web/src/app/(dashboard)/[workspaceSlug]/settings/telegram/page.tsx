"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { TelegramSessionsCard } from "~/components/settings/telegram-sessions-card";
import { useTRPC } from "~/trpc/react";

export default function TelegramSettingsPage() {
  const trpc = useTRPC();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;

  const { data: workspace } = useQuery(
    trpc.workspace.bySlug.queryOptions({ slug: workspaceSlug }),
  );

  const workspaceId = workspace?.workspace?.id || "";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Telegram</h3>
        <p className="text-sm text-muted-foreground">
          Управление подключенными Telegram аккаунтами
        </p>
      </div>

      {workspaceId && <TelegramSessionsCard workspaceId={workspaceId} />}
    </div>
  );
}
