import { SidebarInset, SidebarProvider } from "@selectio/ui";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "~/auth/server";
import { AppSidebar } from "~/components/sidebar";
import { getUserRole } from "~/lib/auth-utils";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    return <>{children}</>;
  }

  // Проверяем роль пользователя
  const userRole = await getUserRole(session.user.id);

  if (userRole !== "admin") {
    redirect("/access-denied");
  }

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          avatar: session.user.image || "",
        }}
      />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
