import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";

export default function ScoringPage() {
  const tocItems = [
    { id: "scoring-system", title: "Как работает AI-скоринг", level: 2 },
    { id: "score-calculation", title: "Шкала оценок", level: 2 },
    { id: "weight-configuration", title: "Обоснование оценки", level: 2 },
    { id: "score-interpretation", title: "Ручная корректировка", level: 2 },
    { id: "custom-criteria", title: "Фильтрация по оценкам", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "Работа с кандидатами", href: "/candidates" },
            { title: "Скоринг кандидатов" },
          ]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">
            Работа с кандидатами
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">AI-скоринг кандидатов</h1>

        <p className="text-lg">
          AI-скоринг автоматически оценивает кандидатов по шкале от 1 до 5 звезд
          на основе анализа резюме и требований вакансии. Это позволяет быстро
          выявить наиболее подходящих кандидатов.
        </p>

        <h2 id="scoring-system" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Как работает AI-скоринг</h2>

        <p>
          Система использует GPT-4 для анализа резюме кандидата и сравнения его
          с требованиями вакансии. AI учитывает множество факторов:
        </p>

        <ul>
          <li>
            <strong className="font-semibold text-foreground">Навыки и технологии</strong> — соответствие требуемому стеку
          </li>
          <li>
            <strong className="font-semibold text-foreground">Опыт работы</strong> — релевантность и продолжительность
          </li>
          <li>
            <strong className="font-semibold text-foreground">Образование</strong> — профиль и уровень подготовки
          </li>
          <li>
            <strong className="font-semibold text-foreground">Проекты и достижения</strong> — практический опыт
          </li>
          <li>
            <strong className="font-semibold text-foreground">Языки и сертификаты</strong> — дополнительные компетенции
          </li>
        </ul>

        <DocsCallout type="info" title="Автоматическая обработка">
          Скоринг запускается автоматически при импорте новых кандидатов из
          HeadHunter или фриланс-платформ. Обработка происходит в фоновом режиме
          через Inngest.
        </DocsCallout>

        <h2 id="score-calculation" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Шкала оценок</h2>

        <p className="leading-relaxed text-foreground/80 mb-4">AI присваивает каждому кандидату оценку от 1 до 5 звезд:</p>

        <div className="my-6 flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/5 p-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className="text-green-500">
                  ★
                </span>
              ))}
            </div>
            <div>
              <span className="font-medium text-foreground">
                5 звезд — Отличное соответствие
              </span>
              <p className="text-sm text-muted-foreground mt-1">
                Кандидат полностью соответствует требованиям. Рекомендуется
                немедленный контакт.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/5 p-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <span key={i} className="text-green-500">
                  ★
                </span>
              ))}
              <span className="text-muted-foreground">☆</span>
            </div>
            <div>
              <span className="font-medium text-foreground">
                4 звезды — Хорошее соответствие
              </span>
              <p className="text-sm text-muted-foreground mt-1">
                Кандидат соответствует большинству требований. Стоит
                рассмотреть.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <span key={i} className="text-amber-500">
                  ★
                </span>
              ))}
              {[4, 5].map((i) => (
                <span key={i} className="text-muted-foreground">
                  ☆
                </span>
              ))}
            </div>
            <div>
              <span className="font-medium text-foreground">
                3 звезды — Среднее соответствие
              </span>
              <p className="text-sm text-muted-foreground mt-1">
                Кандидат частично соответствует. Требуется детальная проверка.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
            <div className="flex gap-1">
              {[1, 2].map((i) => (
                <span key={i} className="text-red-500">
                  ★
                </span>
              ))}
              {[3, 4, 5].map((i) => (
                <span key={i} className="text-muted-foreground">
                  ☆
                </span>
              ))}
            </div>
            <div>
              <span className="font-medium text-foreground">
                1-2 звезды — Слабое соответствие
              </span>
              <p className="text-sm text-muted-foreground mt-1">
                Кандидат не соответствует ключевым требованиям. Рекомендуется
                отклонить.
              </p>
            </div>
          </div>
        </div>

        <h2 id="weight-configuration" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Обоснование оценки</h2>

        <p>
          Вместе с оценкой AI предоставляет текстовое обоснование, объясняющее
          почему кандидат получил именно такой балл. Это помогает понять сильные
          и слабые стороны кандидата.
        </p>

        <DocsCallout type="tip" title="Пример обоснования">
          «Кандидат имеет 5 лет опыта работы с React и TypeScript, что полностью
          соответствует требованиям. Однако отсутствует опыт работы с Next.js,
          который указан как желательный навык. Образование в области Computer
          Science является преимуществом.»
        </DocsCallout>

        <h2 id="score-interpretation" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Ручная корректировка</h2>

        <p>
          Вы можете изменить оценку AI вручную, если считаете её некорректной:
        </p>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li className="text-foreground/80">Откройте карточку кандидата</li>
          <li className="text-foreground/80">Нажмите на текущую оценку (звезды)</li>
          <li className="text-foreground/80">Выберите новую оценку</li>
          <li className="text-foreground/80">Опционально добавьте комментарий с обоснованием</li>
        </ol>

        <DocsCallout type="warning" title="Обратная связь">
          Ручные корректировки помогают улучшить точность AI. Система учитывает
          ваши правки для будущих оценок.
        </DocsCallout>

        <h2 id="custom-criteria" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Фильтрация по оценкам</h2>

        <p>
          Используйте фильтры для работы с кандидатами определённого уровня:
        </p>

        <ul>
          <li>
            <strong className="font-semibold text-foreground">5 звезд</strong> — приоритетная обработка
          </li>
          <li>
            <strong className="font-semibold text-foreground">4-5 звезд</strong> — отправка на интервью
          </li>
          <li>
            <strong className="font-semibold text-foreground">3 звезды</strong> — ручная проверка
          </li>
          <li>
            <strong className="font-semibold text-foreground">1-2 звезды</strong> — автоматический отказ
          </li>
        </ul>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/candidates/screening"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            AI-скрининг
          </Link>
          <Link
            href="/candidates/pipeline"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Воронка найма
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
