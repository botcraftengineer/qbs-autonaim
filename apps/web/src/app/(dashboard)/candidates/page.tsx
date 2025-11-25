import { SiteHeader } from "~/components/layout";

export default async function CandidatesPage() {
  return (
    <>
      <SiteHeader title="Кандидаты" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold mb-2">Кандидаты</h2>
                  <p className="text-muted-foreground">
                    Здесь будет список кандидатов
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
