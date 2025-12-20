import type { ReactNode } from "react";
import { SiteHeader } from "~/components/layout";

export default function AccountsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader title="" />
      <div className="container max-w-4xl py-8">{children}</div>
    </>
  );
}
