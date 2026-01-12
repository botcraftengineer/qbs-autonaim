"use client";

import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";

interface CustomDomainSelectProps {
  workspaceId: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
}

export function CustomDomainSelect({
  workspaceId,
  value,
  onChange,
}: CustomDomainSelectProps) {
  const trpc = useTRPC();

  const {
    data: customDomains = [],
    isLoading: isLoadingCustom,
    isError: isCustomError,
    error: customError,
  } = useQuery(
    trpc.customDomain.list.queryOptions({
      workspaceId,
      type: "interview",
    }),
  );

  const { data: presetDomains = [], isLoading: isLoadingPresets } = useQuery(
    trpc.customDomain.listPresets.queryOptions(),
  );

  const isLoading = isLoadingCustom || isLoadingPresets;
  const verifiedCustomDomains = customDomains.filter((d) => d.isVerified);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Домен для интервью</Label>
        <div className="h-10 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  if (isCustomError) {
    return (
      <div className="space-y-2">
        <Label>Домен для интервью</Label>
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">
            Не удалось загрузить список доменов
          </p>
          {customError?.message && (
            <p className="mt-1 text-xs text-muted-foreground">
              {customError.message}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="customDomain">Домен для интервью</Label>
      <Select
        value={value ?? "default"}
        onValueChange={(val) => onChange(val === "default" ? null : val)}
      >
        <SelectTrigger
          id="customDomain"
          name="customDomain"
          className="min-h-[44px]"
          aria-describedby="customDomain-hint"
        >
          <SelectValue placeholder="Выберите домен…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">По умолчанию</SelectItem>

          {presetDomains.length > 0 &&
            presetDomains.map((domain) => (
              <SelectItem key={domain.id} value={domain.id}>
                {domain.label}
              </SelectItem>
            ))}

          {verifiedCustomDomains.length > 0 &&
            verifiedCustomDomains.map((domain) => (
              <SelectItem key={domain.id} value={domain.id}>
                {domain.domain}
                {domain.isPrimary && " (основной)"}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      <p id="customDomain-hint" className="text-xs text-muted-foreground">
        {presetDomains.length === 0 && verifiedCustomDomains.length === 0
          ? "У вас нет настроенных доменов. Будет использован домен по умолчанию"
          : "Выберите домен для ссылок на интервью или оставьте по умолчанию"}
      </p>
    </div>
  );
}
