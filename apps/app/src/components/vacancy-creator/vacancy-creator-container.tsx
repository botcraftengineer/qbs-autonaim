"use client";

import { VacancyChatInterface } from "~/components/vacancy-chat-interface";

interface VacancyCreatorContainerProps {
  workspaceId: string;
  orgSlug: string;
  workspaceSlug: string;
}

export function VacancyCreatorContainer({
  workspaceId,
  orgSlug,
  workspaceSlug,
}: VacancyCreatorContainerProps) {
  return (
    <VacancyChatInterface
      workspaceId={workspaceId}
      orgSlug={orgSlug}
      workspaceSlug={workspaceSlug}
    />
  );
}
