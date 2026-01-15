import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb"
import { DocsCallout } from "@/components/docs/docs-callout"
import { DocsToc } from "@/components/docs/docs-toc"
import { DocsCode } from "@/components/docs/docs-code"
import { DocsTabs } from "@/components/docs/docs-tabs"
import Link from "next/link"

export default function APIAuthenticationPage() {
  const tocItems = [
    { id: "authentication", title: "Аутентификация", level: 2 },
    { id: "using-session", title: "Использование сессии", level: 2 },
    { id: "workspace-access", title: "Доступ к workspace", level: 2 },
  ]

  const codeExamples = [
    {
      label: "JavaScript",
      value: "javascript",
      content: (
        <DocsCode
          code={`import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@qbs-autonaim/api';

const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/api/trpc',
      headers: () => ({
        // Сессия передается автоматически через cookies
        'Content-Type': 'application/json',
      }),
    }),
  ],
});

// Получение списка кандидатов
const candidates = await trpc.candidates.list({
  workspaceId: 'ws_123',
  limit: 20,
});`}
          language="javascript"
        />
      ),
    },
    {
      label: "React",
      value: "react",
      content: (
        <DocsCode
          code={`import { trpc } from '@/utils/trpc';

function CandidatesList() {
  const { data, isLoading } = trpc.candidates.list.useQuery({
    workspaceId: 'ws_123',
    limit: 20,
  });

  if (isLoading) return <div>Загрузка...</div>;

  return (
    <div>
      {data?.items.map(candidate => (
        <div key={candidate.id}>{candidate.name}</div>
      ))}
    </div>
  );
}`}
          language="tsx"
        />
      ),
    },
    {
      label: "Python",
      value: "python",
      content: (
        <DocsCode
          code={`# Для Python используйте tRPC-совместимый клиент
# или делайте HTTP запросы к tRPC эндпоинтам

import requests

session = requests.Session()
# Сессия будет передаваться через cookies

response = session.post(
    'http://localhost:3000/api/trpc/candidates.list',
    json={
        "workspaceId": "ws_123",
        "limit": 20
    }
)

candidates = response.json()`}
          language="python"
        />
      ),
    },
  ]

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb items={[{ title: "API", href: "/api" }, { title: "Аутентификация" }]} />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">API</span>
        </div>

        <h1>Аутентификация API</h1>

        <p className="text-lg">
          Для доступа к tRPC API QBS Автонайм необходимо использовать сессию пользователя. В этом разделе описано, как настроить аутентификацию запросов.
        </p>

        <h2 id="authentication">Аутентификация</h2>

        <p>
          QBS Автонайм использует tRPC с сессионной аутентификацией. Для доступа к API необходимо:
        </p>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li><strong>Войти в систему</strong> — через email/пароль или OAuth</li>
          <li><strong>Получить сессию</strong> — сессия создается автоматически при входе</li>
          <li><strong>Использовать сессию</strong> — передавать в каждом tRPC запросе</li>
        </ol>

        <DocsCallout type="warning" title="Важно">
          Сессия пользователя предоставляет доступ ко всем workspace, где пользователь имеет права. Убедитесь, что вы проверяете права доступа для каждого запроса.
        </DocsCallout>

        <h2 id="using-session">Использование сессии</h2>

        <p>При работе с tRPC сессия передается автоматически через контекст:</p>

        <DocsTabs tabs={codeExamples} defaultValue="javascript" />

        <DocsCallout type="info" title="tRPC Client">
          Рекомендуется использовать официальный tRPC клиент для автоматической обработки сессий и типизации.
        </DocsCallout>

        <h2 id="workspace-access">Доступ к workspace</h2>

        <p>Каждый tRPC запрос требует указания workspaceId и проверяет права доступа:</p>

        <div className="my-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-foreground">Роль</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Права доступа</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-sm text-foreground">Owner</td>
                <td className="px-4 py-3 text-muted-foreground">Полный доступ ко всем функциям</td>
              </tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-sm text-foreground">Admin</td>
                <td className="px-4 py-3 text-muted-foreground">Управление вакансиями, кандидатами, настройками</td>
              </tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-sm text-foreground">Recruiter</td>
                <td className="px-4 py-3 text-muted-foreground">Работа с кандидатами и вакансиями</td>
              </tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-sm text-foreground">Viewer</td>
                <td className="px-4 py-3 text-muted-foreground">Только чтение данных</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/api"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            Введение
          </Link>
          <Link
            href="/api/candidates"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Кандидаты
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  )
}
