"use client";

import { paths } from "@qbs-autonaim/config";
import { useParams, useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import type { OrganizationWithRole } from "~/types/organization";
import { AppSidebar } from "./app-sidebar";

type WorkspaceWithRole = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: "owner" | "admin" | "member";
  organizationSlug: string | undefined;
  organizationId: string | null;
};

const ACTIVE_WORKSPACE_KEY = "active-workspace-id";
const ACTIVE_ORGANIZATION_KEY = "active-organization-id";

export function AppSidebarWrapper({
  workspaces,
  organizations,
  ...props
}: Omit<
  ComponentProps<typeof AppSidebar>,
  "onWorkspaceChangeAction" | "onOrganizationChangeAction"
> & {
  workspaces?: WorkspaceWithRole[];
  organizations?: OrganizationWithRole[];
}) {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string | undefined;
  const orgSlug = params.orgSlug as string | undefined;

  const [activeOrganizationId, setActiveOrganizationId] = useState<
    string | undefined
  >(() => {
    if (typeof window === "undefined") return organizations?.[0]?.id;

    if (orgSlug) {
      const organization = organizations?.find((o) => o.slug === orgSlug);
      if (organization) return organization.id;
    }

    const saved = localStorage.getItem(ACTIVE_ORGANIZATION_KEY);
    if (saved) {
      const savedOrganization = organizations?.find((o) => o.id === saved);
      if (savedOrganization) return saved;
    }
    return organizations?.[0]?.id;
  });

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<
    string | undefined
  >(() => {
    if (typeof window === "undefined") return workspaces?.[0]?.id;

    // Если есть workspaceSlug в URL, используем его
    if (workspaceSlug) {
      const workspace = workspaces?.find((w) => w.slug === workspaceSlug);
      if (workspace) return workspace.id;
    }

    const saved = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
    if (saved) {
      const savedWorkspace = workspaces?.find((w) => w.id === saved);
      if (savedWorkspace) return saved;
    }
    return workspaces?.[0]?.id;
  });

  useEffect(() => {
    if (orgSlug) {
      const organization = organizations?.find((o) => o.slug === orgSlug);
      if (organization && organization.id !== activeOrganizationId) {
        setActiveOrganizationId(organization.id);
      }
    }
  }, [orgSlug, organizations, activeOrganizationId]);

  useEffect(() => {
    if (workspaceSlug) {
      const workspace = workspaces?.find((w) => w.slug === workspaceSlug);
      if (workspace && workspace.id !== activeWorkspaceId) {
        setActiveWorkspaceId(workspace.id);
      }
    }
  }, [workspaceSlug, workspaces, activeWorkspaceId]);

  useEffect(() => {
    if (activeOrganizationId) {
      localStorage.setItem(ACTIVE_ORGANIZATION_KEY, activeOrganizationId);
    }
  }, [activeOrganizationId]);

  useEffect(() => {
    if (activeWorkspaceId) {
      localStorage.setItem(ACTIVE_WORKSPACE_KEY, activeWorkspaceId);
    }
  }, [activeWorkspaceId]);

  const handleOrganizationChangeAction = (organizationId: string) => {
    setActiveOrganizationId(organizationId);
    const organization = organizations?.find((o) => o.id === organizationId);
    if (organization) {
      router.push(paths.organization.workspaces(organization.slug));
    }
  };

  const handleWorkspaceChangeAction = (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
    const workspace = workspaces?.find((w) => w.id === workspaceId);
    if (workspace && orgSlug) {
      router.push(paths.workspace.root(orgSlug, workspace.slug));
    }
  };

  return (
    <AppSidebar
      {...props}
      workspaces={workspaces}
      activeWorkspaceId={activeWorkspaceId}
      onWorkspaceChangeAction={handleWorkspaceChangeAction}
      organizations={organizations}
      activeOrganizationId={activeOrganizationId}
      onOrganizationChangeAction={handleOrganizationChangeAction}
    />
  );
}
