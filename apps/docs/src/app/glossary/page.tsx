import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsToc } from "@/components/docs/docs-toc";

const glossaryTerms = [
  {
    term: "AI-скрининг",
    definition:
      "Автоматический анализ резюме кандидатов с помощью искусственного интеллекта для определения соответствия требованиям вакансии.",
    related: "/candidates/screening",
  },
  {
    term: "Скоринг",
    definition:
      "Система оценки кандидатов по заданным критериям, где каждому кандидату присваивается числовой балл от 0 до 100.",
    related: "/candidates/scoring",
  },
  {
    term: "Воронка найма",
    definition:
      "Визуализация этапов процесса найма — от первичного отклика до выхода на работу. Помогает отслеживать конверсию на каждом этапе.",
    related: "/candidates/pipeline",
  },
  {
    term: "AI-ассистент",
    definition:
      "Интеллектуальный помощник, который автоматически общается с кандидатами, отвечает на вопросы и назначает собеседования.",
    related: "/ai-assistant",
  },
  {
    term: "Автоответы",
    definition:
      "Автоматические сообщения, которые AI-ассистент отправляет кандидатам в ответ на их вопросы или действия.",
    related: "/ai-assistant/auto-replies",
  },
  {
    term: "Интеграция",
    definition:
      "Подключение внешних систем к QBS Автонайм. Поддерживаются HH.ru, SuperJob, Telegram, 1C и другие платформы.",
    related: "/integrations",
  },
  {
    term: "Метрики найма",
    definition:
      "Количественные показатели эффективности процесса найма: время закрытия вакансии, конверсия, стоимость найма и другие.",
    related: "/analytics/metrics",
  },
  {
    term: "Интеграция",
    definition:
      "Подключение внешних сервисов (job-сайтов, мессенджеров, CRM) к QBS Автонайм для автоматического обмена данными.",
    related: "/integrations",
  },
  {
    term: "Пайплайн",
    definition:
      "Последовательность этапов, через которые проходит кандидат в процессе найма. Синоним воронки найма.",
    related: "/candidates/pipeline",
  },
];

export default function GlossaryPage() {
  const tocItems = glossaryTerms.map((item) => ({
    id: item.term.toLowerCase().replace(/\s+/g, "-"),
    title: item.term,
    level: 2,
  }));

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "Начало работы", href: "/docs" },
            { title: "Глоссарий" },
          ]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">
            Начало работы
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">Глоссарий</h1>

        <p className="text-lg">
          Справочник основных терминов и понятий, используемых в QBS Автонайм.
          Если вы встретили незнакомое слово в документации — найдите его здесь.
        </p>

        <div className="mt-8 flex flex-col gap-6">
          {glossaryTerms.map((item) => (
            <div
              key={item.term}
              id={item.term.toLowerCase().replace(/\s+/g, "-")}
              className="scroll-mt-20 rounded-lg border border-border p-5"
            >
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {item.term}
              </h3>
              <p className="text-muted-foreground mb-3">{item.definition}</p>
              {item.related && (
                <Link
                  href={item.related}
                  className="text-sm text-primary hover:underline"
                >
                  Подробнее →
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/quickstart"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Быстрый старт
          </Link>
          <Link
            href="/candidates"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Работа с кандидатами
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
