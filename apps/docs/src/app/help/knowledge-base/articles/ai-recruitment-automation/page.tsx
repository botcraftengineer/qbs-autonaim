import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";
import Link from "next/link";

export default function AIRecruitmentAutomationPage() {
  const tocItems = [
    { id: "problem", title: "Проблема", level: 2 },
    { id: "solution", title: "Решение через AI", level: 2 },
    { id: "implementation", title: "Как внедрить", level: 2 },
    { id: "results", title: "Результаты", level: 2 },
    { id: "tips", title: "Практические советы", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "База знаний", href: "/help/knowledge-base" },
            { title: "Как сократить время найма на 70% с AI" },
          ]}
        />

        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
            Автоматизация
          </span>
          <span className="text-sm text-muted-foreground">8 мин чтения</span>
          <span className="text-sm text-muted-foreground">10 января 2026</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Как сократить время найма на 70% с AI
        </h1>

        <p className="text-lg text-muted-foreground mb-8">
          Практическое руководство по автоматизации первичного скрининга кандидатов
          с помощью искусственного интеллекта
        </p>

        <h2 id="problem" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">
          Проблема: время — главный враг рекрутера
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Средний рекрутер тратит 23 часа в неделю на просмотр резюме. При этом 60-70%
          кандидатов не соответствуют базовым требованиям вакансии. Это означает, что
          большая часть времени тратится впустую.
        </p>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3">Типичная воронка найма:</h3>
          <ul className="space-y-2 text-sm">
            <li>📥 100 откликов на вакансию</li>
            <li>👀 23 часа на просмотр всех резюме</li>
            <li>✅ 15 подходящих кандидатов (15%)</li>
            <li>📞 5 приглашений на интервью</li>
            <li>🎯 1 успешный найм</li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            <strong>Проблема:</strong> 85% времени тратится на неподходящих кандидатов
          </p>
        </div>

        <h2 id="solution" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">
          Решение: AI-скрининг первой линии
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Искусственный интеллект может за секунды проанализировать резюме и определить
          соответствие кандидата требованиям вакансии. Это не заменяет человека, а
          освобождает его время для работы с действительно подходящими кандидатами.
        </p>

        <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">Что анализирует AI:</h3>

        <ul className="space-y-3 mb-6">
          <li>
            <strong className="font-semibold text-foreground">Опыт работы</strong> — релевантность
            предыдущих позиций, продолжительность работы, карьерный рост
          </li>
          <li>
            <strong className="font-semibold text-foreground">Навыки</strong> — соответствие
            технологического стека, уровень владения инструментами
          </li>
          <li>
            <strong className="font-semibold text-foreground">Образование</strong> — профиль
            подготовки, уровень образования, дополнительные курсы
          </li>
          <li>
            <strong className="font-semibold text-foreground">Достижения</strong> — конкретные
            результаты, проекты, награды
          </li>
          <li>
            <strong className="font-semibold text-foreground">Красные флаги</strong> — частая
            смена работы, пробелы в опыте, несоответствия
          </li>
        </ul>

        <DocsCallout type="tip" title="Ключевое преимущество">
          AI работает 24/7 и обрабатывает один отклик за 3-5 секунд. Человеку на это
          требуется 10-15 минут.
        </DocsCallout>

        <h2 id="implementation" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">
          Как внедрить AI-скрининг за 3 шага
        </h2>

        <div className="space-y-6 my-6">
          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">Шаг 1: Настройте критерии оценки</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Определите обязательные и желательные требования для вакансии. Чем точнее
              критерии, тем лучше работает AI.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Пример для Python-разработчика:</p>
              <ul className="space-y-1 ml-4">
                <li>✅ Обязательно: Python 3+ лет, Django/Flask</li>
                <li>⭐ Желательно: PostgreSQL, Docker, опыт в финтехе</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">Шаг 2: Подключите источники кандидатов</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Интегрируйте HH.ru, фриланс-платформы и другие источники. AI автоматически
              обработает все новые отклики.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">Шаг 3: Работайте только с топ-кандидатами</h3>
            <p className="text-sm text-muted-foreground">
              Фокусируйтесь на кандидатах с оценкой 4-5 звезд. Остальных можно отклонить
              автоматически или отложить.
            </p>
          </div>
        </div>

        <h2 id="results" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">
          Реальные результаты компаний
        </h2>

        <div className="grid gap-4 my-6">
          <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-6">
            <h3 className="font-semibold text-foreground mb-2">IT-компания, 50+ сотрудников</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Было:</p>
                <p className="text-2xl font-bold text-foreground">14 дней</p>
                <p className="text-xs text-muted-foreground">на закрытие вакансии</p>
              </div>
              <div>
                <p className="text-muted-foreground">Стало:</p>
                <p className="text-2xl font-bold text-green-600">4 дня</p>
                <p className="text-xs text-muted-foreground">экономия 71%</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-6">
            <h3 className="font-semibold text-foreground mb-2">Ритейл, массовый найм</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Было:</p>
                <p className="text-2xl font-bold text-foreground">200 откликов</p>
                <p className="text-xs text-muted-foreground">просмотр вручную</p>
              </div>
              <div>
                <p className="text-muted-foreground">Стало:</p>
                <p className="text-2xl font-bold text-blue-600">15 топ-кандидатов</p>
                <p className="text-xs text-muted-foreground">автоматически</p>
              </div>
            </div>
          </div>
        </div>

        <h2 id="tips" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">
          Практические советы
        </h2>

        <ul className="space-y-3 mb-6">
          <li>
            <strong className="font-semibold text-foreground">Начните с одной вакансии</strong> —
            протестируйте AI на самой проблемной позиции с большим потоком откликов
          </li>
          <li>
            <strong className="font-semibold text-foreground">Проверяйте первые 20-30 оценок</strong> —
            убедитесь, что AI правильно понимает ваши критерии
          </li>
          <li>
            <strong className="font-semibold text-foreground">Корректируйте критерии</strong> —
            если AI ошибается, уточните требования к вакансии
          </li>
          <li>
            <strong className="font-semibold text-foreground">Не отказывайтесь от человека</strong> —
            AI помогает отсеять неподходящих, но финальное решение за вами
          </li>
          <li>
            <strong className="font-semibold text-foreground">Измеряйте результаты</strong> —
            отслеживайте время на найм до и после внедрения AI
          </li>
        </ul>

        <DocsCallout type="warning" title="Важно помнить">
          AI — это инструмент, а не замена рекрутера. Используйте его для рутинных задач,
          а освободившееся время направьте на построение отношений с кандидатами и
          улучшение candidate experience.
        </DocsCallout>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/help/knowledge-base"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            База знаний
          </Link>
          <Link
            href="/quickstart"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Начать использовать
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  );
}
