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
      title: "🚀 Начало работы",
      items: [
        { title: "Введение в QBS Автонайм", href: "/" },
        { title: "Быстрый старт за 10 минут", href: "/quickstart" },
        { title: "Глоссарий терминов", href: "/glossary" },
        { title: "Цены и тарифы", href: "/pricing" },
      ],
    },
    {
      title: "👥 Работа с кандидатами",
      items: [
        { title: "Обзор раздела Кандидаты", href: "/candidates" },
        { title: "AI-скрининг резюме", href: "/candidates/screening" },
        { title: "Система скоринга", href: "/candidates/scoring" },
        { title: "Воронка найма", href: "/candidates/pipeline" },
        { title: "Gig-задания для фрилансеров", href: "/candidates/gig" },
        { title: "Голосовые резюме", href: "/candidates/voice" },
      ],
    },
    {
      title: "🤖 AI-ассистент",
      items: [
        { title: "Обзор возможностей AI", href: "/ai-assistant" },
        { title: "Чат с кандидатами", href: "/ai-assistant/chat" },
        { title: "Автоматические ответы", href: "/ai-assistant/auto-replies" },
        { title: "Шаблоны сообщений", href: "/ai-assistant/templates" },
        { title: "Настройка сценариев интервью", href: "/ai-assistant/scenarios" },
      ],
    },
    {
      title: "📊 Аналитика и отчёты",
      items: [
        { title: "Обзор аналитики", href: "/analytics" },
        { title: "Отчёты по найму", href: "/analytics/reports" },
        { title: "Метрики эффективности", href: "/analytics/metrics" },
        { title: "Dashboard руководителя", href: "/analytics/dashboard" },
        { title: "ROI рекрутинга", href: "/analytics/roi" },
      ],
    },
    {
      title: "🔗 Интеграции для РФ",
      items: [
        { title: "Обзор интеграций", href: "/integrations" },
        { title: "HeadHunter (HH.ru)", href: "/integrations/hh" },
        { title: "SuperJob", href: "/integrations/superjob" },
        { title: "Telegram-боты", href: "/integrations/telegram" },
        { title: "Фриланс-платформы", href: "/integrations/freelance" },
        { title: "Email-рассылки", href: "/integrations/email" },
        { title: "Webhooks и API", href: "/integrations/webhooks" },
        { title: "1C и ERP-системы", href: "/integrations/1c" },
      ],
    },
    {
      title: "⚙️ API и разработка",
      items: [
        { title: "Введение в API", href: "/api" },
        { title: "Аутентификация", href: "/api/authentication" },
        { title: "API кандидатов", href: "/api/candidates" },
        { title: "API вакансий", href: "/api/vacancies" },
        { title: "API чата", href: "/api/chat" },
        { title: "Webhooks", href: "/api/webhooks" },
        { title: "SDK и примеры кода", href: "/api/sdk" },
      ],
    },
    {
      title: "🛠️ Настройки и безопасность",
      items: [
        { title: "Настройки аккаунта", href: "/settings/account" },
        { title: "Управление командой", href: "/settings/team" },
        { title: "Уведомления", href: "/settings/notifications" },
        { title: "Безопасность данных", href: "/settings/security" },
        { title: "GDPR и 152-ФЗ", href: "/settings/privacy" },
      ],
    },
    {
      title: "❓ Помощь и поддержка",
      items: [
        { title: "Часто задаваемые вопросы", href: "/help/faq" },
        { title: "Видео-инструкции", href: "/help/videos" },
        { title: "База знаний", href: "/help/knowledge-base" },
        { title: "Связаться с поддержкой", href: "/help/support" },
        { title: "Статус системы", href: "/help/status" },
      ],
    },
  ],
}
