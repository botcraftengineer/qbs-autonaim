"use client";

import {
  HR_SELECTION_STATUS_LABELS,
  RESPONSE_STATUS_LABELS,
} from "@selectio/db/schema";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@selectio/ui";
import { User } from "lucide-react";
import { ResponseActions } from "~/components/response";
import type { VacancyResponse } from "~/types/vacancy";
import { ContactInfo } from "./contact-info";

interface ResponseCardsProps {
  responses: VacancyResponse[];
}

export function ResponseCards({ responses }: ResponseCardsProps) {
  return (
    <div className="grid gap-4 md:hidden">
      {responses.map((response) => (
        <Card key={response.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    {response.candidateName || "Без имени"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {new Date(response.createdAt).toLocaleDateString("ru-RU")}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {RESPONSE_STATUS_LABELS[response.status]}
              </Badge>
              {response.hrSelectionStatus && (
                <Badge variant="secondary">
                  {HR_SELECTION_STATUS_LABELS[response.hrSelectionStatus]}
                </Badge>
              )}
            </div>
            {response.experience && (
              <div>
                <h4 className="text-sm font-medium mb-1">Опыт работы</h4>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <button
                      type="button"
                      className="text-left text-sm text-muted-foreground hover:underline cursor-pointer"
                    >
                      {response.experience.length > 120
                        ? `${response.experience.slice(0, 120)}...`
                        : response.experience}
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Опыт работы</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {response.experience}
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            )}
            {response.contacts && typeof response.contacts === "object" ? (
              <div>
                <h4 className="text-sm font-medium mb-2">Контакты</h4>
                <ContactInfo contacts={response.contacts} size="md" />
              </div>
            ) : null}
            <div className="pt-2 border-t">
              <ResponseActions
                responseId={response.id}
                resumeUrl={response.resumeUrl}
                candidateName={response.candidateName}
                hasGreeting={!!response.screening?.greeting}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
