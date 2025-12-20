"use client";

import type { UserWorkspaceRole } from "@qbs-autonaim/db/schema";
import { createContext, type ReactNode, useContext } from "react";
import { useWorkspace } from "~/hooks/use-workspace";

interface WorkspaceContextValue {
  workspaceId: string | undefined;
  workspaceSlug: string | undefined;
  workspace:
    | {
        id: string;
        name: string;
        slug: string;
        createdAt: Date;
        updatedAt: Date;
      }
    | undefined;
  role: UserWorkspaceRole | undefined;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(
  undefined,
);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { workspace, role, workspaceSlug, isLoading } = useWorkspace();

  return (
    <WorkspaceContext.Provider
      value={{
        workspaceId: workspace?.id,
        workspaceSlug,
        workspace,
        role,
        isLoading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error(
      "useWorkspaceContext must be used within a WorkspaceProvider",
    );
  }
  return context;
}
