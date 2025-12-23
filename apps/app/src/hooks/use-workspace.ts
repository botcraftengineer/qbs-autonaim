"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useTRPC } from "~/trpc/react";

interface UseWorkspaceReturn {
  workspace: RouterOutputs["organization"]["getWorkspaceBySlug"] | undefined;
  organization: RouterOutputs["organization"]["get"] | undefined;
  orgSlug: string | undefined;
  slug: string | undefined;
  isLoading: boolean;
  error: unknown;
  organizationError: unknown;
}

export function useWorkspace(): UseWorkspaceReturn {
  const params = useParams();
  const orgSlug = params.orgSlug as string | undefined;
  const slug = params.slug as string | undefined;
  const trpc = useTRPC();

  const { data: organization, error: organizationError } = useQuery({
    ...trpc.organization.get.queryOptions({ id: orgSlug ?? "" }),
    enabled: !!orgSlug,
  });

  const { data, isLoading, error } = useQuery({
    ...trpc.organization.getWorkspaceBySlug.queryOptions({
      organizationId: organization?.id ?? "",
      slug: slug ?? "",
    }),
    enabled: !!organization?.id && !!slug,
  });

  return {
    workspace: data,
    organization,
    orgSlug,
    slug,
    isLoading,
    error,
    organizationError,
  };
}
