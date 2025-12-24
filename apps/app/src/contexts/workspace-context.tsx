"use client";

import { createContext, useContext } from "react";

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
  return (
    <WorkspaceContext.Provider value={{ workspaces, organizations }}>
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
