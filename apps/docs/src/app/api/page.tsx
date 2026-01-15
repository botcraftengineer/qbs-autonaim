import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsCode } from "@/components/docs/docs-code";
import { DocsToc } from "@/components/docs/docs-toc";

export default function APIPage() {
  const tocItems = [
    { id: "overview", title: "Обзор", level: 2 },
    { id: "base-url", title: "Базовый URL", level: 2 },
    { id: "authentication", title: "Аутентификация", level: 2 },
    { id: "endpoints", title: "Эндпоинты", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb items={[{ title: "API" }, { title: "Введение" }]} />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">API</span>
        </div>

        <h1>tRPC API</h1>

        <p className="text-lg">
          QBS Автонайм использует tRPC для типобезопасного взаимодействия между
          клиентом и сервером. Все API методы автоматически типизированы и
          доступны через tRPC клиент.
        </p>

        <h2 id="overview">Обзор</h2>

        <ul>
          <li>
            <strong>Протокол</strong> — tRPC через HTTPS
          </li>
          <li>
            <strong>Формат данных</strong> — JSON
          </li>
          <li>
            <strong>Аутентификация</strong> — Сессии через NextAuth
          </li>
          <li>
            <strong>Типизация</strong> — Полная TypeScript типизация из коробки
          </li>
          <li>
            <strong>Валидация</strong> — Zod v4 схемы для всех входных данных
          </li>
        </ul>

        <h2 id="base-url">Базовый URL</h2>

        <DocsCode
          code="http://localhost:3000/api/trpc"
          language="text"
          title="tRPC Endpoint"
        />

        <p className="text-sm text-muted-foreground mt-2">
          Для production используйте ваш домен:{" "}
          <code>https://your-domain.com/api/trpc</code>
        </p>

        <h2 id="authentication">Аутентификация</h2>

        <p>
          tRPC API использует сессионную аутентификацию через NextAuth. Для
          доступа необходимо:
        </p>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li>Войти в систему через веб-интерфейс</li>
          <li>Использовать tRPC клиент с автоматической передачей cookies</li>
          <li>
            Указывать workspaceId в запросах, требующих контекста workspace
          </li>
        </ol>

        <DocsCallout type="info" title="Типобезопасность">
          tRPC клиент автоматически предоставляет полную типизацию всех методов,
          параметров и возвращаемых значений. Ошибки типов обнаруживаются на
          этапе компиляции.
        </DocsCallout>

        <h2 id="endpoints">Доступные роутеры</h2>

        <p>API организован в 20 доменных роутеров:</p>

        <div className="my-6 grid gap-3">
          {[
            {
              name: "analytics",
              description: "Дашборды, статистика, экспорт данных",
            },
            {
              name: "candidates",
              description: "Управление кандидатами, этапы, комментарии",
            },
            {
              name: "chat",
              description: "AI-ассистент, сообщения, сессии чата",
            },
            { name: "company", description: "Информация о компании" },
            {
              name: "custom-domain",
              description: "Настройка кастомных доменов",
            },
            { name: "files", description: "Загрузка и управление файлами" },
            {
              name: "freelance-platforms",
              description: "Интеграция с фриланс-платформами",
            },
            { name: "funnel", description: "Управление воронкой найма" },
            { name: "gig", description: "Gig-задания и отклики" },
            {
              name: "integration",
              description: "Настройка интеграций (HH.ru и др.)",
            },
            { name: "organization", description: "Управление организацией" },
            {
              name: "prequalification",
              description: "Преквалификация кандидатов",
            },
            { name: "recruiter-agent", description: "AI-агент рекрутера" },
            { name: "telegram", description: "Telegram-бот и интервью" },
            { name: "test", description: "Тестовые методы (только dev)" },
            { name: "user", description: "Профиль пользователя" },
            { name: "utils", description: "Вспомогательные методы" },
            { name: "vacancy", description: "Управление вакансиями" },
            { name: "widget-config", description: "Настройка виджетов" },
            {
              name: "workspace",
              description: "Управление workspace и участниками",
            },
          ].map((router) => (
            <div
              key={router.name}
              className="rounded-lg border border-border p-3"
            >
              <code className="text-sm font-medium text-primary">
                {router.name}
              </code>
              <p className="text-sm text-muted-foreground mt-1">
                {router.description}
              </p>
            </div>
          ))}
        </div>

        <DocsCallout type="tip" title="Структура API">
          Каждый роутер содержит набор процедур (query для чтения, mutation для
          изменения данных). Все процедуры валидируются через Zod схемы и
          автоматически типизированы.
        </DocsCallout>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/analytics"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Аналитика
          </Link>
          <Link
            href="/integrations"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Интеграции
            <span className="group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  );
}
