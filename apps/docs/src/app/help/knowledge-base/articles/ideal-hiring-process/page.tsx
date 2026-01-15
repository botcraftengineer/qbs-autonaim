import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";

export default function IdealHiringProcessPage() {
  const tocItems = [
    { id: "overview", title: "Обзор процесса", level: 2 },
    { id: "stages", title: "Этапы найма", level: 2 },
    { id: "optimization", title: "Оптимизация", level: 2 },
    { id: "checklist", title: "Чек-лист", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "База знаний", href: "/help/knowledge-base" },
            { title: "Структура идеального процесса найма" },
          ]}
        />

        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
            Лучшие практики
          </span>
          <span className="text-sm text-muted-foreground">6 мин чтения</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Структура идеального процесса найма
        </h1>

        <p className="text-lg text-muted-foreground mb-8">
          От отклика до оффера: как оптимизировать каждый этап и сократить время
          найма без потери качества
        </p>

        <h2
          id="overview"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Почему структура процесса важна
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Хаотичный процесс найма приводит к потере хороших кандидатов,
          затягиванию сроков и разочарованию команды. Чёткая структура помогает
          всем участникам понимать свою роль и ожидания.
        </p>

        <h2
          id="stages"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          7 этапов идеального процесса найма
        </h2>

        <div className="space-y-6 my-6">
          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Этап 1: Подготовка (1-2 дня)
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Определите требования, согласуйте с командой, подготовьте описание
              вакансии.
            </p>
            <ul className="text-sm space-y-1 ml-4">
              <li>• Встреча с нанимающим менеджером</li>
              <li>• Составление профиля кандидата</li>
              <li>• Написание привлекательной вакансии</li>
            </ul>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Этап 2: Публикация (1 день)
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Разместите вакансию на всех релевантных площадках одновременно.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Этап 3: Скрининг резюме (1-3 дня)
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Автоматический или ручной отбор подходящих кандидатов.
            </p>
            <DocsCallout type="tip" title="Совет">
              Используйте автоматический скрининг для экономии 80% времени на
              этом этапе.
            </DocsCallout>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Этап 4: Первичное интервью (3-5 дней)
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Короткий звонок 15-30 минут для проверки базовых требований и
              мотивации.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Этап 5: Техническое интервью (5-7 дней)
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Глубокая проверка навыков, тестовое задание или практический кейс.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Этап 6: Финальное интервью (2-3 дня)
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Встреча с руководителем, обсуждение условий, знакомство с
              командой.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Этап 7: Оффер и онбординг (1-2 дня)
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Отправка оффера, согласование деталей, подготовка к выходу.
            </p>
          </div>
        </div>

        <div className="my-6 rounded-lg border border-green-500/30 bg-green-500/5 p-6">
          <h3 className="font-semibold text-foreground mb-3">
            Итого: 14-23 дня от отклика до оффера
          </h3>
          <p className="text-sm text-muted-foreground">
            Это оптимальный срок для большинства позиций. Быстрее — риск ошибки
            в найме. Медленнее — потеря хороших кандидатов.
          </p>
        </div>

        <h2
          id="optimization"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Как оптимизировать процесс
        </h2>

        <ul className="space-y-3 mb-6">
          <li>
            <strong className="font-semibold text-foreground">
              Параллельные этапы
            </strong>{" "}
            — проводите техническое и культурное интервью в один день
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Асинхронные интервью
            </strong>{" "}
            — кандидат записывает ответы в удобное время
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Быстрая обратная связь
            </strong>{" "}
            — отвечайте кандидатам в течение 24 часов
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Автоматизация рутины
            </strong>{" "}
            — используйте шаблоны, автоответы, напоминания
          </li>
        </ul>

        <h2
          id="checklist"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Чек-лист идеального процесса
        </h2>

        <div className="my-6 rounded-lg border border-border p-6">
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span className="text-sm">
                Чёткие критерии отбора на каждом этапе
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span className="text-sm">Все участники знают свою роль</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span className="text-sm">
                Автоматические уведомления кандидатам
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span className="text-sm">Обратная связь в течение 24 часов</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span className="text-sm">
                Измеряемые метрики на каждом этапе
              </span>
            </li>
          </ul>
        </div>

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
            href="/quickstart"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Начать работу
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
