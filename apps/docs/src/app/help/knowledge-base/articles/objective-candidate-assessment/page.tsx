import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";

export default function ObjectiveCandidateAssessmentPage() {
  const tocItems = [
    { id: "bias", title: "Проблема предвзятости", level: 2 },
    { id: "methods", title: "Методы оценки", level: 2 },
    { id: "scoring", title: "Система оценки", level: 2 },
    { id: "tips", title: "Практические советы", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "База знаний", href: "/help/knowledge-base" },
            { title: "Как оценивать кандидатов объективно" },
          ]}
        />

        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
            Лучшие практики
          </span>
          <span className="text-sm text-muted-foreground">10 мин чтения</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Как оценивать кандидатов объективно
        </h1>

        <p className="text-lg text-muted-foreground mb-8">
          Методы снижения предвзятости при оценке резюме и проведении интервью
        </p>

        <h2
          id="bias"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Проблема: мы все предвзяты
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Исследования показывают, что рекрутеры принимают решение о кандидате в
          первые 7 секунд просмотра резюме. Это решение основано не на навыках,
          а на бессознательных предубеждениях.
        </p>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3">
            Типы предвзятости:
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              🎓 Образовательная — предпочтение выпускников престижных вузов
            </li>
            <li>👔 Внешняя — оценка по фото, имени, возрасту</li>
            <li>🏢 Опытная — "он работал в Google, значит хороший"</li>
            <li>🤝 Аффинити — "он похож на меня, значит подходит"</li>
            <li>⚡ Эффект ореола — одно качество затмевает остальные</li>
          </ul>
        </div>

        <h2
          id="methods"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          5 методов объективной оценки
        </h2>

        <div className="space-y-6 my-6">
          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              1. Структурированные интервью
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Задавайте всем кандидатам одинаковые вопросы в одинаковом порядке.
              Оценивайте ответы по заранее определённым критериям.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              2. Слепой скрининг резюме
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Скрывайте имя, фото, возраст, пол при первичной оценке.
              Фокусируйтесь только на навыках и опыте.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              3. Тестовые задания
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Практические задачи показывают реальные навыки лучше, чем рассказы
              о опыте.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              4. Коллективная оценка
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Несколько интервьюеров независимо оценивают кандидата, затем
              сравнивают оценки.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              5. Система баллов
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Оценивайте каждый навык по шкале 1-5. Суммируйте баллы для
              объективного сравнения.
            </p>
          </div>
        </div>

        <h2
          id="scoring"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Пример системы оценки
        </h2>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3">
            Критерии для Python-разработчика:
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium">Технические навыки (40%):</p>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Python — 1-5 баллов</li>
                <li>• Django/Flask — 1-5 баллов</li>
                <li>• Базы данных — 1-5 баллов</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Опыт (30%):</p>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Релевантность проектов — 1-5 баллов</li>
                <li>• Продолжительность работы — 1-5 баллов</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Софт-скиллы (30%):</p>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Коммуникация — 1-5 баллов</li>
                <li>• Мотивация — 1-5 баллов</li>
              </ul>
            </div>
          </div>
        </div>

        <h2
          id="tips"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Практические советы
        </h2>

        <ul className="space-y-3 mb-6">
          <li>
            <strong className="font-semibold text-foreground">
              Записывайте интервью
            </strong>{" "}
            — это помогает пересмотреть оценку без эмоций
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Делайте паузы
            </strong>{" "}
            — не принимайте решение сразу после интервью
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Проверяйте себя
            </strong>{" "}
            — спрашивайте "почему я так решил?"
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Используйте данные
            </strong>{" "}
            — опирайтесь на факты, а не на ощущения
          </li>
        </ul>

        <DocsCallout type="tip" title="Совет">
          Автоматические системы оценки помогают снизить предвзятость на 60-70%.
          Они оценивают только навыки и опыт, игнорируя внешние факторы.
        </DocsCallout>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/help/knowledge-base"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            База знаний
          </Link>
          <Link
            href="/screening"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            AI-скрининг
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
