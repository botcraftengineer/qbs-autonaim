import { VacancyLayoutClient } from "./_components/vacancy-layout-client";

interface VacancyLayoutProps {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string; id: string }>;
}

export default async function VacancyLayout({
  children,
  params,
}: VacancyLayoutProps) {
  const { workspaceSlug, id } = await params;

  return (
    <VacancyLayoutClient workspaceSlug={workspaceSlug} vacancyId={id}>
      {children}
    </VacancyLayoutClient>
  );
}
