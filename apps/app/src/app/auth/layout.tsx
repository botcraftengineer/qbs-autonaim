import { paths } from "@qbs-autonaim/config";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "~/auth/server";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  // Если пользователь уже авторизован, редиректим на главную
  if (session?.user) {
    redirect(paths.dashboard.root);
  }

  return <>{children}</>;
}
