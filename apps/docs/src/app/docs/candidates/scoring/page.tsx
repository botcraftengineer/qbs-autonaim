import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb"
import { DocsCallout } from "@/components/docs/docs-callout"
import { DocsToc } from "@/components/docs/docs-toc"
import { DocsCode } from "@/components/docs/docs-code"
import Link from "next/link"

export default function ScoringPage() {
  const tocItems = [
    { id: "scoring-system", title: "Система оценки", level: 2 },
    { id: "score-calculation", title: "Расчёт балла", level: 2 },
    { id: "weight-configuration", title: "Настройка весов", level: 2 },
    { id: "score-interpretation", title: "Интерпретация баллов", level: 2 },
    { id: "custom-criteria", title: "Пользовательские критерии", level: 2 },
  ]

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[{ title: "Работа с кандидатами", href: "/docs/candidates" }, { title: "Скоринг кандидатов" }]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">Работа с кандидатами</span>
        </div>

        <h1>Скоринг кандидатов</h1>

        <p className="text-lg">
          Система скоринга присваивает каждому кандидату числовой балл от 0 до 100, что позволяет объективно сравнивать
          кандидатов и приоритизировать работу с ними.
        </p>

        <h2 id="scoring-system">Система оценки</h2>

        <p>Скоринг в QBS Автонайм основан на взвешенной оценке по нескольким категориям:</p>

        <div className="my-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-foreground">Категория</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Описание</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Вес по умолчанию</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3 text-foreground">Навыки</td>
                <td className="px-4 py-3 text-muted-foreground">Соответствие требуемым компетенциям</td>
                <td className="px-4 py-3 text-muted-foreground">30%</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">Опыт</td>
                <td className="px-4 py-3 text-muted-foreground">Релевантный опыт работы</td>
                <td className="px-4 py-3 text-muted-foreground">25%</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">Образование</td>
                <td className="px-4 py-3 text-muted-foreground">Уровень и профиль образования</td>
                <td className="px-4 py-3 text-muted-foreground">15%</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">Локация</td>
                <td className="px-4 py-3 text-muted-foreground">Соответствие географическим требованиям</td>
                <td className="px-4 py-3 text-muted-foreground">10%</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">Дополнительно</td>
                <td className="px-4 py-3 text-muted-foreground">Сертификаты, языки, другие факторы</td>
                <td className="px-4 py-3 text-muted-foreground">20%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="score-calculation">Расчёт балла</h2>

        <p>Итоговый балл кандидата рассчитывается по формуле:</p>

        <DocsCallout type="note">
          <strong>Балл = Σ (Оценка категории × Вес категории)</strong>
          <br />
          <br />
          Например, если кандидат получил 90 баллов за навыки (вес 30%), 70 за опыт (25%), 80 за образование (15%), 100
          за локацию (10%) и 60 за дополнительные критерии (20%), то итоговый балл: 90×0.3 + 70×0.25 + 80×0.15 + 100×0.1
          + 60×0.2 = <strong>78 баллов</strong>
        </DocsCallout>

        <h2 id="weight-configuration">Настройка весов</h2>

        <p>
          Вы можете изменить веса категорий для каждой вакансии в зависимости от её специфики. Например, для позиции
          разработчика можно увеличить вес навыков, а для позиции руководителя — вес опыта.
        </p>

        <p>Чтобы изменить веса:</p>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li>Откройте карточку вакансии</li>
          <li>{"Перейдите на вкладку «Скоринг»"}</li>
          <li>Настройте веса для каждой категории (сумма должна равняться 100%)</li>
          <li>{"Нажмите «Сохранить» — все кандидаты будут автоматически пересчитаны"}</li>
        </ol>

        <h2 id="score-interpretation">Интерпретация баллов</h2>

        <p>QBS Автонайм автоматически распределяет кандидатов по категориям на основе их баллов:</p>

        <div className="my-6 flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/5 p-4">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <div>
              <span className="font-medium text-foreground">80-100 баллов — Рекомендован</span>
              <p className="text-sm text-muted-foreground mt-1">
                Кандидат соответствует большинству требований. Рекомендуется приоритетная обработка.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="h-3 w-3 rounded-full bg-amber-500" />
            <div>
              <span className="font-medium text-foreground">50-79 баллов — Требует внимания</span>
              <p className="text-sm text-muted-foreground mt-1">
                Кандидат частично соответствует требованиям. Рекомендуется ручная проверка.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div>
              <span className="font-medium text-foreground">0-49 баллов — Не рекомендован</span>
              <p className="text-sm text-muted-foreground mt-1">
                Кандидат не соответствует ключевым требованиям. Автоматический отказ или архивирование.
              </p>
            </div>
          </div>
        </div>

        <h2 id="custom-criteria">Пользовательские критерии</h2>

        <p>
          Помимо стандартных категорий, вы можете добавлять собственные критерии оценки. Это полезно для специфических
          требований, которые не покрываются стандартными категориями.
        </p>

        <DocsCode
          title="Пример пользовательского критерия"
          language="json"
          code={`{
  "name": "Опыт работы с Kubernetes",
  "type": "boolean",
  "weight": 5,
  "required": false,
  "keywords": ["kubernetes", "k8s", "helm", "kubectl"]
}`}
        />

        <DocsCallout type="tip" title="Автоматическое обнаружение">
          AI автоматически ищет ключевые слова в резюме для оценки пользовательских критериев. Добавляйте синонимы и
          сокращения для повышения точности.
        </DocsCallout>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/docs/candidates/screening"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            AI-скрининг
          </Link>
          <Link
            href="/docs/candidates/pipeline"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Воронка найма
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  )
}
