import { HiringFunnelView } from "~/components/funnel";
import { SiteHeader } from "~/components/layout";

export default function FunnelPage() {
  return (
    <>
      <SiteHeader title="Воронка найма" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="px-4 py-4 md:px-6 lg:px-8">
            <HiringFunnelView />
          </div>
        </div>
      </div>
    </>
  );
}
