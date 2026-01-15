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
        { title: "Введение", href: "/docs" },
        { title: "Быстрый старт", href: "/docs/quickstart" },
        { title: "Глоссарий", href: "/docs/glossary" },
      ],
    },
    {
      title: "Работа с кандидатами",
      items: [
        { title: "Обзор", href: "/docs/candidates" },
        { title: "AI-скрининг", href: "/docs/candidates/screening" },
        { title: "Скоринг кандидатов", href: "/docs/candidates/scoring" },
        { title: "Воронка найма", href: "/docs/candidates/pipeline" },
      ],
    },
    {
      title: "AI-ассистент",
      items: [
        { title: "Обзор", href: "/docs/ai-assistant" },
        { title: "Чат с кандидатами", href: "/docs/ai-assistant/chat" },
        { title: "Автоответы", href: "/docs/ai-assistant/auto-replies" },
        { title: "Шаблоны сообщений", href: "/docs/ai-assistant/templates" },
      ],
    },
    {
      title: "Аналитика",
      items: [
        { title: "Обзор", href: "/docs/analytics" },
        { title: "Отчёты", href: "/docs/analytics/reports" },
        { title: "Метрики найма", href: "/docs/analytics/metrics" },
      ],
    },
    {
      title: "Интеграции",
      items: [
        { title: "Обзор", href: "/docs/integrations" },
        { title: "hh.ru", href: "/docs/integrations/hh" },
        { title: "SuperJob", href: "/docs/integrations/superjob" },
        { title: "Telegram", href: "/docs/integrations/telegram" },
        { title: "WhatsApp", href: "/docs/integrations/whatsapp" },
        { title: "Webhooks", href: "/docs/integrations/webhooks" },
      ],
    },
    {
      title: "API",
      items: [
        { title: "Введение", href: "/docs/api" },
        { title: "Аутентификация", href: "/docs/api/authentication" },
        { title: "Кандидаты", href: "/docs/api/candidates" },
        { title: "Вакансии", href: "/docs/api/vacancies" },
      ],
    },
  ],
}
