import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "~/auth/server";
import { WorkspaceProvider } from "~/contexts/workspace-context";
import { api } from "~/trpc/server";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ orgSlug: string; slug: string }>;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { orgSlug, slug } = await params;

  // Получаем организацию и проверяем доступ
  const caller = await api();
  const organization = await caller.organization.getBySlug({ slug: orgSlug });

  if (!organization) {
    notFound();
  }

  // Получаем workspace по slug в рамках организации
  const workspace = await caller.organization.workspaces.getBySlug({
    organizationId: organization.id,
    slug,
  });

  if (!workspace) {
    notFound();
  }

  return <WorkspaceProvider>{children}</WorkspaceProvider>;
}
