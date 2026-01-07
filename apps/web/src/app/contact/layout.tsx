import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Связаться с нами | QBS Автонайм",
  description:
    "Свяжитесь с командой QBS Автонайм. Email, телефон, Telegram — выберите удобный способ. Ответим в течение 24 часов.",
  keywords: ["контакты QBS", "связаться с QBS", "поддержка QBS", "техподдержка", "email QBS"],
  openGraph: {
    title: "Связаться с нами | QBS Автонайм",
    description: "Свяжитесь с командой QBS. Ответим в течение 24 часов.",
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
