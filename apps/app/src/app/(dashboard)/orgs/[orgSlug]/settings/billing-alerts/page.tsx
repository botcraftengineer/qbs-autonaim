import { SiteHeader } from "~/components/layout";

export default async function OrganizationBillingAlertsPage() {
  return (
    <>
      <SiteHeader title="Уведомления о биллинге" />
      <div className="space-y-6 p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Уведомления о биллинге
          </h1>
          <p className="text-muted-foreground">
            Настройте уведомления о расходах и лимитах.
          </p>
        </div>
        <div className="rounded-lg border p-6">
          <p className="text-muted-foreground">
            Страница уведомлений в разработке
          </p>
        </div>
      </div>
    </>
  );
}
