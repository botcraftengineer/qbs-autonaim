import { SiteHeader } from "~/components/layout";

export default async function OrganizationBillingPage() {
  return (
    <>
      <SiteHeader title="Биллинг" />
      <div className="space-y-6 p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Биллинг</h1>
          <p className="text-muted-foreground">
            Управляйте подпиской и платежами организации.
          </p>
        </div>
        <div className="rounded-lg border p-6">
          <p className="text-muted-foreground">
            Страница биллинга в разработке
          </p>
        </div>
      </div>
    </>
  );
}
