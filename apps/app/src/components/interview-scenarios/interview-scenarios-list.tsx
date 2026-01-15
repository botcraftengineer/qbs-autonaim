"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";
import { IconEdit, IconTrash, IconLoader2 } from "@tabler/icons-react";
import { Button } from "@qbs-autonaim/ui";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

interface InterviewScenariosListProps {
  orgSlug: string;
  workspaceSlug: string;
  onEditScenario: (scenarioId: string) => void;
}

export function InterviewScenariosList({
  orgSlug,
  workspaceSlug,
  onEditScenario,
}: InterviewScenariosListProps) {
  const trpc = useTRPC();
  const { workspace } = useWorkspace();

  const { data, isLoading, error } = useQuery({
    ...trpc.interviewScenarios.list.queryOptions({
      workspaceId: workspace?.id ?? "",
      limit: 50,
      offset: 0,
    }),
    enabled: !!workspace?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <IconLoader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Загрузка сценариев...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">
          Ошибка загрузки сценариев: {error.message}
        </p>
      </div>
    );
  }

  if (!data?.scenarios || data.scenarios.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              У вас пока нет созданных сценариев интервью
            </p>
            <p className="text-sm text-muted-foreground">
              Создайте свой первый сценарий, чтобы начать использовать готовые
              шаблоны вопросов
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data.scenarios.map((scenario) => (
        <Card key={scenario.id}>
          <CardHeader>
            <CardTitle className="text-base">{scenario.name}</CardTitle>
            {scenario.description && (
              <CardDescription>{scenario.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditScenario(scenario.id)}
                className="flex-1"
              >
                <IconEdit className="h-4 w-4 mr-1" />
                Редактировать
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                <IconTrash className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
