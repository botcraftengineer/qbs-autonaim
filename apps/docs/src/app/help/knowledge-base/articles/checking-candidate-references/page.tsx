import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";

export default function CheckingCandidateReferencesPage() {
  const tocItems = [
    { id: "why", title: "Зачем проверять", level: 2 },
    { id: "when", title: "Когда проверять", level: 2 },
    { id: "how", title: "Как проверять", level: 2 },
    { id: "questions", title: "Вопросы", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "База знаний", href: "/help/knowledge-base" },
            { title: "Как проверить рекомендации кандидатов" },
          ]}
        />

        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
            Полезные советы
          </span>
          <span className="text-sm text-muted-foreground">7 мин чтения</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Как проверить рекомендации кандидатов
        </h1>

        <p className="text-lg text-muted-foreground mb-8">
          Эффективные методы проверки background и получения честной обратной
          связи от предыдущих работодателей
        </p>

        <h2
          id="why"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Зачем проверять рекомендации
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          По статистике, 30-40% кандидатов приукрашивают свой опыт в резюме.
          Проверка рекомендаций помогает избежать дорогостоящих ошибок в найме.
        </p>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3">
            Что можно выявить:
          </h3>
          <ul className="space-y-2 text-sm">
            <li>🎯 Реальный уровень навыков и достижений</li>
            <li>🤝 Стиль работы и взаимодействия с командой</li>
            <li>⚠️ Причины ухода с предыдущего места</li>
            <li>📈 Потенциал роста и развития</li>
            <li>🚩 Красные флаги (конфликты, проблемы с дисциплиной)</li>
          </ul>
        </div>

        <h2
          id="when"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Когда проверять рекомендации
        </h2>

        <div className="space-y-4 my-6">
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-2">
              Оптимальный момент
            </h3>
            <p className="text-sm text-muted-foreground">
              После успешного прохождения всех интервью, но до отправки оффера.
              Это финальная проверка перед принятием решения.
            </p>
          </div>

          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-2">
              Для каких позиций обязательно
            </h3>
            <ul className="text-sm space-y-1 ml-4">
              <li>• Руководящие позиции</li>
              <li>• Работа с финансами или конфиденциальными данными</li>
              <li>• Ключевые специалисты</li>
              <li>• Позиции с высокой зарплатой</li>
            </ul>
          </div>
        </div>

        <h2
          id="how"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Как правильно проверять
        </h2>

        <div className="space-y-6 my-6">
          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Шаг 1: Получите согласие кандидата
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Всегда спрашивайте разрешение перед проверкой. Это не только
              этично, но и требуется по закону.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Шаг 2: Запросите контакты
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Попросите 2-3 контакта предыдущих руководителей или коллег. Лучше
              всего — непосредственный руководитель.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Шаг 3: Подготовьте вопросы
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Заранее составьте список вопросов. Разговор должен занимать 10-15
              минут.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Шаг 4: Позвоните в удобное время
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Лучше звонить, чем писать — так вы услышите интонацию и получите
              более честные ответы.
            </p>
          </div>
        </div>

        <h2
          id="questions"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          10 ключевых вопросов
        </h2>

        <div className="space-y-4 my-6">
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-medium text-foreground mb-2">
              1. В какой период и в какой должности работал кандидат?
            </p>
            <p className="text-xs text-muted-foreground">
              Проверка базовых фактов из резюме
            </p>
          </div>

          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-medium text-foreground mb-2">
              2. Какие были основные обязанности и достижения?
            </p>
            <p className="text-xs text-muted-foreground">
              Сравните с тем, что написано в резюме
            </p>
          </div>

          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-medium text-foreground mb-2">
              3. Как бы вы оценили профессиональные навыки по шкале 1-10?
            </p>
            <p className="text-xs text-muted-foreground">
              Конкретная оценка лучше общих слов
            </p>
          </div>

          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-medium text-foreground mb-2">
              4. Как кандидат работал в команде?
            </p>
            <p className="text-xs text-muted-foreground">
              Важно для понимания софт-скиллов
            </p>
          </div>

          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-medium text-foreground mb-2">
              5. Были ли проблемы с дисциплиной или конфликты?
            </p>
            <p className="text-xs text-muted-foreground">
              Прямой вопрос о красных флагах
            </p>
          </div>

          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-medium text-foreground mb-2">
              6. Почему кандидат ушёл?
            </p>
            <p className="text-xs text-muted-foreground">
              Сравните с версией кандидата
            </p>
          </div>

          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-medium text-foreground mb-2">
              7. Взяли бы вы этого человека обратно?
            </p>
            <p className="text-xs text-muted-foreground">
              Самый важный вопрос — показывает истинное отношение
            </p>
          </div>

          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-medium text-foreground mb-2">
              8. Какие сильные стороны кандидата?
            </p>
            <p className="text-xs text-muted-foreground">
              Что можно использовать в работе
            </p>
          </div>

          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-medium text-foreground mb-2">
              9. Над чем кандидату стоит поработать?
            </p>
            <p className="text-xs text-muted-foreground">
              Мягкий способ узнать о слабостях
            </p>
          </div>

          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-medium text-foreground mb-2">
              10. Есть ли что-то ещё, что мне стоит знать?
            </p>
            <p className="text-xs text-muted-foreground">
              Открытый вопрос для дополнительной информации
            </p>
          </div>
        </div>

        <DocsCallout type="warning" title="Важно">
          Обращайте внимание не только на слова, но и на паузы, интонацию,
          уклончивые ответы. Они могут сказать больше, чем прямые слова.
        </DocsCallout>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3">Красные флаги:</h3>
          <ul className="space-y-2 text-sm">
            <li>🚩 Отказ предоставить контакты для проверки</li>
            <li>🚩 Несовпадение фактов с резюме</li>
            <li>🚩 Негативные отзывы от нескольких источников</li>
            <li>🚩 Уклончивые ответы на прямые вопросы</li>
            <li>🚩 "Не взял бы обратно" от предыдущего руководителя</li>
          </ul>
        </div>

        <DocsCallout type="tip" title="Совет">
          Проверяйте не только последнее место работы, но и предыдущие. Паттерны
          поведения обычно повторяются.
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
            href="/help/knowledge-base/articles/objective-candidate-assessment"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Объективная оценка
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
