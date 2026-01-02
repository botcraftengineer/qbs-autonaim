import { APP_CONFIG } from "@qbs-autonaim/config";
import { cn, ThemeProvider, Toaster } from "@qbs-autonaim/ui";
import type { Metadata, Viewport } from "next";
import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";

import "~/app/styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production" ? APP_CONFIG.url : "http://localhost:3000",
  ),
  title: "QBS Автонайм - Автоматизация работы с вакансиями HH.ru",
  description:
    "Платформа для автоматизации рекрутинга на HH.ru. Автоматический парсинг вакансий, откликов кандидатов и управление процессом найма.",
  openGraph: {
    title: "QBS Автонайм - Автоматизация работы с вакансиями HH.ru",
    description:
      "Платформа для автоматизации рекрутинга на HH.ru. Автоматический парсинг вакансий, откликов кандидатов и управление процессом найма.",
    url: APP_CONFIG.url,
    siteName: APP_CONFIG.name,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen font-sans antialiased",
        )}
      >
        <ThemeProvider>
          <TRPCReactProvider>{props.children}</TRPCReactProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
