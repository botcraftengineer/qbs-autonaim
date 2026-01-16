import type { Metadata } from "next";
import { generatePageSEO } from "@/lib/seo";

export const metadata: Metadata = generatePageSEO("quickstart", {
  url: "/quickstart",
  type: "article",
});

export default function QuickstartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
