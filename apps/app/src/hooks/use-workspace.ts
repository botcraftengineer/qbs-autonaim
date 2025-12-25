"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useTRPC } from "~/trpc/react";

interface UseWorkspaceReturn {
  workspace:
    | (RouterOutputs["workspace"]["getBySlug"]["workspace"] & {
        role: RouterOutputs["workspace"]["getBySlug"]["role"];
      })
    | undefined;
  organization: RouterOutputs["organization"]["getBySlug"] | undefined;
  orgSlug: string | undefined;
  slug: string | undefined;
  isLoading: boolean;
  organizationIsLoading: boolean;
  error: unknown;
  organizationError: unknown;
}

export function useWorkspace(): UseWorkspaceReturn {
  const params = useParams();
  const orgSlug = params.orgSlug as string | undefined;
  const slug = params.slug as string | undefined;
  const trpc = useTRPC();

  const {
    data: organization,
    isLoading: organizationIsLoading,
    error: organizationError,
  } = useQuery({
    ...trpc.organization.getBySlug.queryOptions({ slug: orgSlug ?? "" }),
    enabled: !!orgSlug,
  });

  const { data, isLoading, error } = useQuery({
    ...trpc.workspace.getBySlug.queryOptions({
      organizationId: organization?.id ?? "",
      slug: slug ?? "",
    }),
    enabled: !!organization?.id && !!slug,
  });

  return {
    workspace: data ? { ...data.workspace, role: data.role } : undefined,
    organization,
    orgSlug,
    slug,
    isLoading,
    organizationIsLoading,
    error,
    organizationError,
  };
}
