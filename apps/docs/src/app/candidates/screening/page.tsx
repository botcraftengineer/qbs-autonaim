import { DocsBreadcrumb } from "@/components/docs-breadcrumb"
import { DocsCallout } from "@/components/docs-callout"
import { DocsSteps } from "@/components/docs-steps"
import { DocsToc } from "@/components/docs-toc"
import { DocsFeedback } from "@/components/docs-feedback"
import { DocsMobileToc } from "@/components/docs-mobile-toc"
import { DocsEditLink } from "@/components/docs-edit-link"
import Link from "next/link"

export default function ScreeningPage() {
  const tocItems = [
    { id: "how-it-works", title: "Как это работает", level: 2 },
    { id: "criteria-setup", title: "Настройка критериев", level: 2 },
    { id: "results", title: "Результаты скрининга", level: 2 },
    { id: "bulk-processing", title: "Массовая обработка", level: 2 },
    { id: "best-practices", title: "Лучшие практики", level: 2 },
  ]

  const setupSteps = [
    {
      title: "Откройте настройки вакансии",
      content: (
        <p>
          Перейдите в раздел «Вакансии» и выберите нужную вакансию. Нажмите на вкладку «Критерии скрининга» в карточке
          вакансии.
        </p>
      ),
    },
    {
      title: "Добавьте обязательные требования",
      content: (
        <p>
          Укажите навыки, опыт и квалификации, без которых кандидат не может быть рассмотрен. Например: «Опыт работы от
          3 лет», «Знание Python».
        </p>
      ),
    },
    {
      title: "Настройте желательные критерии",
      content: (
        <p>
          Добавьте критерии, которые повысят рейтинг кандидата, но не являются обязательными. Например: «Опыт работы в
          стартапе», «Сертификат AWS».
        </p>
      ),
    },
    {
      title: "Установите веса критериев",
      content: (
        <p>
          Определите важность каждого критерия от 1 до 10. Критерии с большим весом сильнее влияют на итоговый балл
          кандидата.
        </p>
      ),
    },
  ]

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[{ title: "Работа с кандидатами", href: "/candidates" }, { title: "AI-скрининг" }]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">Работа с кандидатами</span>
        </div>

        <h1>AI-скрининг резюме</h1>

        <p className="text-lg">
          AI-скрининг автоматически анализирует резюме кандидатов и определяет их соответствие требованиям вакансии. Это
          позволяет сэкономить до 80% времени на первичном отборе.
        </p>

        <DocsMobileToc items={tocItems} />

        <h2 id="how-it-works">Как это работает</h2>

        <p>
          Когда новое резюме поступает в систему (из интеграции или загруженное вручную), AI выполняет следующие шаги:
        </p>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li>
            <strong>Парсинг резюме</strong> — извлечение структурированных данных: контакты, опыт работы, навыки,
            образование
          </li>
          <li>
            <strong>Анализ опыта</strong> — определение релевантного опыта, расчёт общего стажа в нужной области
          </li>
          <li>
            <strong>Сопоставление навыков</strong> — сравнение навыков кандидата с требованиями вакансии
          </li>
          <li>
            <strong>Оценка соответствия</strong> — расчёт итогового балла и категоризация кандидата
          </li>
        </ol>

        <DocsCallout type="info" title="Скорость обработки">
          AI обрабатывает одно резюме за 2-5 секунд. При массовом импорте (например, 100+ резюме) обработка происходит
          параллельно.
        </DocsCallout>

        <h2 id="criteria-setup">Настройка критериев скрининга</h2>

        <p>
          Точность AI-скрининга напрямую зависит от качества настроенных критериев. Следуйте этим шагам для оптимальной
          настройки:
        </p>

        <DocsSteps steps={setupSteps} />

        <h2 id="results">Результаты скрининга</h2>

        <p>После скрининга каждый кандидат получает:</p>

        <ul>
          <li>
            <strong>Балл соответствия</strong> — число от 0 до 100, показывающее общее соответствие требованиям
          </li>
          <li>
            <strong>Категорию</strong> — «Рекомендован» (80+), «Требует внимания» (50-79), «Не рекомендован» (0-49)
          </li>
          <li>
            <strong>Детальный отчёт</strong> — разбивка по каждому критерию с пояснениями AI
          </li>
          <li>
            <strong>Выявленные риски</strong> — потенциальные проблемы (частая смена работы, пробелы в опыте)
          </li>
        </ul>

        <DocsCallout type="tip" title="Совет">
          Регулярно проверяйте точность скрининга, сравнивая решения AI с вашими оценками. Это поможет улучшить критерии
          и повысить качество отбора.
        </DocsCallout>

        <h2 id="bulk-processing">Массовая обработка</h2>

        <p>
          QBS Автонайм поддерживает массовый импорт резюме из различных источников. После импорта все резюме
          автоматически проходят скрининг.
        </p>

        <p>Способы массового импорта:</p>

        <ul>
          <li>
            <strong>Интеграция с hh.ru</strong> — автоматический импорт откликов на ваши вакансии
          </li>
          <li>
            <strong>Загрузка файлов</strong> — поддержка PDF, DOC, DOCX (до 100 файлов за раз)
          </li>
          <li>
            <strong>API</strong> — программный импорт через REST API
          </li>
        </ul>

        <h2 id="best-practices">Лучшие практики</h2>

        <ul>
          <li>
            <strong>Начните с малого</strong> — добавьте 5-7 ключевых критериев, затем расширяйте по мере необходимости
          </li>
          <li>
            <strong>Используйте конкретные формулировки</strong> — вместо «хорошие навыки коммуникации» укажите «опыт
            проведения презентаций»
          </li>
          <li>
            <strong>Регулярно обновляйте критерии</strong> — рынок меняется, и требования к кандидатам тоже
          </li>
          <li>
            <strong>Анализируйте результаты</strong> — если много «ложных срабатываний», пересмотрите критерии
          </li>
        </ul>

        <div className="my-8 space-y-4">
          <DocsFeedback />
          <DocsEditLink path="app/candidates/screening/page.tsx" />
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/candidates"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            Обзор
          </Link>
          <Link
            href="/candidates/scoring"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Скоринг кандидатов
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  )
}
