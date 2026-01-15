import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";

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
            { title: "Метрики найма: что отслеживать в 2026 году" },
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
          Полное руководство по KPI для оценки эффективности рекрутинга и
          расчёта ROI инвестиций в найм персонала
        </p>

        <h2
          id="why-metrics"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Зачем измерять эффективность найма
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Без метрик невозможно понять, работает ли ваша стратегия найма. Вы
          можете тратить бюджет впустую, терять хороших кандидатов и не замечать
          проблемы в процессе рекрутинга.
        </p>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3">
            Что дают метрики:
          </h3>
          <ul className="space-y-2 text-sm">
            <li>📊 Понимание узких мест в воронке найма</li>
            <li>💰 Расчёт стоимости найма и ROI инвестиций</li>
            <li>⚡ Выявление неэффективных каналов привлечения</li>
            <li>🎯 Обоснование бюджета перед руководством</li>
            <li>📈 Прогнозирование потребности в персонале</li>
          </ul>
        </div>

        <DocsCallout type="warning" title="Важно">
          Не пытайтесь отслеживать все метрики сразу. Начните с 5-7 ключевых
          показателей, которые наиболее важны для вашего бизнеса.
        </DocsCallout>

        <h2
          id="key-metrics"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          7 ключевых метрик найма
        </h2>

        <div className="space-y-6 my-6">
          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              1. Time to Hire — время найма
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Количество дней от публикации вакансии до принятия оффера
              кандидатом.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Нормы по отраслям (2026):</p>
              <ul className="space-y-1 ml-4">
                <li>• IT-специалисты: 15-25 дней</li>
                <li>• Менеджмент: 30-45 дней</li>
                <li>• Массовый найм: 7-14 дней</li>
                <li>• Топ-менеджмент: 60-90 дней</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              <strong>Как улучшить:</strong> Автоматизируйте скрининг резюме,
              сократите количество этапов интервью, используйте асинхронные
              интервью.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              2. Cost per Hire — стоимость найма
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Общие затраты на закрытие одной вакансии (реклама, зарплата
              рекрутеров, инструменты).
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Формула расчёта:</p>
              <p className="font-mono text-xs bg-background p-2 rounded">
                Cost per Hire = (Внешние затраты + Внутренние затраты) /
                Количество найма
              </p>
              <p className="mt-2 text-muted-foreground">
                Средняя стоимость найма в России: 80,000 - 150,000 ₽ на позицию
              </p>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              3. Quality of Hire — качество найма
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Насколько хорошо новый сотрудник справляется с работой. Самая
              важная, но сложная для измерения метрика.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Как измерить:</p>
              <ul className="space-y-1 ml-4">
                <li>• Оценка performance через 3-6-12 месяцев</li>
                <li>• Достижение KPI в испытательный срок</li>
                <li>• Feedback от руководителя и команды</li>
                <li>• Процент прошедших испытательный срок</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              4. Source of Hire — источники найма
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Откуда приходят лучшие кандидаты и какие каналы наиболее
              эффективны.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Топ-источники в 2026:</p>
              <ul className="space-y-1 ml-4">
                <li>• HH.ru — 35% успешных найма</li>
                <li>• Рекомендации сотрудников — 25%</li>
                <li>• LinkedIn / Telegram — 20%</li>
                <li>• Карьерный сайт компании — 15%</li>
                <li>• Другие источники — 5%</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              5. Offer Acceptance Rate — процент принятия офферов
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Сколько кандидатов принимают ваше предложение о работе.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Нормы:</p>
              <ul className="space-y-1 ml-4">
                <li>• Хороший показатель: 85-90%</li>
                <li>• Средний показатель: 70-85%</li>
                <li>• Проблемный показатель: менее 70%</li>
              </ul>
              <p className="mt-2 text-muted-foreground">
                Если показатель низкий — проблема в зарплате, условиях или
                candidate experience.
              </p>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              6. Candidate Experience Score — опыт кандидата
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Насколько кандидатам нравится процесс найма в вашей компании.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Как измерить:</p>
              <ul className="space-y-1 ml-4">
                <li>• Опрос после интервью (NPS)</li>
                <li>• Отзывы на Glassdoor / Хабр Карьера</li>
                <li>• Процент кандидатов, завершивших процесс</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              7. First Year Retention — удержание в первый год
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Процент новых сотрудников, которые остаются в компании через год.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Нормы:</p>
              <ul className="space-y-1 ml-4">
                <li>• Отличный показатель: более 90%</li>
                <li>• Хороший показатель: 80-90%</li>
                <li>• Проблемный показатель: менее 80%</li>
              </ul>
            </div>
          </div>
        </div>

        <h2
          id="advanced-metrics"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Продвинутые метрики для зрелых команд
        </h2>

        <div className="space-y-4 my-6">
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-2">
              Conversion Rate по этапам воронки
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Процент кандидатов, переходящих с одного этапа на другой.
            </p>
            <div className="text-sm space-y-1">
              <p>• Отклик → Скрининг: 40-60%</p>
              <p>• Скрининг → Интервью: 20-30%</p>
              <p>• Интервью → Оффер: 30-40%</p>
              <p>• Оффер → Принятие: 85-90%</p>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-2">
              Recruiter Efficiency
            </h3>
            <p className="text-sm text-muted-foreground">
              Количество успешных найма на одного рекрутера в месяц. Норма: 3-5
              закрытых вакансий на рекрутера.
            </p>
          </div>

          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-2">
              Pipeline Health
            </h3>
            <p className="text-sm text-muted-foreground">
              Соотношение активных кандидатов на разных этапах. Здоровая
              воронка: на каждую открытую вакансию 3-5 кандидатов в процессе.
            </p>
          </div>
        </div>

        <h2
          id="dashboard"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Как собрать дашборд метрик
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Не нужно сложных инструментов. Начните с простого дашборда в Excel или
          Google Sheets, а затем переходите к специализированным решениям.
        </p>

        <div className="my-6 rounded-lg border border-blue-500/30 bg-blue-500/5 p-6">
          <h3 className="font-semibold text-foreground mb-3">
            Минимальный дашборд (обновлять еженедельно):
          </h3>
          <ul className="space-y-2 text-sm">
            <li>✓ Открытые вакансии (количество, приоритет)</li>
            <li>✓ Кандидаты в воронке (по этапам)</li>
            <li>✓ Среднее время найма (по вакансиям)</li>
            <li>✓ Стоимость найма (факт vs план)</li>
            <li>✓ Источники кандидатов (эффективность)</li>
            <li>✓ Офферы (отправлено, принято, отклонено)</li>
          </ul>
        </div>

        <DocsCallout type="tip" title="Совет">
          Автоматизируйте сбор данных. Современные системы автоматически
          собирают все метрики и строят дашборды без ручного ввода.
        </DocsCallout>

        <h2
          id="mistakes"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          5 частых ошибок при работе с метриками
        </h2>

        <div className="space-y-4 my-6">
          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              1. Фокус только на скорости
            </h3>
            <p className="text-sm text-muted-foreground">
              Быстрый найм не всегда хороший найм. Баланс между скоростью и
              качеством — ключ к успеху.
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              2. Игнорирование качественных метрик
            </h3>
            <p className="text-sm text-muted-foreground">
              Количество откликов не равно качеству кандидатов. Отслеживайте
              конверсию и качество найма.
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              3. Отсутствие бенчмарков
            </h3>
            <p className="text-sm text-muted-foreground">
              Без сравнения с рынком невозможно понять, хорошие у вас показатели
              или нет.
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              4. Слишком много метрик
            </h3>
            <p className="text-sm text-muted-foreground">
              Попытка отслеживать 20+ метрик приводит к параличу анализа.
              Фокусируйтесь на 5-7 ключевых.
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              5. Метрики ради метрик
            </h3>
            <p className="text-sm text-muted-foreground">
              Каждая метрика должна вести к действию. Если метрика не влияет на
              решения — не тратьте на неё время.
            </p>
          </div>
        </div>

        <div className="my-8 rounded-lg border border-green-500/30 bg-green-500/5 p-6">
          <h3 className="font-semibold text-foreground mb-3">
            Чек-лист: с чего начать
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">1.</span>
              <span>Выберите 5-7 ключевых метрик для вашего бизнеса</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">2.</span>
              <span>Настройте автоматический сбор данных</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">3.</span>
              <span>
                Создайте простой дашборд (Excel или специализированная система)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">4.</span>
              <span>Установите целевые значения (бенчмарки)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">5.</span>
              <span>Анализируйте данные еженедельно</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">6.</span>
              <span>Принимайте решения на основе данных</span>
            </li>
          </ul>
        </div>

        <DocsCallout type="info" title="Готовы начать?">
          Система QBS Автонайм автоматически собирает все ключевые метрики и
          строит дашборды в реальном времени. Вам не нужно вручную считать
          показатели — всё уже готово.
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
            href="/analytics"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Аналитика и отчёты
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
