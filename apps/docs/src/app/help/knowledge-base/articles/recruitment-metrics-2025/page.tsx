import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";
import Link from "next/link";

export default function RecruitmentMetrics2025Page() {
  const tocItems = [
    { id: "why-metrics", title: "Зачем нужны метрики", level: 2 },
    { id: "key-metrics", title: "Ключевые метрики", level: 2 },
    { id: "advanced-metrics", title: "Продвинутые метрики", level: 2 },
    { id: "dashboard", title: "Как собрать дашборд", level: 2 },
    { id: "mistakes", title: "Частые ошибки", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "База знаний", href: "/help/knowledge-base" },
            { title: "Метрики найма: что отслеживать в 2025 году" },
          ]}
        />

        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
            Аналитика
          </span>
          <span className="text-sm text-muted-foreground">15 мин чтения</span>
          <span className="text-sm text-muted-foreground">28 декабря 2025</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Метрики найма: что отслеживать в 2026 году
        </h1>

        <p className="text-lg text-muted-foreground mb-8">
          KPI для оценки эффективности рекрутинга и ROI инвестиций в найм.
          Полное руководство по метрикам, которые действительно важны.
        </p>

        <h2 id="why-metrics" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">
          Зачем измерять эффективность найма
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          "Что не измеряется — не улучшается". Без метрик вы не знаете, работает ли
          ваша стратегия найма, где узкие места и куда инвестировать бюджет.
        </p>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3">Что дают метрики:</h3>
          <ul className="space-y-2 text-sm">
            <li>📊 Понимание эффективности каждого канала найма</li>
            <li>💰 Расчёт ROI инвестиций в рекрутинг</li>
            <li>⚡ Выявление узких мест в воронке найма</li>
            <li>🎯 Обоснование бюджета перед руководством</li>
            <li>📈 Прогнозирование потребностей в найме</li>
          </ul>
        </div>

        <DocsCallout type="warning" title="Важно">
          Не пытайтесь отслеживать все метрики сразу. Начните с 5-7 ключевых,
          которые отвечают на конкретные вопросы вашего бизнеса.
        </DocsCallout>

        <h2 id="key-metrics" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">
          7 ключевых метрик найма
        </h2>

        <div className="space-y-6 my-6">
          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">1. Time to Hire (Время найма)</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Количество дней от публикации вакансии до принятия оффера кандидатом.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Бенчмарки 2026:</p>
              <ul className="space-y-1 ml-4">
                <li>• IT-специалисты: 20-30 дней (с AI)</li>
                <li>• Менеджмент: 40-55 дней</li>
                <li>• Массовые позиции: 7-12 дней</li>
              </ul>
            </div>
            <p className="text-sm text-green-600 mt-3">
              ✅ Как улучшить: автоматизация скрининга, быстрые интервью, чёткий процесс
            </p>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">2. Cost per Hire (Стоимость найма)</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Общие затраты на найм одного сотрудника (реклама, зарплата рекрутеров, инструменты).
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Формула:</p>
              <code className="block bg-background p-2 rounded">
                (Внешние затраты + Внутренние затраты) / Количество нанятых
              </code>
            </div>
            <p className="text-sm text-green-600 mt-3">
              ✅ Средняя стоимость в России: 90,000 - 170,000 ₽ на IT-специалиста (2026)
            </p>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">3. Quality of Hire (Качество найма)</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Насколько хорошо новый сотрудник выполняет свою работу. Самая важная, но
              сложная для измерения метрика.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Как измерить:</p>
              <ul className="space-y-1 ml-4">
                <li>• Оценка performance через 3-6 месяцев</li>
                <li>• Feedback от руководителя</li>
                <li>• Достижение целей испытательного срока</li>
                <li>• Retention rate (остаётся ли сотрудник)</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">4. Source of Hire (Источник найма)</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Откуда приходят лучшие кандидаты: HH.ru, рефералы, LinkedIn, Telegram?
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Что отслеживать:</p>
              <ul className="space-y-1 ml-4">
                <li>• Количество откликов по каждому каналу</li>
                <li>• Конверсия в найм (отклик → оффер)</li>
                <li>• Стоимость найма по каналу</li>
                <li>• Качество кандидатов по каналу</li>
              </ul>
            </div>
            <p className="text-sm text-green-600 mt-3">
              ✅ Топ-3 канала в IT: рефералы (40%), HH.ru (30%), LinkedIn (15%)
            </p>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">5. Offer Acceptance Rate (Процент принятых офферов)</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Сколько кандидатов принимают ваши предложения о работе.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Формула:</p>
              <code className="block bg-background p-2 rounded">
                (Принятые офферы / Отправленные офферы) × 100%
              </code>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Норма: 85-90%. Если ниже — проблемы с компенсацией, брендом или процессом найма.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">6. First Year Attrition (Текучесть в первый год)</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Процент сотрудников, уволившихся в течение первого года работы.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Формула:</p>
              <code className="block bg-background p-2 rounded">
                (Уволившиеся в первый год / Всего нанятых) × 100%
              </code>
            </div>
            <p className="text-sm text-red-600 mt-3">
              ⚠️ Высокая текучесть (>20%) = проблемы с наймом или онбордингом
            </p>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">7. Candidate Experience Score (Опыт кандидата)</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Насколько кандидатам нравится ваш процесс найма (опрос после интервью).
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Что спрашивать:</p>
              <ul className="space-y-1 ml-4">
                <li>• Оцените процесс найма от 1 до 10</li>
                <li>• Была ли коммуникация своевременной?</li>
                <li>• Порекомендуете ли нас друзьям?</li>
              </ul>
            </div>
            <p className="text-sm text-green-600 mt-3">
              ✅ Цель: NPS (Net Promoter Score) выше 50
            </p>
          </div>
        </div>

        <h2 id="advanced-metrics" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">
          Продвинутые метрики для зрелых команд
        </h2>

        <div className="grid gap-4 my-6">
          <div className="rounded-lg border border-border p-6">
            <h3 className="font-semibold text-foreground mb-2">Conversion Rate по этапам воронки</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Отслеживайте конверсию на каждом этапе: отклик → скрининг → интервью → оффер → найм
            </p>
            <div className="text-sm bg-muted/30 rounded p-3">
              <p className="font-medium mb-2">Пример воронки:</p>
              <ul className="space-y-1">
                <li>100 откликов → 30 прошли скрининг (30%)</li>
                <li>30 скрининг → 10 интервью (33%)</li>
                <li>10 интервью → 3 оффера (30%)</li>
                <li>3 оффера → 2 найма (67%)</li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-border p-6">
            <h3 className="font-semibold text-foreground mb-2">Hiring Manager Satisfaction</h3>
            <p className="text-sm text-muted-foreground">
              Опрос нанимающих менеджеров: довольны ли они качеством кандидатов и
              скоростью закрытия вакансий. Цель: 8+ из 10.
            </p>
          </div>

          <div className="rounded-lg border border-border p-6">
            <h3 className="font-semibold text-foreground mb-2">Diversity Metrics</h3>
            <p className="text-sm text-muted-foreground">
              Процент женщин, представителей разных возрастных групп и регионов в
              воронке найма. Важно для создания инклюзивной культуры.
            </p>
          </div>
        </div>

        <h2 id="dashboard" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">
          Как собрать дашборд метрик
        </h2>

        <div className="space-y-4 my-6">
          <div className="border-l-4 border-blue-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">Шаг 1: Определите цели</h3>
            <p className="text-sm text-muted-foreground">
              Что вы хотите улучшить? Скорость найма? Качество кандидатов? Стоимость?
              Выберите 3-5 приоритетных метрик.
            </p>
          </div>

          <div className="border-l-4 border-blue-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">Шаг 2: Настройте сбор данных</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Используйте систему для автоматического сбора данных. Ручной сбор в Excel —
              это прошлый век.
            </p>
            <p className="text-sm text-green-600">
              ✅ QBS Автонайм автоматически собирает все ключевые метрики
            </p>
          </div>

          <div className="border-l-4 border-blue-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">Шаг 3: Создайте визуализацию</h3>
            <p className="text-sm text-muted-foreground">
              Графики и диаграммы помогают быстро увидеть тренды. Обновляйте дашборд
              еженедельно или ежемесячно.
            </p>
          </div>

          <div className="border-l-4 border-blue-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">Шаг 4: Анализируйте и действуйте</h3>
            <p className="text-sm text-muted-foreground">
              Метрики бесполезны без действий. Если Time to Hire растёт — ищите узкие
              места. Если Quality of Hire падает — пересмотрите критерии отбора.
            </p>
          </div>
        </div>

        <DocsCallout type="tip" title="Совет">
          Проводите ежемесячный review метрик с командой. Обсуждайте тренды,
          гипотезы и эксперименты для улучшения показателей.
        </DocsCallout>

        <h2 id="mistakes" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">
          5 частых ошибок при работе с метриками
        </h2>

        <div className="space-y-4 my-6">
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
            <h3 className="font-semibold text-foreground mb-2">1. Фокус только на скорости</h3>
            <p className="text-sm text-muted-foreground">
              Быстрый найм ≠ хороший найм. Если вы нанимаете за 5 дней, но сотрудник
              увольняется через 3 месяца — это провал.
            </p>
          </div>

          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
            <h3 className="font-semibold text-foreground mb-2">2. Игнорирование качественных метрик</h3>
            <p className="text-sm text-muted-foreground">
              Количество откликов — это vanity metric. Важнее качество кандидатов и
              их соответствие культуре компании.
            </p>
          </div>

          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
            <h3 className="font-semibold text-foreground mb-2">3. Отсутствие бенчмарков</h3>
            <p className="text-sm text-muted-foreground">
              "Time to Hire = 30 дней" — это хорошо или плохо? Сравнивайте с индустрией,
              конкурентами и своими прошлыми показателями.
            </p>
          </div>

          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
            <h3 className="font-semibold text-foreground mb-2">4. Слишком много метрик</h3>
            <p className="text-sm text-muted-foreground">
              Отслеживание 20+ метрик = паралич анализа. Начните с 5-7 ключевых,
              остальные добавите позже.
            </p>
          </div>

          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
            <h3 className="font-semibold text-foreground mb-2">5. Метрики ради метрик</h3>
            <p className="text-sm text-muted-foreground">
              Если метрика не влияет на решения — зачем её отслеживать? Каждая метрика
              должна отвечать на конкретный вопрос бизнеса.
            </p>
          </div>
        </div>

        <div className="my-8 rounded-lg border border-primary/30 bg-primary/5 p-6">
          <h3 className="font-semibold text-primary mb-3">
            📊 Готовый дашборд метрик
          </h3>
          <p className="text-muted-foreground mb-4">
            QBS Автонайм автоматически собирает и визуализирует все ключевые метрики
            найма. Никаких таблиц и ручного подсчёта — только актуальные данные в
            реальном времени.
          </p>
          <Link
            href="/analytics"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Посмотреть аналитику →
          </Link>
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/help/knowledge-base"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            База знаний
          </Link>
          <Link
            href="/analytics"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Аналитика и отчёты
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  );
}
