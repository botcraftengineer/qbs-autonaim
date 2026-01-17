import { FunnelAnalytics } from "~/components/funnel";
import { PageHeader, SiteHeader } from "~/components/layout";

export default function FunnelPage() {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <PageHeader
            title="Воронка найма"
            description="Аналитика процесса подбора персонала"
            docsUrl="https://docs.hh.qbs.ru/funnel"
          />
          <div className="px-4 py-4 md:px-6 lg:px-8">
            <div className="space-y-4 md:space-y-6">
              <FunnelAnalytics />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
