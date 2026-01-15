import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";

export default function OzonCaseStudyPage() {
  const tocItems = [
    { id: "challenge", title: "Вызов", level: 2 },
    { id: "approach", title: "Подход", level: 2 },
    { id: "execution", title: "Реализация", level: 2 },
    { id: "results", title: "Результаты", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "База знаний", href: "/help/knowledge-base" },
            { title: "Как Ozon нанял 200+ разработчиков за 3 месяца" },
          ]}
        />

        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
            Кейсы компаний
          </span>
          <span className="text-sm text-muted-foreground">14 мин чтения</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Как Ozon нанял 200+ разработчиков за 3 месяца
        </h1>

        <p className="text-lg text-muted-foreground mb-8">
          История масштабирования команды разработки с помощью AI-технологий и
          мультиканального подхода
        </p>

        <h2
          id="challenge"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Вызов: агрессивный рост в условиях дефицита кадров
        </h2>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3">
            Исходная ситуация:
          </h3>
          <ul className="space-y-2 text-sm">
            <li>🏢 Ozon — крупнейший e-commerce в России</li>
            <li>📈 Запуск 15 новых продуктов за квартал</li>
            <li>👥 Потребность: 200+ разработчиков за 3 месяца</li>
            <li>⚡ Конкуренция за таланты с Яндекс, VK, Сбер</li>
            <li>⏱️ Текущее время найма: 35 дней</li>
            <li>💰 Бюджет на найм: ограничен</li>
          </ul>
        </div>

        <p className="leading-relaxed text-foreground/80 mb-4">
          В условиях острого дефицита IT-специалистов на рынке, Ozon столкнулся
          с необходимостью масштабировать команду разработки в 2 раза за один
          квартал. Традиционные методы найма не справлялись с такой нагрузкой.
        </p>

        <h2
          id="approach"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Подход: комплексная стратегия найма
        </h2>

        <div className="space-y-6 my-6">
          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              1. Автоматизация скрининга
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Внедрение AI-системы для первичной оценки кандидатов, что
              позволило обрабатывать 1000+ резюме в день.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              2. Мультиканальное привлечение
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Одновременная работа с 12 каналами: HH.ru, LinkedIn, Telegram,
              GitHub, конференции, университеты, рекомендации.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              3. Ускоренный процесс интервью
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Сокращение этапов с 5 до 3, параллельное проведение технического и
              культурного интервью.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              4. Employer branding
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Активная работа с брендом работодателя: публикации, митапы,
              хакатоны, open source проекты.
            </p>
          </div>
        </div>

        <h2
          id="execution"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Реализация: 90 дней интенсивной работы
        </h2>

        <div className="space-y-6 my-6">
          <div className="rounded-lg border border-border p-6 bg-primary/5">
            <h3 className="font-semibold text-foreground mb-3">
              Месяц 1: Подготовка инфраструктуры
            </h3>
            <ul className="text-sm space-y-2 ml-4">
              <li>• Настройка AI-платформы для скрининга</li>
              <li>• Создание единой базы кандидатов</li>
              <li>• Обучение 50 технических интервьюеров</li>
              <li>• Запуск employer branding кампании</li>
              <li>• Разработка новых описаний вакансий</li>
            </ul>
          </div>

          <div className="rounded-lg border border-border p-6 bg-primary/5">
            <h3 className="font-semibold text-foreground mb-3">
              Месяц 2: Активное привлечение
            </h3>
            <ul className="text-sm space-y-2 ml-4">
              <li>• Публикация 200+ вакансий на всех каналах</li>
              <li>• Проведение 5 митапов и хакатонов</li>
              <li>• Запуск программы рекомендаций с бонусом 100K ₽</li>
              <li>• Прямой поиск 500+ пассивных кандидатов</li>
              <li>• Обработка 15,000+ откликов через AI</li>
            </ul>
          </div>

          <div className="rounded-lg border border-border p-6 bg-primary/5">
            <h3 className="font-semibold text-foreground mb-3">
              Месяц 3: Массовые интервью и офферы
            </h3>
            <ul className="text-sm space-y-2 ml-4">
              <li>• 2,500+ проведённых интервью</li>
              <li>• 300+ отправленных офферов</li>
              <li>• 220 принятых офферов</li>
              <li>• Онбординг первых 150 сотрудников</li>
            </ul>
          </div>
        </div>

        <DocsCallout type="tip" title="Ключевой фактор успеха">
          Параллельная работа всех каналов и автоматизация рутины позволили
          команде из 15 рекрутеров справиться с нагрузкой, которая обычно
          требует 50+ человек.
        </DocsCallout>

        <h2
          id="results"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Результаты: превышение плана на 10%
        </h2>

        <div className="grid gap-4 my-6">
          <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-6">
            <h3 className="font-semibold text-foreground mb-4">
              Количественные показатели:
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Нанято</p>
                <p className="text-3xl font-bold text-foreground">
                  220 человек
                </p>
                <p className="text-xs text-green-600">План: 200</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Время найма
                </p>
                <p className="text-3xl font-bold text-foreground">18 дней</p>
                <p className="text-xs text-green-600">Было: 35 дней</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Стоимость найма
                </p>
                <p className="text-3xl font-bold text-foreground">95K ₽</p>
                <p className="text-xs text-green-600">Было: 165K ₽</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Acceptance rate
                </p>
                <p className="text-3xl font-bold text-foreground">73%</p>
                <p className="text-xs text-green-600">Было: 65%</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-6">
            <h3 className="font-semibold text-foreground mb-3">
              Распределение по каналам:
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>HH.ru</span>
                <span className="font-semibold">35% (77 человек)</span>
              </div>
              <div className="flex justify-between">
                <span>Рекомендации сотрудников</span>
                <span className="font-semibold">28% (62 человека)</span>
              </div>
              <div className="flex justify-between">
                <span>LinkedIn + прямой поиск</span>
                <span className="font-semibold">18% (40 человек)</span>
              </div>
              <div className="flex justify-between">
                <span>Telegram</span>
                <span className="font-semibold">12% (26 человек)</span>
              </div>
              <div className="flex justify-between">
                <span>Конференции и митапы</span>
                <span className="font-semibold">7% (15 человек)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3">
            Отзыв Head of Recruitment Ozon:
          </h3>
          <p className="text-sm italic text-muted-foreground mb-4">
            "Ключом к успеху стала комбинация технологий и человеческого
            подхода. AI взял на себя рутину, а рекрутеры сфокусировались на
            построении отношений с кандидатами. Мы не просто закрыли вакансии —
            мы создали систему, которая работает и масштабируется."
          </p>
          <p className="text-sm text-muted-foreground">
            Особенно важным оказался employer branding. Митапы и хакатоны не
            только привлекли кандидатов, но и создали сообщество вокруг бренда
            Ozon Tech.
          </p>
        </div>

        <div className="my-6 rounded-lg border border-border p-6">
          <h3 className="font-semibold text-foreground mb-3">
            Уроки для других компаний:
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">1.</span>
              <span className="text-sm">
                <strong>Автоматизация критична</strong> — без AI невозможно
                обработать тысячи резюме качественно и быстро
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">2.</span>
              <span className="text-sm">
                <strong>Мультиканальность обязательна</strong> — один канал не
                даст нужного объёма качественных кандидатов
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">3.</span>
              <span className="text-sm">
                <strong>Рекомендации работают</strong> — программа с хорошим
                бонусом даёт 25-30% найма
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">4.</span>
              <span className="text-sm">
                <strong>Скорость решает</strong> — сокращение времени найма на
                50% увеличивает acceptance rate
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">5.</span>
              <span className="text-sm">
                <strong>Бренд работодателя окупается</strong> — инвестиции в
                employer branding снижают стоимость найма
              </span>
            </li>
          </ul>
        </div>

        <DocsCallout type="info" title="Хотите повторить успех?">
          Начните с автоматизации скрининга и мультиканального привлечения. Это
          два самых быстрых способа увеличить эффективность найма в 2-3 раза.
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
