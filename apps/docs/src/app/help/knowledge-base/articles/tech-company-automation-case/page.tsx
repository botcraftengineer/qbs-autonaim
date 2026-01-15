import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";

export default function TechCompanyAutomationCasePage() {
  const tocItems = [
    { id: "challenge", title: "Вызов", level: 2 },
    { id: "solution", title: "Решение", level: 2 },
    { id: "implementation", title: "Внедрение", level: 2 },
    { id: "results", title: "Результаты", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "База знаний", href: "/help/knowledge-base" },
            { title: "Кейс IT-компании: автоматизация найма на 500 вакансий" },
          ]}
        />

        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
            Кейсы компаний
          </span>
          <span className="text-sm text-muted-foreground">18 мин чтения</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Кейс IT-компании: автоматизация найма на 500 вакансий
        </h1>

        <p className="text-lg text-muted-foreground mb-8">
          Как средняя IT-компания перешла от ручного подбора к
          автоматизированной платформе и увеличила эффективность найма в 3 раза
        </p>

        <h2
          id="challenge"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Вызов: масштабирование без увеличения команды
        </h2>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3">
            Исходная ситуация:
          </h3>
          <ul className="space-y-2 text-sm">
            <li>🏢 IT-компания, 200 сотрудников</li>
            <li>📈 Планы роста до 700 человек за год</li>
            <li>👥 Команда HR: 3 рекрутера</li>
            <li>📊 500+ открытых вакансий одновременно</li>
            <li>⏱️ Среднее время найма: 45 дней</li>
            <li>💰 Стоимость найма: 180,000 ₽ на позицию</li>
          </ul>
        </div>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Компания столкнулась с классической проблемой роста: количество
          вакансий росло быстрее, чем команда рекрутеров могла их закрывать.
          Найм новых рекрутеров не решал проблему — они тоже тонули в потоке
          резюме.
        </p>

        <h2
          id="solution"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Решение: автоматизация рутинных процессов
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Компания решила автоматизировать все рутинные задачи и освободить
          рекрутеров для работы с кандидатами. Выбор пал на комплексную
          платформу с искусственным интеллектом.
        </p>

        <div className="space-y-4 my-6">
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-2">
              Что автоматизировали:
            </h3>
            <ul className="text-sm space-y-2 ml-4">
              <li>✓ Скрининг резюме — оценка соответствия требованиям</li>
              <li>✓ Первичные интервью — автоматические голосовые звонки</li>
              <li>✓ Коммуникация — уведомления и напоминания кандидатам</li>
              <li>✓ Планирование — автоматическая запись на интервью</li>
              <li>✓ Аналитика — дашборды в реальном времени</li>
            </ul>
          </div>
        </div>

        <h2
          id="implementation"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Внедрение: 3 месяца от старта до результата
        </h2>

        <div className="space-y-6 my-6">
          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Месяц 1: Подготовка
            </h3>
            <ul className="text-sm space-y-1 ml-4">
              <li>• Аудит текущих процессов</li>
              <li>• Настройка критериев оценки для каждой позиции</li>
              <li>• Интеграция с HH.ru и другими источниками</li>
              <li>• Обучение команды работе с платформой</li>
            </ul>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Месяц 2: Пилот
            </h3>
            <ul className="text-sm space-y-1 ml-4">
              <li>• Запуск на 10 вакансиях</li>
              <li>• Корректировка критериев оценки</li>
              <li>• Сбор обратной связи от рекрутеров</li>
              <li>• Оптимизация процессов</li>
            </ul>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Месяц 3: Масштабирование
            </h3>
            <ul className="text-sm space-y-1 ml-4">
              <li>• Подключение всех вакансий</li>
              <li>• Автоматизация коммуникации</li>
              <li>• Настройка дашбордов для руководства</li>
            </ul>
          </div>
        </div>

        <DocsCallout type="tip" title="Ключ к успеху">
          Постепенное внедрение позволило команде адаптироваться к новым
          процессам без стресса и потери качества найма.
        </DocsCallout>

        <h2
          id="results"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Результаты: +300% эффективность за 6 месяцев
        </h2>

        <div className="grid gap-4 my-6">
          <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-6">
            <h3 className="font-semibold text-foreground mb-4">
              Количественные результаты:
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Время найма
                </p>
                <p className="text-3xl font-bold text-foreground">
                  45 → 12 дней
                </p>
                <p className="text-xs text-green-600">-73%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Стоимость найма
                </p>
                <p className="text-3xl font-bold text-foreground">
                  180K → 65K ₽
                </p>
                <p className="text-xs text-green-600">-64%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Закрытых вакансий/месяц
                </p>
                <p className="text-3xl font-bold text-foreground">15 → 45</p>
                <p className="text-xs text-green-600">+200%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Качество найма
                </p>
                <p className="text-3xl font-bold text-foreground">75% → 92%</p>
                <p className="text-xs text-green-600">+17%</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-6">
            <h3 className="font-semibold text-foreground mb-3">
              Качественные результаты:
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                ✓ Рекрутеры тратят 80% времени на общение с кандидатами, а не на
                просмотр резюме
              </li>
              <li>✓ Кандидаты получают обратную связь в течение 24 часов</li>
              <li>
                ✓ Руководство видит прозрачную аналитику по всем вакансиям
              </li>
              <li>✓ Снизилась текучка в первый год работы на 25%</li>
            </ul>
          </div>
        </div>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3">
            Отзыв HR-директора:
          </h3>
          <p className="text-sm italic text-muted-foreground">
            "Мы смогли масштабировать найм в 3 раза без увеличения команды
            рекрутеров. Более того, качество кандидатов выросло, потому что
            рекрутеры теперь фокусируются на действительно важных задачах —
            построении отношений с кандидатами и улучшении candidate
            experience."
          </p>
        </div>

        <DocsCallout type="info" title="Хотите похожих результатов?">
          Начните с автоматизации скрининга резюме — это даст быстрый эффект и
          освободит 60-70% времени рекрутеров.
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
            href="/quickstart"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Начать автоматизацию
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
