import { cn, ThemeProvider, Toaster } from "@selectio/ui";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";

import "~/app/styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://selectio-web.vercel.app"
      : "http://localhost:3000",
  ),
  title: "Selectio - Автоматизация работы с вакансиями HH.ru",
  description:
    "Платформа для автоматизации рекрутинга на HH.ru. Автоматический парсинг вакансий, откликов кандидатов и управление процессом найма.",
  openGraph: {
    title: "Selectio - Автоматизация работы с вакансиями HH.ru",
    description:
      "Платформа для автоматизации рекрутинга на HH.ru. Автоматический парсинг вакансий, откликов кандидатов и управление процессом найма.",
    url: "https://selectio-web.vercel.app",
    siteName: "Selectio",
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
        <Analytics />
      </body>
    </html>
  );
}
