"use client";

import { Button } from "@qbs-autonaim/ui";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";
import { AddDomainDialog } from "./add-domain-dialog";
import { DomainCard } from "./domain-card";

interface CustomDomainsSectionProps {
  organizationId: string;
}

export function CustomDomainsSection({
  organizationId,
}: CustomDomainsSectionProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const trpc = useTRPC();

  const { data: domains, isLoading } = useQuery(
    trpc.customDomain.list.queryOptions({
      organizationId,
    }),
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Кастомные домены</h3>
          <p className="text-sm text-muted-foreground">
            Используйте собственный домен для ссылок на интервью
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить домен
        </Button>
      </div>

      {domains && domains.length > 0 ? (
        <div className="space-y-3">
          {domains.map((domain) => (
            <DomainCard
              key={domain.id}
              domain={domain}
              organizationId={organizationId}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            У вас пока нет кастомных доменов
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Добавить первый домен
          </Button>
        </div>
      )}

      <AddDomainDialog
        organizationId={organizationId}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
}
