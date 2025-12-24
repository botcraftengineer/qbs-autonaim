import { VacancyLayoutClient } from "./_components/vacancy-layout-client";

interface VacancyLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string; slug: string; id: string }>;
}

export default async function VacancyLayout({
  children,
  params,
}: VacancyLayoutProps) {
  const { orgSlug, slug, id } = await params;

  return (
    <VacancyLayoutClient orgSlug={orgSlug} workspaceSlug={slug} vacancyId={id}>
      {children}
    </VacancyLayoutClient>
  );
}
