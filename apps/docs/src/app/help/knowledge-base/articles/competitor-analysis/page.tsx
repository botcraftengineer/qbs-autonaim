import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";

export default function CompetitorAnalysisPage() {
  const tocItems = [
    { id: "why", title: "Зачем анализировать", level: 2 },
    { id: "what", title: "Что анализировать", level: 2 },
    { id: "how", title: "Как анализировать", level: 2 },
    { id: "tools", title: "Инструменты", level: 2 },
    { id: "action", title: "Применение", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "База знаний", href: "/help/knowledge-base" },
            { title: "Анализ конкурентов на рынке труда" },
          ]}
        />

        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
            Пошаговые гайды
          </span>
          <span className="text-sm text-muted-foreground">8 мин чтения</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Анализ конкурентов на рынке труда
        </h1>

        <p className="text-lg text-muted-foreground mb-8">
          Как изучать предложения других компаний и использовать эту информацию
          для улучшения своей стратегии найма
        </p>

        <h2
          id="why"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Зачем анализировать конкурентов
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Вы конкурируете за одних и тех же кандидатов. Понимание того, что
          предлагают другие компании, помогает создать более привлекательное
          предложение и выиграть в борьбе за таланты.
        </p>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3">
            Что даёт анализ:
          </h3>
          <ul className="space-y-2 text-sm">
            <li>💰 Понимание рыночных зарплат и бенефитов</li>
            <li>📝 Идеи для улучшения описаний вакансий</li>
            <li>🎯 Выявление своих конкурентных преимуществ</li>
            <li>⚠️ Обнаружение слабых мест в своём предложении</li>
            <li>📊 Данные для обоснования бюджета перед руководством</li>
            <li>🔍 Понимание трендов на рынке труда</li>
          </ul>
        </div>

        <h2
          id="what"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Что анализировать у конкурентов
        </h2>

        <div className="space-y-6 my-6">
          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              1. Компенсация и бенефиты
            </h3>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Что смотреть:</p>
              <ul className="space-y-1 ml-4">
                <li>• Зарплатные вилки (если указаны)</li>
                <li>• Бонусы и опционы</li>
                <li>• ДМС и страхование</li>
                <li>• Корпоративное обучение</li>
                <li>• Дополнительные льготы (спорт, питание, транспорт)</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              2. Условия работы
            </h3>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Что смотреть:</p>
              <ul className="space-y-1 ml-4">
                <li>• Формат работы (офис/удалёнка/гибрид)</li>
                <li>• График работы</li>
                <li>• Офис и локация</li>
                <li>• Оборудование для работы</li>
                <li>• Испытательный срок</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              3. Требования к кандидатам
            </h3>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Что смотреть:</p>
              <ul className="space-y-1 ml-4">
                <li>• Обязательные навыки и опыт</li>
                <li>• Желательные навыки</li>
                <li>• Образование</li>
                <li>• Языки</li>
                <li>• Софт-скиллы</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              4. Процесс найма
            </h3>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Что смотреть:</p>
              <ul className="space-y-1 ml-4">
                <li>• Количество этапов интервью</li>
                <li>• Наличие тестового задания</li>
                <li>• Скорость ответа на отклики</li>
                <li>• Качество коммуникации</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              5. Employer brand
            </h3>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Что смотреть:</p>
              <ul className="space-y-1 ml-4">
                <li>• Активность в соцсетях</li>
                <li>• Отзывы на Glassdoor / Хабр Карьера</li>
                <li>• Карьерный сайт</li>
                <li>• Участие в конференциях и митапах</li>
              </ul>
            </div>
          </div>
        </div>

        <h2
          id="how"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Как проводить анализ: пошаговый план
        </h2>

        <div className="space-y-6 my-6">
          <div className="border-l-4 border-green-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Шаг 1: Определите конкурентов (1 час)
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Составьте список 5-10 компаний, с которыми вы конкурируете за
              кандидатов.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Критерии выбора:</p>
              <ul className="space-y-1 ml-4">
                <li>• Похожая индустрия или продукт</li>
                <li>• Аналогичный размер компании</li>
                <li>• Та же география</li>
                <li>• Похожий технологический стек</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-green-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Шаг 2: Соберите данные (2-3 часа)
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Изучите все доступные источники информации о конкурентах.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Источники:</p>
              <ul className="space-y-1 ml-4">
                <li>• HH.ru — вакансии и условия</li>
                <li>• Glassdoor / Хабр Карьера — отзывы сотрудников</li>
                <li>• LinkedIn — профили сотрудников</li>
                <li>• Telegram / VK — корпоративные каналы</li>
                <li>• Карьерные сайты компаний</li>
                <li>• Публичные зарплатные опросы</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-green-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Шаг 3: Структурируйте данные (1 час)
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Создайте таблицу для сравнения конкурентов по ключевым параметрам.
            </p>
          </div>

          <div className="border-l-4 border-green-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Шаг 4: Проанализируйте и сделайте выводы (1 час)
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Выявите паттерны, сильные и слабые стороны конкурентов.
            </p>
          </div>
        </div>

        <h2
          id="tools"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Инструменты для анализа
        </h2>

        <div className="space-y-4 my-6">
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-2">
              Бесплатные инструменты:
            </h3>
            <ul className="text-sm space-y-2 ml-4">
              <li>
                <strong>Google Sheets</strong> — для создания сравнительной
                таблицы
              </li>
              <li>
                <strong>HH.ru</strong> — поиск вакансий конкурентов
              </li>
              <li>
                <strong>Glassdoor</strong> — отзывы сотрудников и зарплаты
              </li>
              <li>
                <strong>LinkedIn</strong> — профили сотрудников и компаний
              </li>
              <li>
                <strong>Telegram</strong> — корпоративные каналы
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-2">
              Платные инструменты:
            </h3>
            <ul className="text-sm space-y-2 ml-4">
              <li>
                <strong>Хабр Карьера</strong> — зарплатные опросы и аналитика
              </li>
              <li>
                <strong>Talantix</strong> — данные о зарплатах и бенефитах
              </li>
              <li>
                <strong>LinkedIn Recruiter</strong> — расширенный поиск и
                аналитика
              </li>
            </ul>
          </div>
        </div>

        <DocsCallout type="tip" title="Лайфхак">
          Подпишитесь на корпоративные каналы конкурентов в Telegram. Это
          бесплатный способ отслеживать их активность и новости.
        </DocsCallout>

        <h2
          id="action"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Как применить результаты анализа
        </h2>

        <div className="space-y-6 my-6">
          <div className="rounded-lg border border-border p-6 bg-primary/5">
            <h3 className="font-semibold text-foreground mb-3">
              1. Корректировка зарплатных предложений
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Если ваши зарплаты ниже рынка на 20%+, вы будете терять кандидатов
              на финальной стадии.
            </p>
            <div className="text-sm">
              <p className="font-medium mb-1">Действия:</p>
              <ul className="space-y-1 ml-4">
                <li>• Пересмотрите зарплатные вилки</li>
                <li>• Добавьте бонусы или опционы</li>
                <li>• Усильте другие бенефиты</li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-border p-6 bg-primary/5">
            <h3 className="font-semibold text-foreground mb-3">
              2. Улучшение описаний вакансий
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Изучите, как конкуренты описывают похожие позиции. Возьмите лучшие
              практики.
            </p>
            <div className="text-sm">
              <p className="font-medium mb-1">Действия:</p>
              <ul className="space-y-1 ml-4">
                <li>• Добавьте конкретные примеры проектов</li>
                <li>• Укажите технологический стек</li>
                <li>• Опишите возможности роста</li>
                <li>• Добавьте информацию о команде</li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-border p-6 bg-primary/5">
            <h3 className="font-semibold text-foreground mb-3">
              3. Оптимизация процесса найма
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Если у конкурентов 2 этапа интервью, а у вас 5 — вы проигрываете в
              скорости.
            </p>
            <div className="text-sm">
              <p className="font-medium mb-1">Действия:</p>
              <ul className="space-y-1 ml-4">
                <li>• Сократите количество этапов</li>
                <li>• Ускорьте принятие решений</li>
                <li>• Улучшите коммуникацию с кандидатами</li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-border p-6 bg-primary/5">
            <h3 className="font-semibold text-foreground mb-3">
              4. Развитие employer brand
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Если конкуренты активны в соцсетях, а вы нет — вы теряете
              видимость.
            </p>
            <div className="text-sm">
              <p className="font-medium mb-1">Действия:</p>
              <ul className="space-y-1 ml-4">
                <li>• Запустите корпоративный Telegram-канал</li>
                <li>• Публикуйте истории сотрудников</li>
                <li>• Проводите митапы и хакатоны</li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-border p-6 bg-primary/5">
            <h3 className="font-semibold text-foreground mb-3">
              5. Выделение уникальных преимуществ
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Найдите то, что отличает вас от конкурентов в лучшую сторону.
            </p>
            <div className="text-sm">
              <p className="font-medium mb-1">Примеры:</p>
              <ul className="space-y-1 ml-4">
                <li>• Более интересные проекты</li>
                <li>• Быстрый карьерный рост</li>
                <li>• Современный технологический стек</li>
                <li>• Гибкий график и удалёнка</li>
                <li>• Сильная команда и менторство</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3">
            Пример сравнительной таблицы:
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2">Параметр</th>
                  <th className="text-left py-2">Ваша компания</th>
                  <th className="text-left py-2">Конкурент A</th>
                  <th className="text-left py-2">Конкурент B</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border">
                  <td className="py-2">Зарплата Senior Dev</td>
                  <td className="py-2">200-250K ₽</td>
                  <td className="py-2">250-300K ₽</td>
                  <td className="py-2">220-280K ₽</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2">Формат работы</td>
                  <td className="py-2">Гибрид 3/2</td>
                  <td className="py-2">Полная удалёнка</td>
                  <td className="py-2">Офис 5/2</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2">Этапов интервью</td>
                  <td className="py-2">3</td>
                  <td className="py-2">2</td>
                  <td className="py-2">4</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2">Время найма</td>
                  <td className="py-2">20 дней</td>
                  <td className="py-2">15 дней</td>
                  <td className="py-2">30 дней</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <DocsCallout type="warning" title="Важно">
          Не копируйте конкурентов слепо. Используйте анализ для понимания
          рынка, но создавайте уникальное предложение, основанное на ваших
          сильных сторонах.
        </DocsCallout>

        <div className="my-6 rounded-lg border border-border p-6">
          <h3 className="font-semibold text-foreground mb-3">
            Частота анализа:
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <strong>Полный анализ:</strong> раз в квартал (4-5 часов)
            </li>
            <li>
              <strong>Мониторинг зарплат:</strong> ежемесячно (1 час)
            </li>
            <li>
              <strong>Отслеживание вакансий:</strong> еженедельно (30 минут)
            </li>
            <li>
              <strong>Проверка соцсетей:</strong> еженедельно (15 минут)
            </li>
          </ul>
        </div>

        <div className="my-6 rounded-lg border border-green-500/30 bg-green-500/5 p-6">
          <h3 className="font-semibold text-foreground mb-3">
            Чек-лист для анализа:
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Определены 5-10 ключевых конкурентов</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Собраны данные по зарплатам и бенефитам</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Изучены описания вакансий</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Проанализированы отзывы сотрудников</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Оценена активность в соцсетях</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Выявлены сильные и слабые стороны</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Составлен план действий</span>
            </li>
          </ul>
        </div>

        <DocsCallout type="info" title="Совет">
          Создайте Google Alert на названия компаний-конкурентов. Вы будете
          получать уведомления о всех упоминаниях в новостях и соцсетях.
        </DocsCallout>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3">
            Этические правила:
          </h3>
          <ul className="space-y-2 text-sm">
            <li>✓ Используйте только публичную информацию</li>
            <li>✓ Не выдавайте себя за кандидата для получения инсайдов</li>
            <li>✓ Не переманивайте сотрудников агрессивными методами</li>
            <li>✓ Уважайте конфиденциальность</li>
            <li>
              ✓ Фокусируйтесь на улучшении своего предложения, а не на подрыве
              конкурентов
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
            href="/help/knowledge-base/articles/recruitment-metrics-2025"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Метрики найма
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
