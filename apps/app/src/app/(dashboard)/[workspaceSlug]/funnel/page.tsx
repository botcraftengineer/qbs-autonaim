import { FunnelAnalytics } from "~/components/funnel";
import { SiteHeader } from "~/components/layout";

export default function FunnelPage() {
  return (
    <>
      <SiteHeader title="Воронка найма" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="px-4 py-4 md:px-6 lg:px-8">
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Аналитика и метрики
                </p>
              </div>
              <FunnelAnalytics />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
