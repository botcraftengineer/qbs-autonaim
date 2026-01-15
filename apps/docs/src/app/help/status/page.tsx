import type { Metadata } from "next";
import { generatePageSEO } from "@/lib/seo";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsFeedback } from "@/components/docs/docs-feedback";
import { DocsMobileToc } from "@/components/docs/docs-mobile-toc";
import { DocsToc } from "@/components/docs/docs-toc";
import { CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";

export const metadata: Metadata = generatePageSEO("status", {
  title: "Статус системы QBS Автонайм — доступность сервисов",
  description: "Текущее состояние системы QBS Автонайм. Проверка доступности AI-скрининга и интеграций. История инцидентов и плановое обслуживание.",
  url: "/help/status",
  keywords: [
    "статус QBS Автонайм",
    "доступность сервиса",
    "работоспособность системы",
    "инциденты",
    "плановое обслуживание",
    "мониторинг",
  ],
});

export default function StatusPage() {
  const tocItems = [
    { id: "current-status", title: "Текущий статус", level: 2 },
    { id: "services", title: "Статус сервисов", level: 2 },
    { id: "incidents", title: "История инцидентов", level: 2 },
    { id: "maintenance", title: "Плановое обслуживание", level: 2 },
    { id: "uptime", title: "Статистика доступности", level: 2 },
  ];

  const services = [
    {
      name: "Основное приложение",
      status: "operational",
      description: "Веб-интерфейс и личный кабинет",
      uptime: "99.9%",
    },
    {
      name: "AI-скрининг",
      status: "operational",
      description: "Автоматический анализ резюме",
      uptime: "99.8%",
    },
    {
      name: "Интеграция HH.ru",
      status: "operational",
      description: "Синхронизация с HeadHunter",
      uptime: "99.7%",
    },
    {
      name: "Telegram-боты",
      status: "operational",
      description: "Чат-боты для интервью",
      uptime: "99.8%",
    },
    {
      name: "Аналитика",
      status: "operational",
      description: "Отчёты и метрики",
      uptime: "99.9%",
    },
  ];

  const incidents = [
    {
      date: "2025-01-10",
      time: "14:30 - 15:45",
      service: "Интеграция HH.ru",
      status: "resolved",
      description: "Временные проблемы с синхронизацией новых откликов из HeadHunter",
      impact: "Задержка импорта новых кандидатов на 15-30 минут",
    },
    {
      date: "2025-01-05",
      time: "02:00 - 04:00",
      service: "Все сервисы",
      status: "resolved",
      description: "Плановое техническое обслуживание и обновление инфраструктуры",
      impact: "Временное недоступны сервисов для проведения обновлений",
    },
    {
      date: "2024-12-28",
      time: "16:20 - 16:35",
      service: "AI-скрининг",
      status: "resolved",
      description: "Временное замедление обработки из-за пиковой нагрузки",
      impact: "Увеличение времени анализа резюме до 10 секунд",
    },
  ];

  const maintenance = [
    {
      date: "2025-01-20",
      time: "02:00 - 06:00",
      services: ["Все сервисы"],
      description: "Ежемесячное обновление системы безопасности и установка патчей",
      impact: "Временное недоступны сервисов на 4 часа",
    },
    {
      date: "2025-02-01",
      time: "01:00 - 05:00",
      services: ["AI-скрининг"],
      description: "Обновление AI-моделей и системы до новой версии",
      impact: "Временное недоступны AI-функций на 4 часа",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "outage":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "operational":
        return "Работает";
      case "degraded":
        return "Сниженная производительность";
      case "outage":
        return "Недоступен";
      default:
        return "Неизвестно";
    }
  };

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "Помощь и поддержка", href: "/help" },
            { title: "Статус системы" },
          ]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">
            Помощь и поддержка
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">Статус системы</h1>

        <p className="text-lg">
          Мониторинг доступности сервисов QBS Автонайм в реальном времени.
          Здесь вы можете проверить текущее состояние системы и историю инцидентов.
        </p>

        <DocsMobileToc items={tocItems} />

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">
                Все системы работают исправно
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Последняя проверка: {new Date().toLocaleString('ru-RU')}
              </p>
            </div>
          </div>
        </div>

        <h2 id="services" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Статус сервисов</h2>

        <div className="space-y-4 my-6">
          {services.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between p-4 border border-border rounded-lg"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(service.status)}
                <div>
                  <h3 className="font-semibold">{service.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {service.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {getStatusText(service.status)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Uptime: {service.uptime}
                </div>
              </div>
            </div>
          ))}
        </div>

        <h2 id="uptime" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Статистика доступности</h2>

        <div className="grid gap-4 my-6 md:grid-cols-3">
          <div className="text-center p-4 border border-border rounded-lg">
            <div className="text-2xl font-bold text-green-600">99.9%</div>
            <div className="text-sm text-muted-foreground">За последний месяц</div>
          </div>
          <div className="text-center p-4 border border-border rounded-lg">
            <div className="text-2xl font-bold text-green-600">99.8%</div>
            <div className="text-sm text-muted-foreground">За последние 3 месяца</div>
          </div>
          <div className="text-center p-4 border border-border rounded-lg">
            <div className="text-2xl font-bold text-green-600">99.7%</div>
            <div className="text-sm text-muted-foreground">За последний год</div>
          </div>
        </div>

        <h2 id="incidents" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">История инцидентов</h2>

        <div className="space-y-4 my-6">
          {incidents.map((incident, index) => (
            <div
              key={index}
              className="p-4 border border-border rounded-lg"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{incident.service}</h3>
                  <p className="text-sm text-muted-foreground">
                    {incident.date} • {incident.time}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  incident.status === 'resolved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {incident.status === 'resolved' ? 'Исправлено' : 'Активно'}
                </span>
              </div>
              <p className="text-sm mb-2">{incident.description}</p>
              <p className="text-sm text-muted-foreground">
                <strong className="font-semibold text-foreground">Влияние:</strong> {incident.impact}
              </p>
            </div>
          ))}
        </div>

        <h2 id="maintenance" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Плановое обслуживание</h2>

        <div className="space-y-4 my-6">
          {maintenance.map((item, index) => (
            <div
              key={index}
              className="p-4 border border-border rounded-lg bg-blue-50"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">
                    {item.services.join(", ")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.date} • {item.time}
                  </p>
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Запланировано
                </span>
              </div>
              <p className="text-sm mb-2">{item.description}</p>
              <p className="text-sm text-muted-foreground">
                <strong className="font-semibold text-foreground">Ожидаемое влияние:</strong> {item.impact}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-6">
          <h3 className="font-semibold text-blue-800 mb-2">
            Уведомления о статусе
          </h3>
          <p className="text-sm text-blue-700">
            Подпишитесь на уведомления о статусе системы, чтобы получать
            своевременную информацию об инцидентах и плановом обслуживании.
          </p>
          <div className="mt-3">
            <a
              href="https://t.me/qbs_status"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              📢 Подписаться на уведомления
            </a>
          </div>
        </div>

        <div className="my-8">
          <DocsFeedback />
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <a
            href="/help"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Помощь и поддержка
          </a>
          <a
            href="/help/faq"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            FAQ
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