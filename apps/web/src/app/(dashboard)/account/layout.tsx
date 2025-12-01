import type { ReactNode } from "react";

export default function AccountsLayout({ children }: { children: ReactNode }) {
  return <div className="container max-w-4xl py-8">{children}</div>;
}
