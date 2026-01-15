import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb"
import { DocsCallout } from "@/components/docs/docs-callout"
import { DocsToc } from "@/components/docs/docs-toc"
import { DocsCode } from "@/components/docs/docs-code"
import { DocsTabs } from "@/components/docs/docs-tabs"
import Link from "next/link"

export default function APIAuthenticationPage() {
  const tocItems = [
    { id: "api-keys", title: "API-ключи", level: 2 },
    { id: "creating-key", title: "Создание ключа", level: 2 },
    { id: "using-key", title: "Использование", level: 2 },
    { id: "scopes", title: "Области доступа", level: 2 },
  ]

  const codeExamples = [
    {
      label: "cURL",
      value: "curl",
      content: (
        <DocsCode
          code={`curl -X GET "https://api.qbs-autonaim.ru/v1/candidates" \\
  -H "Authorization: Bearer qbs_live_abc123xyz789..." \\
  -H "Content-Type: application/json"`}
          language="bash"
        />
      ),
    },
    {
      label: "JavaScript",
      value: "javascript",
      content: (
        <DocsCode
          code={`const response = await fetch('https://api.qbs-autonaim.ru/v1/candidates', {
  headers: {
    'Authorization': 'Bearer ' + process.env.QBS_API_KEY,
    'Content-Type': 'application/json'
  }
});

const candidates = await response.json();`}
          language="javascript"
        />
      ),
    },
    {
      label: "Python",
      value: "python",
      content: (
        <DocsCode
          code={`import requests
import os

response = requests.get(
    'https://api.qbs-autonaim.ru/v1/candidates',
    headers={
        'Authorization': f'Bearer {os.environ["QBS_API_KEY"]}',
        'Content-Type': 'application/json'
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
        <DocsBreadcrumb items={[{ title: "API", href: "/docs/api" }, { title: "Аутентификация" }]} />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">API</span>
        </div>

        <h1>Аутентификация API</h1>

        <p className="text-lg">
          Для доступа к API QBS Автонайм необходимо использовать API-ключ. В этом разделе описано, как создать ключ и
          использовать его для аутентификации запросов.
        </p>

        <h2 id="api-keys">API-ключи</h2>

        <p>
          API-ключ — это секретный токен, который идентифицирует ваше приложение при обращении к API. Каждый ключ имеет
          определённые права доступа и может быть отозван в любой момент.
        </p>

        <DocsCallout type="warning" title="Важно">
          API-ключ предоставляет полный доступ к данным вашего аккаунта. Обращайтесь с ним как с паролем — не
          передавайте третьим лицам и не публикуйте в открытом доступе.
        </DocsCallout>

        <h2 id="creating-key">Создание API-ключа</h2>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li>{"Войдите в личный кабинет QBS Автонайм"}</li>
          <li>{"Перейдите в «Настройки» → «API»"}</li>
          <li>{"Нажмите «Создать API-ключ»"}</li>
          <li>Введите название ключа (например, «Интеграция с CRM»)</li>
          <li>Выберите области доступа (scopes)</li>
          <li>{"Нажмите «Создать»"}</li>
          <li>Скопируйте ключ — он будет показан только один раз</li>
        </ol>

        <h2 id="using-key">Использование API-ключа</h2>

        <p>Добавляйте API-ключ в заголовок Authorization каждого запроса:</p>

        <DocsCode
          code={`Authorization: Bearer qbs_live_abc123xyz789...`}
          language="text"
          title="Заголовок авторизации"
        />

        <p>Примеры запросов на разных языках:</p>

        <DocsTabs tabs={codeExamples} defaultValue="curl" />

        <h2 id="scopes">Области доступа (Scopes)</h2>

        <p>При создании API-ключа вы можете ограничить его права:</p>

        <div className="my-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-foreground">Scope</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Описание</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-sm text-foreground">candidates:read</td>
                <td className="px-4 py-3 text-muted-foreground">Чтение данных кандидатов</td>
              </tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-sm text-foreground">candidates:write</td>
                <td className="px-4 py-3 text-muted-foreground">Создание и изменение кандидатов</td>
              </tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-sm text-foreground">vacancies:read</td>
                <td className="px-4 py-3 text-muted-foreground">Чтение данных вакансий</td>
              </tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-sm text-foreground">vacancies:write</td>
                <td className="px-4 py-3 text-muted-foreground">Создание и изменение вакансий</td>
              </tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-sm text-foreground">analytics:read</td>
                <td className="px-4 py-3 text-muted-foreground">Доступ к аналитике</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/docs/api"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            Введение
          </Link>
          <Link
            href="/docs/api/candidates"
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
