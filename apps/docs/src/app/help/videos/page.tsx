import { Clock, Play, User } from "lucide-react";
import type { Metadata } from "next";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsFeedback } from "@/components/docs/docs-feedback";
import { DocsMobileToc } from "@/components/docs/docs-mobile-toc";
import { DocsToc } from "@/components/docs/docs-toc";
import { generatePageSEO } from "@/lib/seo";

export const metadata: Metadata = generatePageSEO("videos", {
  title: "Видео-инструкции QBS Автонайм — обучение работе с платформой",
  description:
    "Видео-уроки по работе с QBS Автонайм. Пошаговые инструкции по настройке AI-скрининга, интеграциям, аналитике. Обучение для HR и рекрутеров.",
  url: "/help/videos",
  keywords: [
    "видео инструкции QBS",
    "обучение рекрутинг AI",
    "видео уроки HR софт",
    "туториалы AI скрининг",
    "видео интеграция HH.ru",
    "обучение чат ботам",
  ],
});

export default function VideosPage() {
  const tocItems = [
    { id: "getting-started", title: "Начало работы", level: 2 },
    { id: "ai-features", title: "AI-функции", level: 2 },
    { id: "integrations", title: "Интеграции", level: 2 },
    { id: "analytics", title: "Аналитика", level: 2 },
    { id: "advanced", title: "Продвинутые возможности", level: 2 },
  ];

  const videoCategories = [
    {
      id: "getting-started",
      title: "Начало работы",
      description: "Основы работы с платформой для новых пользователей",
      videos: [
        {
          title: "Регистрация и настройка аккаунта",
          duration: "5:32",
          description:
            "Как создать аккаунт, настроить организацию и добавить первых пользователей",
          level: "Начальный",
          thumbnail: "/videos/account-setup.jpg",
        },
        {
          title: "Создание первой вакансии",
          duration: "7:15",
          description:
            "Пошаговое создание вакансии с правильным описанием для AI",
          level: "Начальный",
          thumbnail: "/videos/first-vacancy.jpg",
        },
        {
          title: "Интеграция с HH.ru за 3 минуты",
          duration: "4:28",
          description: "Быстрая настройка синхронизации с HeadHunter",
          level: "Начальный",
          thumbnail: "/videos/hh-integration.jpg",
        },
      ],
    },
    {
      id: "ai-features",
      title: "AI-функции",
      description: "Использование искусственного интеллекта в рекрутинге",
      videos: [
        {
          title: "Настройка AI-скрининга кандидатов",
          duration: "8:45",
          description: "Как настроить критерии оценки и весовые коэффициенты",
          level: "Средний",
          thumbnail: "/videos/ai-screening.jpg",
        },
        {
          title: "Создание сценариев интервью",
          duration: "12:20",
          description: "Настройка автоматических вопросов для разных вакансий",
          level: "Средний",
          thumbnail: "/videos/interview-scenarios.jpg",
        },
        {
          title: "Работа с Telegram-ботами",
          duration: "6:55",
          description: "Настройка и управление чат-ботами для интервью",
          level: "Средний",
          thumbnail: "/videos/telegram-bots.jpg",
        },
      ],
    },
    {
      id: "integrations",
      title: "Интеграции",
      description: "Подключение внешних сервисов и систем",
      videos: [
        {
          title: "Интеграция с SuperJob",
          duration: "5:40",
          description:
            "Настройка синхронизации с SuperJob для мультиканального найма",
          level: "Средний",
          thumbnail: "/videos/superjob-integration.jpg",
        },
        {
          title: "Интеграция с внешними системами",
          duration: "15:30",
          description: "Экспорт данных и интеграция с корпоративными системами",
          level: "Продвинутый",
          thumbnail: "/videos/integrations-advanced.jpg",
        },
        {
          title: "Интеграция с 1C и ERP",
          duration: "18:45",
          description:
            "Подключение к корпоративным системам для автоматизации HR-процессов",
          level: "Продвинутый",
          thumbnail: "/videos/1c-integration.jpg",
        },
      ],
    },
    {
      id: "analytics",
      title: "Аналитика и отчёты",
      description: "Работа с данными и метриками эффективности",
      videos: [
        {
          title: "Основные метрики найма",
          duration: "9:10",
          description: "Какие показатели отслеживать и как их интерпретировать",
          level: "Средний",
          thumbnail: "/videos/metrics-basics.jpg",
        },
        {
          title: "Создание отчётов для руководства",
          duration: "11:25",
          description: "Подготовка презентаций и дашбордов с KPI найма",
          level: "Средний",
          thumbnail: "/videos/reports-creation.jpg",
        },
        {
          title: "ROI рекрутинга: расчёт эффективности",
          duration: "13:15",
          description: "Как рассчитать окупаемость инвестиций в найм персонала",
          level: "Продвинутый",
          thumbnail: "/videos/roi-calculation.jpg",
        },
      ],
    },
    {
      id: "advanced",
      title: "Продвинутые возможности",
      description: "Расширенные функции для опытных пользователей",
      videos: [
        {
          title: "Кастомизация AI-моделей",
          duration: "20:30",
          description:
            "Обучение AI на специфических требованиях вашей компании",
          level: "Эксперт",
          thumbnail: "/videos/ai-customization.jpg",
        },
        {
          title: "Массовый импорт кандидатов",
          duration: "7:50",
          description:
            "Импорт больших баз резюме и автоматизированная обработка",
          level: "Продвинутый",
          thumbnail: "/videos/bulk-import.jpg",
        },
        {
          title: "Безопасность и GDPR",
          duration: "10:40",
          description:
            "Настройка приватности данных и соблюдение законодательства",
          level: "Продвинутый",
          thumbnail: "/videos/security-gdpr.jpg",
        },
      ],
    },
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Начальный":
        return "bg-green-100 text-green-800";
      case "Средний":
        return "bg-yellow-100 text-yellow-800";
      case "Продвинутый":
        return "bg-blue-100 text-blue-800";
      case "Эксперт":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "Помощь и поддержка", href: "/help" },
            { title: "Видео-инструкции" },
          ]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">
            Помощь и поддержка
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Видео-инструкции
        </h1>

        <p className="text-lg">
          Видео-уроки по работе с QBS Автонайм. От основ для новичков до
          продвинутых техник для опытных HR-специалистов. Все видео на русском
          языке.
        </p>

        <DocsMobileToc items={tocItems} />

        <DocsCallout type="info" title="Обновления">
          Видеотека регулярно пополняется новыми уроками. Последнее обновление:{" "}
          {new Date().toLocaleDateString("ru-RU")}.
        </DocsCallout>

        {videoCategories.map((category) => (
          <div key={category.id}>
            <h2
              id={category.id}
              className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
            >
              {category.title}
            </h2>
            <p className="text-muted-foreground mb-6">{category.description}</p>

            <div className="grid gap-6 mb-8">
              {category.videos.map((video) => (
                <div
                  key={`${category.id}-${video.title}`}
                  className="flex gap-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex-shrink-0">
                    <div className="w-32 h-20 bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                      {/* Placeholder для thumbnail */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10" />
                      <Play className="h-8 w-8 text-primary relative z-10" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg leading-tight">
                        {video.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ml-4 ${getLevelColor(video.level)}`}
                      >
                        {video.level}
                      </span>
                    </div>

                    <p className="text-muted-foreground text-sm mb-3 leading-relaxed">
                      {video.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {video.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Для {video.level.toLowerCase()} уровня
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <DocsCallout type="tip" title="Плейлисты для быстрого старта">
          <div className="space-y-2">
            <p className="leading-relaxed text-foreground/80 mb-4">
              <strong className="font-semibold text-foreground">
                🎯 Для новичков:
              </strong>{" "}
              Смотрите видео по порядку: регистрация → вакансии → HH.ru →
              AI-скрининг
            </p>
            <p className="leading-relaxed text-foreground/80 mb-4">
              <strong className="font-semibold text-foreground">
                ⚡ Для опытных:
              </strong>{" "}
              Начните с разделов "AI-функции" и "Интеграции"
            </p>
            <p className="leading-relaxed text-foreground/80 mb-4">
              <strong className="font-semibold text-foreground">
                🎓 Для команд:
              </strong>{" "}
              Используйте видео для обучения новых сотрудников
            </p>
          </div>
        </DocsCallout>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 my-8">
          <h3 className="font-semibold text-blue-800 mb-3">
            Хотите персональное обучение?
          </h3>
          <p className="text-blue-700 mb-4">
            Для корпоративных клиентов доступны индивидуальные вебинары и
            консультации по внедрению QBS Автонайм в вашей компании.
          </p>
          <div className="flex gap-4">
            <a
              href="mailto:training@qbs-autonaim.ru"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              📧 Заказать обучение
            </a>
            <a
              href="https://t.me/qbs_support"
              className="inline-flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 transition-colors"
            >
              💬 Задать вопрос
            </a>
          </div>
        </div>

        <div className="my-8">
          <DocsFeedback />
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <a
            href="/help/knowledge-base"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Помощь и поддержка
          </a>
          <a
            href="/help/knowledge-base"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            База знаний
            <span className="group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </a>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  );
}
