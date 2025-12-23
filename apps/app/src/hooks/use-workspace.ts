"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useTRPC } from "~/trpc/react";

export function useWorkspace() {
  const params = useParams();
  const orgSlug = params.orgSlug as string | undefined;
  const slug = params.slug as string | undefined;
  const trpc = useTRPC();

  const { data: organization } = useQuery({
    ...trpc.organization.getBySlug.queryOptions({ slug: orgSlug ?? "" }),
    enabled: !!orgSlug,
  });

  const { data, isLoading, error } = useQuery({
    ...trpc.organization.workspaces.getBySlug.queryOptions({
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
  };
}
