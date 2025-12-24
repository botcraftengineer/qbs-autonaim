import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "~/auth/server";
import { api } from "~/trpc/server";

export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Проверяем, есть ли у пользователя организации
  const caller = await api();
  const userOrganizations = await caller.organization.list();

  // Если есть организации, редиректим на главную
  if (userOrganizations.length > 0) {
    redirect("/");
  }

  return <>{children}</>;
}
