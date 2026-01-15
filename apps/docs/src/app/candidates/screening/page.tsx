import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsEditLink } from "@/components/docs/docs-edit-link";
import { DocsFeedback } from "@/components/docs/docs-feedback";
import { DocsMobileToc } from "@/components/docs/docs-mobile-toc";
import { DocsSteps } from "@/components/docs/docs-steps";
import { DocsToc } from "@/components/docs/docs-toc";

export default function ScreeningPage() {
  const tocItems = [
    { id: "how-it-works", title: "Как это работает", level: 2 },
    { id: "criteria-setup", title: "Настройка критериев", level: 2 },
    { id: "results", title: "Результаты скрининга", level: 2 },
    { id: "bulk-processing", title: "Массовая обработка", level: 2 },
    { id: "best-practices", title: "Лучшие практики", level: 2 },
  ];

  const setupSteps = [
    {
      title: "Откройте настройки вакансии",
      content: (
        <p>
          Перейдите в раздел «Вакансии» и выберите нужную вакансию. Нажмите на
          вкладку «Критерии скрининга» в карточке вакансии.
        </p>
      ),
    },
    {
      title: "Добавьте обязательные требования",
      content: (
        <p>
          Укажите навыки, опыт и квалификации, без которых кандидат не может
          быть рассмотрен. Например: «Опыт работы от 3 лет», «Знание Python».
        </p>
      ),
    },
    {
      title: "Настройте желательные критерии",
      content: (
        <p>
          Добавьте критерии, которые повысят рейтинг кандидата, но не являются
          обязательными. Например: «Опыт работы в стартапе», «Сертификат AWS».
        </p>
      ),
    },
    {
      title: "Установите веса критериев",
      content: (
        <p>
          Определите важность каждого критерия от 1 до 10. Критерии с большим
          весом сильнее влияют на итоговый балл кандидата.
        </p>
      ),
    },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "Работа с кандидатами", href: "/candidates" },
            { title: "AI-скрининг" },
          ]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">
            Работа с кандидатами
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">AI-скрининг резюме</h1>

        <p className="text-lg">
          AI-скрининг автоматически анализирует отклики кандидатов и определяет
          их соответствие требованиям вакансии. Это позволяет сэкономить до 80%
          времени на первичном отборе.
        </p>

        <DocsMobileToc items={tocItems} />

        <h2 id="how-it-works" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Как это работает</h2>

        <p>
          Когда новый отклик поступает в систему (из интеграций или загруженный
          вручную), AI выполняет следующие шаги:
        </p>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li>
            <strong className="font-semibold text-foreground">Парсинг резюме</strong> — извлечение структурированных
            данных: контакты, опыт работы, навыки, образование
          </li>
          <li>
            <strong className="font-semibold text-foreground">Анализ опыта</strong> — определение релевантного опыта,
            расчёт общего стажа
          </li>
          <li>
            <strong className="font-semibold text-foreground">Сопоставление с требованиями</strong> — сравнение навыков и
            опыта кандидата с вакансией
          </li>
          <li>
            <strong className="font-semibold text-foreground">Оценка соответствия</strong> — расчёт итогового балла от 1
            до 5 звезд
          </li>
        </ol>

        <DocsCallout type="info" title="Скорость обработки">
          AI обрабатывает один отклик за 2-5 секунд. При массовом импорте с
          HH.ru обработка происходит параллельно через фоновые задачи (Inngest).
        </DocsCallout>

        <h2 id="criteria-setup" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Настройка критериев скрининга</h2>

        <p>
          Точность AI-скрининга напрямую зависит от качества настроенных
          критериев. Следуйте этим шагам для оптимальной настройки:
        </p>

        <DocsSteps steps={setupSteps} />

        <h2 id="results" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Результаты скрининга</h2>

        <p className="leading-relaxed text-foreground/80 mb-4">После скрининга каждый отклик получает:</p>

        <ul>
          <li>
            <strong className="font-semibold text-foreground">Балл соответствия</strong> — число от 0 до 100, показывающее
            общее соответствие требованиям
          </li>
          <li>
            <strong className="font-semibold text-foreground">Этап воронки</strong> — автоматический переход на этап
            SCREENING_DONE при успешном скрининге
          </li>
          <li>
            <strong className="font-semibold text-foreground">Детальный отчёт</strong> — разбивка по каждому критерию с
            пояснениями AI
          </li>
          <li>
            <strong className="font-semibold text-foreground">Выявленные риски</strong> — потенциальные проблемы (частая
            смена работы, пробелы в опыте)
          </li>
        </ul>

        <DocsCallout type="tip" title="Совет">
          Регулярно проверяйте точность скрининга, сравнивая решения AI с вашими
          оценками. Это поможет улучшить критерии и повысить качество отбора.
        </DocsCallout>

        <h2 id="bulk-processing" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Массовая обработка</h2>

        <p>
          QBS Автонайм поддерживает массовый импорт откликов из различных
          источников. После импорта все отклики автоматически проходят скрининг.
        </p>

        <p className="leading-relaxed text-foreground/80 mb-4">Способы массового импорта:</p>

        <ul>
          <li>
            <strong className="font-semibold text-foreground">Интеграция с hh.ru</strong> — автоматический импорт откликов
            на ваши вакансии
          </li>
          <li>
            <strong className="font-semibold text-foreground">Загрузка файлов</strong> — поддержка PDF, DOC, DOCX (до 100
            файлов за раз)
          </li>
          <li>
            <strong className="font-semibold text-foreground">tRPC API</strong> — программный импорт через
            candidates.create
          </li>
        </ul>

        <h2 id="best-practices" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Лучшие практики</h2>

        <ul>
          <li>
            <strong className="font-semibold text-foreground">Начните с малого</strong> — добавьте 5-7 ключевых критериев,
            затем расширяйте по мере необходимости
          </li>
          <li>
            <strong className="font-semibold text-foreground">Используйте конкретные формулировки</strong> — вместо
            «хорошие навыки коммуникации» укажите «опыт проведения презентаций»
          </li>
          <li>
            <strong className="font-semibold text-foreground">Регулярно обновляйте критерии</strong> — рынок меняется, и
            требования к кандидатам тоже
          </li>
          <li>
            <strong className="font-semibold text-foreground">Анализируйте результаты</strong> — если много «ложных
            срабатываний», пересмотрите критерии
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
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Обзор
          </Link>
          <Link
            href="/candidates/scoring"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Скоринг кандидатов
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
