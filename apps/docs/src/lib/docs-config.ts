export interface NavItem {
  title: string
  href?: string
  items?: NavItem[]
  label?: string
  external?: boolean
}

export interface DocsConfig {
  sidebarNav: NavItem[]
}

export const docsConfig: DocsConfig = {
  sidebarNav: [
    {
      title: "Начало работы",
      items: [
        { title: "Введение", href: "/" },
        { title: "Быстрый старт", href: "/quickstart" },
        { title: "Глоссарий", href: "/glossary" },
      ],
    },
    {
      title: "Работа с кандидатами",
      items: [
        { title: "Обзор", href: "/candidates" },
        { title: "AI-скрининг", href: "/candidates/screening" },
        { title: "Скоринг кандидатов", href: "/candidates/scoring" },
        { title: "Воронка найма", href: "/candidates/pipeline" },
      ],
    },
    {
      title: "AI-ассистент",
      items: [
        { title: "Обзор", href: "/ai-assistant" },
        { title: "Чат с кандидатами", href: "/ai-assistant/chat" },
        { title: "Автоответы", href: "/ai-assistant/auto-replies" },
        { title: "Шаблоны сообщений", href: "/ai-assistant/templates" },
      ],
    },
    {
      title: "Аналитика",
      items: [
        { title: "Обзор", href: "/analytics" },
        { title: "Отчёты", href: "/analytics/reports" },
        { title: "Метрики найма", href: "/analytics/metrics" },
      ],
    },
    {
      title: "Интеграции",
      items: [
        { title: "Обзор", href: "/integrations" },
        { title: "hh.ru", href: "/integrations/hh" },
        { title: "SuperJob", href: "/integrations/superjob" },
        { title: "Telegram", href: "/integrations/telegram" },
        { title: "WhatsApp", href: "/integrations/whatsapp" },
        { title: "Webhooks", href: "/integrations/webhooks" },
      ],
    },
    {
      title: "API",
      items: [
        { title: "Введение", href: "/api" },
        { title: "Аутентификация", href: "/api/authentication" },
        { title: "Кандидаты", href: "/api/candidates" },
        { title: "Вакансии", href: "/api/vacancies" },
      ],
    },
  ],
}
