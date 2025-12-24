"use client";

import { useParams } from "next/navigation";
import { createContext, useContext, useMemo } from "react";

type WorkspaceWithRole = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: "owner" | "admin" | "member";
  organizationSlug: string | undefined;
  organizationId: string | null;
  memberCount?: number;
  plan?: string;
};

type OrganizationWithRole = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: "owner" | "admin" | "member";
  memberCount: number;
  workspaceCount: number;
  plan?: string;
};

export type { WorkspaceWithRole, OrganizationWithRole };

type WorkspaceContextType = {
  workspaces: WorkspaceWithRole[];
  organizations: OrganizationWithRole[];
  workspace?: WorkspaceWithRole;
  workspaceId?: string;
};

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({
  children,
  workspaces,
  organizations,
}: {
  children: React.ReactNode;
  workspaces: WorkspaceWithRole[];
  organizations: OrganizationWithRole[];
}) {
  const params = useParams();
  const workspaceSlug = params?.slug as string | undefined;

  const workspace = useMemo(() => {
    if (!workspaceSlug) return undefined;
    return workspaces.find((w) => w.slug === workspaceSlug);
  }, [workspaces, workspaceSlug]);

  const value = useMemo(
    () => ({
      workspaces,
      organizations,
      workspace,
      workspaceId: workspace?.id,
    }),
    [workspaces, organizations, workspace],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaces() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error(
      "useWorkspaces должен использоваться внутри WorkspaceProvider",
    );
  }
  return context;
}

// Алиас для обратной совместимости
export function useWorkspaceContext() {
  return useWorkspaces();
}
