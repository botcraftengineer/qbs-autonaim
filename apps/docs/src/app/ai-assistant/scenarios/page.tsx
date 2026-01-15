import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";
import Link from "next/link";

export default function ScenariosPage() {
  const tocItems = [
    { id: "what-is", title: "Что такое сценарии", level: 2 },
    { id: "creating", title: "Создание сценария", level: 2 },
    { id: "examples", title: "Примеры сценариев", level: 2 },
    { id: "best-practices", title: "Лучшие практики", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "AI-ассистент", href: "/ai-assistant" },
            { title: "Настройка сценариев интервью" },
          ]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">AI-ассистент</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Настройка сценариев интервью
        </h1>

        <p className="text-lg">
          Сценарии интервью позволяют настроить автоматические голосовые
          собеседования с кандидатами, адаптированные под конкретные вакансии и
          требования.
        </p>

        <h2
          id="what-is"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Что такое сценарии
        </h2>

        <p className="text-foreground/80">
          Сценарий интервью — это набор вопросов и правил, по которым
          AI-ассистент проводит собеседование с кандидатом. Каждый сценарий
          можно настроить под конкретную позицию, уровень сложности и формат
          интервью.
        </p>

        <h3 className="text-lg font-semibold text-foreground mt-8 mb-3 scroll-mt-20">
          Основные компоненты
        </h3>

        <ul>
          <li>
            <strong className="font-semibold text-foreground">Вопросы</strong> —
            список вопросов для кандидата
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Критерии оценки
            </strong>{" "}
            — параметры для анализа ответов
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Длительность
            </strong>{" "}
            — время на интервью
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Уровень сложности
            </strong>{" "}
            — junior, middle, senior
          </li>
        </ul>

        <h2
          id="creating"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Создание сценария
        </h2>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li className="text-foreground/80">
            {"Перейдите в «Настройки» → «Сценарии интервью»"}
          </li>
          <li className="text-foreground/80">{"Нажмите «Создать сценарий»"}</li>
          <li className="text-foreground/80">Укажите название и описание</li>
          <li className="text-foreground/80">Добавьте вопросы для интервью</li>
          <li className="text-foreground/80">Настройте критерии оценки</li>
          <li className="text-foreground/80">Сохраните сценарий</li>
        </ol>

        <DocsCallout type="tip" title="Совет">
          Начните с базового сценария из 5-7 вопросов и постепенно дополняйте
          его на основе результатов интервью.
        </DocsCallout>

        <h2
          id="examples"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Примеры сценариев
        </h2>

        <h3 className="text-lg font-semibold text-foreground mt-8 mb-3 scroll-mt-20">
          Frontend разработчик (Middle)
        </h3>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <p className="font-semibold text-foreground mb-2">
            Длительность: 30 минут
          </p>
          <p className="font-semibold text-foreground mb-3">Вопросы:</p>
          <ol className="ml-6 list-decimal space-y-2 text-sm">
            <li>Расскажите о вашем опыте работы с React</li>
            <li>Как вы организуете state management в крупных приложениях?</li>
            <li>
              Опишите процесс оптимизации производительности React-приложения
            </li>
            <li>Какие подходы к тестированию вы используете?</li>
            <li>Расскажите о сложной технической задаче, которую вы решили</li>
          </ol>
          <p className="font-semibold text-foreground mt-4 mb-2">
            Критерии оценки:
          </p>
          <ul className="ml-6 list-disc space-y-1 text-sm">
            <li>Глубина знаний React</li>
            <li>Понимание архитектуры</li>
            <li>Опыт оптимизации</li>
            <li>Навыки тестирования</li>
          </ul>
        </div>

        <h3 className="text-lg font-semibold text-foreground mt-8 mb-3 scroll-mt-20">
          Product Manager
        </h3>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <p className="font-semibold text-foreground mb-2">
            Длительность: 40 минут
          </p>
          <p className="font-semibold text-foreground mb-3">Вопросы:</p>
          <ol className="ml-6 list-decimal space-y-2 text-sm">
            <li>Опишите процесс запуска нового продукта</li>
            <li>Как вы приоритизируете фичи в бэклоге?</li>
            <li>Расскажите о работе с метриками продукта</li>
            <li>Как вы взаимодействуете с командой разработки?</li>
            <li>Приведите пример успешного продуктового решения</li>
          </ol>
          <p className="font-semibold text-foreground mt-4 mb-2">
            Критерии оценки:
          </p>
          <ul className="ml-6 list-disc space-y-1 text-sm">
            <li>Продуктовое мышление</li>
            <li>Аналитические навыки</li>
            <li>Коммуникация</li>
            <li>Опыт запуска продуктов</li>
          </ul>
        </div>

        <h2
          id="best-practices"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Лучшие практики
        </h2>

        <ul>
          <li>
            <strong className="font-semibold text-foreground">
              Структурируйте вопросы
            </strong>{" "}
            — от общих к специфичным
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Избегайте yes/no вопросов
            </strong>{" "}
            — задавайте открытые вопросы
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Учитывайте уровень
            </strong>{" "}
            — адаптируйте сложность под позицию
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Тестируйте сценарии
            </strong>{" "}
            — проводите пробные интервью
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Обновляйте регулярно
            </strong>{" "}
            — актуализируйте вопросы на основе фидбека
          </li>
        </ul>

        <DocsCallout type="warning" title="Важно">
          Убедитесь, что вопросы соответствуют законодательству и не содержат
          дискриминационных формулировок.
        </DocsCallout>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/ai-assistant/templates"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Шаблоны сообщений
          </Link>
          <Link
            href="/analytics"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Аналитика
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
