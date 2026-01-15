import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";

export default function StartupSuccessStoryPage() {
  const tocItems = [
    { id: "background", title: "Предыстория", level: 2 },
    { id: "problem", title: "Проблема", level: 2 },
    { id: "solution", title: "Решение", level: 2 },
    { id: "results", title: "Результаты", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "База знаний", href: "/help/knowledge-base" },
            { title: "История успеха IT-компании: +300% эффективность" },
          ]}
        />

        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
            Кейсы компаний
          </span>
          <span className="text-sm text-muted-foreground">11 мин чтения</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          История успеха IT-компании: +300% эффективность
        </h1>

        <p className="text-lg text-muted-foreground mb-8">
          Как стартап из 20 человек стал лидером рынка благодаря правильной
          стратегии найма и AI-технологиям
        </p>

        <h2
          id="background"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Предыстория: амбициозный стартап с большими планами
        </h2>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3">О компании:</h3>
          <ul className="space-y-2 text-sm">
            <li>🚀 Fintech стартап, основан в 2023 году</li>
            <li>👥 Команда: 20 человек (15 разработчиков, 5 бизнес)</li>
            <li>💰 Раунд A: $3M инвестиций</li>
            <li>📈 Цель: вырасти до 100 человек за год</li>
            <li>🎯 Продукт: B2B SaaS для автоматизации финансов</li>
          </ul>
        </div>

        <p className="leading-relaxed text-foreground/80 mb-4">
          После успешного раунда инвестиций компания столкнулась с классической
          проблемой стартапов: как быстро масштабировать команду, не потеряв
          качество и культуру.
        </p>

        <h2
          id="problem"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Проблема: найм тормозит рост
        </h2>

        <div className="space-y-4 my-6">
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
            <h3 className="font-semibold text-foreground mb-2">
              Что не работало:
            </h3>
            <ul className="text-sm space-y-2 ml-4">
              <li>• Один HR на всю компанию (совмещал с другими задачами)</li>
              <li>• Время найма: 60+ дней на одну позицию</li>
              <li>• Низкий acceptance rate: 50% (каждый второй отказывался)</li>
              <li>• Высокая стоимость найма: 200K+ ₽ на позицию</li>
              <li>• Конкуренция с крупными компаниями за таланты</li>
              <li>• Отсутствие бренда работодателя</li>
            </ul>
          </div>
        </div>

        <p className="leading-relaxed text-foreground/80 mb-4">
          За 6 месяцев удалось нанять только 8 человек вместо запланированных
          40. Продуктовые планы срывались, инвесторы нервничали, команда
          выгорала от перегрузки.
        </p>

        <h2
          id="solution"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Решение: системный подход к найму
        </h2>

        <div className="space-y-6 my-6">
          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Шаг 1: Автоматизация (месяц 1)
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Внедрили AI-платформу для автоматического скрининга резюме и
              первичных интервью.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Результат:</p>
              <ul className="space-y-1 ml-4">
                <li>• Время на скрининг: с 2 часов до 5 минут на кандидата</li>
                <li>• HR освободил 70% времени для стратегических задач</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Шаг 2: Employer branding (месяц 2-3)
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Запустили активную работу с брендом работодателя.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Что сделали:</p>
              <ul className="space-y-1 ml-4">
                <li>• Создали Telegram-канал о жизни компании</li>
                <li>• Начали публиковать технические статьи на Хабре</li>
                <li>• Провели 2 митапа для разработчиков</li>
                <li>• Запустили open source проект</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Шаг 3: Программа рекомендаций (месяц 3)
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Мотивировали команду приводить друзей и коллег.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Условия:</p>
              <ul className="space-y-1 ml-4">
                <li>• 80,000 ₽ за успешный найм</li>
                <li>• Выплата после прохождения испытательного срока</li>
                <li>• Дополнительный бонус за senior-специалистов</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Шаг 4: Оптимизация процесса (месяц 4)
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Сократили количество этапов и ускорили принятие решений.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Изменения:</p>
              <ul className="space-y-1 ml-4">
                <li>• Этапов интервью: с 4 до 2</li>
                <li>• Решение об оффере: в течение 24 часов</li>
                <li>
                  • Тестовое задание: опционально, только для сомнительных
                  кандидатов
                </li>
              </ul>
            </div>
          </div>
        </div>

        <DocsCallout type="tip" title="Ключевой инсайт">
          Стартапы не могут конкурировать с крупными компаниями по зарплатам, но
          могут выигрывать за счёт скорости, культуры и возможностей роста.
        </DocsCallout>

        <h2
          id="results"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Результаты: от 8 до 85 человек за год
        </h2>

        <div className="grid gap-4 my-6">
          <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-6">
            <h3 className="font-semibold text-foreground mb-4">
              Трансформация за 12 месяцев:
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Размер команды
                </p>
                <p className="text-3xl font-bold text-foreground">20 → 85</p>
                <p className="text-xs text-green-600">+325%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Время найма
                </p>
                <p className="text-3xl font-bold text-foreground">
                  60 → 15 дней
                </p>
                <p className="text-xs text-green-600">-75%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Acceptance rate
                </p>
                <p className="text-3xl font-bold text-foreground">50% → 85%</p>
                <p className="text-xs text-green-600">+70%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Стоимость найма
                </p>
                <p className="text-3xl font-bold text-foreground">
                  200K → 75K ₽
                </p>
                <p className="text-xs text-green-600">-62.5%</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-6">
            <h3 className="font-semibold text-foreground mb-3">
              Источники найма (85 человек):
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Рекомендации сотрудников</span>
                <span className="font-semibold">42% (36 человек)</span>
              </div>
              <div className="flex justify-between">
                <span>HH.ru</span>
                <span className="font-semibold">25% (21 человек)</span>
              </div>
              <div className="flex justify-between">
                <span>Telegram и соцсети</span>
                <span className="font-semibold">18% (15 человек)</span>
              </div>
              <div className="flex justify-between">
                <span>Митапы и конференции</span>
                <span className="font-semibold">10% (9 человек)</span>
              </div>
              <div className="flex justify-between">
                <span>Прямой поиск</span>
                <span className="font-semibold">5% (4 человека)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3">
            Отзыв CEO компании:
          </h3>
          <p className="text-sm italic text-muted-foreground mb-4">
            "Год назад найм был нашим главным узким местом. Мы теряли сделки и
            инвестиции из-за того, что не могли быстро масштабировать команду.
            Сегодня у нас 85 человек, и мы продолжаем расти."
          </p>
          <p className="text-sm text-muted-foreground">
            Самым неожиданным открытием стало то, что программа рекомендаций
            дала 42% найма. Наши сотрудники стали лучшими амбассадорами бренда.
            Они приводили не просто знакомых, а людей, которые разделяют нашу
            культуру и ценности.
          </p>
        </div>

        <div className="my-6 rounded-lg border border-border p-6">
          <h3 className="font-semibold text-foreground mb-3">
            Влияние на бизнес:
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span className="text-sm">
                <strong>Выручка выросла в 5 раз</strong> — благодаря быстрому
                найму удалось запустить все запланированные продукты
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span className="text-sm">
                <strong>Раунд B: $10M</strong> — инвесторы оценили способность
                компании масштабироваться
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span className="text-sm">
                <strong>Retention 95%</strong> — правильный найм снизил текучку
                до минимума
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span className="text-sm">
                <strong>Топ-3 работодателя</strong> — в рейтинге лучших
                стартапов для работы
              </span>
            </li>
          </ul>
        </div>

        <div className="my-6 rounded-lg border border-border p-6 bg-primary/5">
          <h3 className="font-semibold text-foreground mb-3">
            5 уроков для других стартапов:
          </h3>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-foreground mb-1">
                1. Инвестируйте в найм с первого дня
              </p>
              <p className="text-sm text-muted-foreground">
                Найм — это не расход, а инвестиция. Каждый день без нужного
                специалиста стоит дороже, чем любые инструменты для рекрутинга.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">
                2. Автоматизация критична для стартапов
              </p>
              <p className="text-sm text-muted-foreground">
                У стартапов нет ресурсов на большую HR-команду. AI позволяет
                одному человеку делать работу пятерых.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">
                3. Рекомендации — золотая жила
              </p>
              <p className="text-sm text-muted-foreground">
                Не жалейте денег на программу рекомендаций. 80K ₽ за найм — это
                дёшево по сравнению с агентствами (150-200K ₽).
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">
                4. Скорость решает всё
              </p>
              <p className="text-sm text-muted-foreground">
                Хорошие кандидаты получают несколько офферов. Кто быстрее
                принимает решение — тот и выигрывает.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">
                5. Культура важнее навыков
              </p>
              <p className="text-sm text-muted-foreground">
                Навыкам можно научить, культуру изменить нельзя. Нанимайте
                людей, которые разделяют ваши ценности.
              </p>
            </div>
          </div>
        </div>

        <DocsCallout type="info" title="Хотите повторить успех?">
          Начните с малого: автоматизируйте скрининг и запустите программу
          рекомендаций. Эти два шага дадут 70% результата при минимальных
          инвестициях.
        </DocsCallout>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3">Что дальше:</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Компания продолжает расти и планирует достичь 200 человек к концу
            2026 года. Система найма, построенная за первый год, теперь работает
            как часы и масштабируется вместе с бизнесом.
          </p>
          <p className="text-sm text-muted-foreground">
            Главный вывод: правильная стратегия найма может стать конкурентным
            преимуществом стартапа и ключом к успеху на рынке.
          </p>
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
