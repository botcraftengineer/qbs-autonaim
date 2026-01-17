import { PageHeader, SiteHeader } from "~/components/layout";
import { VacancyCreatorContainer } from "~/components/vacancy-creator";

interface PageProps {
  params: Promise<{
    orgSlug: string;
    slug: string;
  }>;
}

export default async function VacancyGeneratePage({ params }: PageProps) {
  const { orgSlug, slug } = await params;

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="@container/main flex flex-1 flex-col gap-2 overflow-hidden">
          <PageHeader
            title="Генерация вакансии"
            description="Автоматическая генерация контента с помощью AI"
            docsUrl="https://docs.hh.qbs.ru/generation"
          />
          <div className="flex-1 overflow-hidden px-4 pb-4 md:px-6 lg:px-8">
            <VacancyCreatorContainer
              workspaceId={slug}
              orgSlug={orgSlug}
              workspaceSlug={slug}
            />
          </div>
        </div>
      </div>
    </>
  );
}
