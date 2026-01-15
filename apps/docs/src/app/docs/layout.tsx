import type React from "react"
import type { Metadata } from "next"
import { DocsSidebar } from "@/components/docs-sidebar"
import { DocsHeader } from "@/components/docs-header"

export const metadata: Metadata = {
  title: {
    default: "Документация | QBS Автонайм",
    template: "%s | QBS Автонайм",
  },
  description: "Полная документация AI-ассистента для рекрутеров QBS Автонайм",
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <span
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to bottom, rgba(59, 130, 246, 0.03), rgba(96, 165, 250, 0.08)), url("https://mintlify.s3.us-west-1.amazonaws.com/dub/images/background.png")',
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right top",
          backgroundAttachment: "fixed",
        }}
      />
      <DocsHeader />
      <div className="mx-auto flex max-w-7xl">
        <DocsSidebar />
        <main className="flex-1 px-4 py-8 md:px-8 lg:px-12">{children}</main>
      </div>
    </div>
  )
}
