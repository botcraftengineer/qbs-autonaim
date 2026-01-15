import { DocsBreadcrumb } from "@/components/docs-breadcrumb"
import { DocsCallout } from "@/components/docs-callout"
import { DocsToc } from "@/components/docs-toc"
import { DocsCode } from "@/components/docs-code"
import Link from "next/link"

export default function WebhooksPage() {
  const tocItems = [
    { id: "overview", title: "Обзор", level: 2 },
    { id: "events", title: "События", level: 2 },
    { id: "payload", title: "Формат данных", level: 2 },
    { id: "security", title: "Безопасность", level: 2 },
    { id: "retry", title: "Повторные попытки", level: 2 },
  ]

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb items={[{ title: "Интеграции", href: "/integrations" }, { title: "Webhooks" }]} />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">Интеграции</span>
        </div>

        <h1>Webhooks</h1>

        <p className="text-lg">
          Webhooks позволяют получать уведомления о событиях в QBS Автонайм в реальном времени. Используйте их для
          интеграции с внешними системами.
        </p>

        <h2 id="overview">Обзор</h2>

        <p>
          При наступлении события QBS Автонайм отправляет HTTP POST-запрос на указанный вами URL с данными о событии.
          Это позволяет автоматизировать процессы без постоянного опроса API.
        </p>

        <DocsCallout type="info" title="Требования">
          Ваш сервер должен отвечать HTTP 200 в течение 30 секунд. При других ответах запрос будет повторён.
        </DocsCallout>

        <h2 id="events">Доступные события</h2>

        <div className="my-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-foreground">Событие</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Описание</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3 font-mono text-sm text-foreground">candidate.created</td>
                <td className="px-4 py-3 text-muted-foreground">Новый кандидат добавлен в систему</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-sm text-foreground">candidate.updated</td>
                <td className="px-4 py-3 text-muted-foreground">Данные кандидата изменены</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-sm text-foreground">candidate.stage_changed</td>
                <td className="px-4 py-3 text-muted-foreground">Кандидат перемещён на другой этап воронки</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-sm text-foreground">interview.scheduled</td>
                <td className="px-4 py-3 text-muted-foreground">Назначено собеседование</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-sm text-foreground">vacancy.created</td>
                <td className="px-4 py-3 text-muted-foreground">Создана новая вакансия</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-sm text-foreground">vacancy.closed</td>
                <td className="px-4 py-3 text-muted-foreground">Вакансия закрыта</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="payload">Формат данных</h2>

        <p>Каждый webhook содержит следующую структуру:</p>

        <DocsCode
          title="Пример payload"
          language="json"
          code={`{
  "event": "candidate.stage_changed",
  "timestamp": "2025-01-14T12:00:00Z",
  "data": {
    "candidate_id": "cand_abc123",
    "vacancy_id": "vac_xyz789",
    "previous_stage": "screening",
    "new_stage": "hr_interview",
    "changed_by": "user_456"
  },
  "webhook_id": "wh_def456"
}`}
        />

        <h2 id="security">Безопасность</h2>

        <p>Для проверки подлинности webhook используйте подпись в заголовке:</p>

        <DocsCode title="Заголовок подписи" language="text" code={`X-QBS-Signature: sha256=abc123...`} />

        <p>Проверьте подпись, вычислив HMAC-SHA256 от тела запроса с вашим секретным ключом:</p>

        <DocsCode
          title="Проверка подписи (Node.js)"
          language="javascript"
          code={`const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return \`sha256=\${expected}\` === signature;
}`}
        />

        <h2 id="retry">Повторные попытки</h2>

        <p>При неудачной доставке QBS Автонайм повторяет отправку по следующему расписанию:</p>

        <ul>
          <li>1-я попытка — немедленно</li>
          <li>2-я попытка — через 1 минуту</li>
          <li>3-я попытка — через 5 минут</li>
          <li>4-я попытка — через 30 минут</li>
          <li>5-я попытка — через 2 часа</li>
        </ul>

        <DocsCallout type="warning" title="Важно">
          После 5 неудачных попыток webhook помечается как недоставленный. Вы получите уведомление и сможете повторить
          отправку вручную.
        </DocsCallout>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/integrations/telegram"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            Telegram
          </Link>
          <Link
            href="/api"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            API
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  )
}
