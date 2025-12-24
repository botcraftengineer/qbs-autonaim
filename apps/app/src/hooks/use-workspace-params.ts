"use client";

import { useParams } from "next/navigation";

export function useWorkspaceParams() {
  const params = useParams();
  const orgSlug = params.orgSlug as string | undefined;
  const slug = params.slug as string | undefined;

  return {
    orgSlug,
    slug,
  };
}
