"use client";

import { useState } from "react";
import { Button } from "@qbs-autonaim/ui";
import { IconPlus } from "@tabler/icons-react";
import { InterviewScenariosList } from "./interview-scenarios-list";
import { InterviewScenarioForm } from "./interview-scenario-form";

interface InterviewScenariosManagementProps {
  orgSlug: string;
  workspaceSlug: string;
}

export function InterviewScenariosManagement({
  orgSlug,
  workspaceSlug,
}: InterviewScenariosManagementProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingScenario, setEditingScenario] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-foreground">
            Управление сценариями
          </h2>
          <p className="text-sm text-muted-foreground">
            Создавайте готовые шаблоны вопросов и настроек для интервью
          </p>
        </div>

        <Button onClick={() => setShowCreateForm(true)} className="shrink-0">
          <IconPlus className="h-4 w-4 mr-2" />
          Создать сценарий
        </Button>
      </div>

      {showCreateForm && (
        <InterviewScenarioForm
          orgSlug={orgSlug}
          workspaceSlug={workspaceSlug}
          onCancel={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            // TODO: Refresh list
          }}
        />
      )}

      {editingScenario && (
        <InterviewScenarioForm
          orgSlug={orgSlug}
          workspaceSlug={workspaceSlug}
          scenarioId={editingScenario}
          onCancel={() => setEditingScenario(null)}
          onSuccess={() => {
            setEditingScenario(null);
            // TODO: Refresh list
          }}
        />
      )}

      <InterviewScenariosList
        orgSlug={orgSlug}
        workspaceSlug={workspaceSlug}
        onEditScenario={setEditingScenario}
      />
    </div>
  );
}
