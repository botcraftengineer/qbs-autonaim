import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";

export default function EmployerBrandingSocialPage() {
  const tocItems = [
    { id: "why", title: "Зачем нужен бренд", level: 2 },
    { id: "platforms", title: "Платформы", level: 2 },
    { id: "content", title: "Контент-стратегия", level: 2 },
    { id: "implementation", title: "План внедрения", level: 2 },
    { id: "metrics", title: "Метрики", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "База знаний", href: "/help/knowledge-base" },
            { title: "Создание бренда работодателя в соцсетях" },
          ]}
        />

        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
            Пошаговые гайды
          </span>
          <span className="text-sm text-muted-foreground">16 мин чтения</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Создание бренда работодателя в соцсетях
        </h1>

        <p className="text-lg text-muted-foreground mb-8">
          Комплексный гайд по привлечению кандидатов через социальные сети и
          построению сильного employer brand
        </p>

        <h2
          id="why"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Зачем инвестировать в бренд работодателя
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          75% кандидатов изучают компанию в соцсетях перед откликом на вакансию.
          Сильный employer brand снижает стоимость найма на 50% и увеличивает
          качество кандидатов на 40%.
        </p>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3">
            Преимущества сильного бренда:
          </h3>
          <ul className="space-y-2 text-sm">
            <li>💰 Снижение стоимости найма на 40-50%</li>
            <li>⏱️ Сокращение времени найма на 30%</li>
            <li>🎯 Увеличение качества откликов на 40%</li>
            <li>📈 Рост acceptance rate на 25%</li>
            <li>🔄 Снижение текучки на 28%</li>
            <li>⭐ Привлечение пассивных кандидатов</li>
          </ul>
        </div>

        <h2
          id="platforms"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Выбор платформ для разных аудиторий
        </h2>

        <div className="space-y-6 my-6">
          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Telegram — главная платформа для IT
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Самая активная аудитория IT-специалистов в России. Обязательна для
              tech-компаний.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Что публиковать:</p>
              <ul className="space-y-1 ml-4">
                <li>• Технические кейсы и решения</li>
                <li>• Истории сотрудников</li>
                <li>• Анонсы вакансий</li>
                <li>• Жизнь офиса и команды</li>
                <li>• Митапы и конференции</li>
              </ul>
              <p className="mt-2 text-muted-foreground">
                Частота: 3-5 постов в неделю
              </p>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              LinkedIn — для senior-специалистов
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Профессиональная сеть для поиска опытных специалистов и
              руководителей.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Что публиковать:</p>
              <ul className="space-y-1 ml-4">
                <li>• Достижения компании</li>
                <li>• Экспертные статьи</li>
                <li>• Карьерные истории</li>
                <li>• Корпоративная культура</li>
              </ul>
              <p className="mt-2 text-muted-foreground">
                Частота: 2-3 поста в неделю
              </p>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              VK — для массового найма
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Широкая аудитория для найма на позиции начального и среднего
              уровня.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Что публиковать:</p>
              <ul className="space-y-1 ml-4">
                <li>• Вакансии с простым описанием</li>
                <li>• Фото и видео из офиса</li>
                <li>• Корпоративные мероприятия</li>
                <li>• Отзывы сотрудников</li>
              </ul>
              <p className="mt-2 text-muted-foreground">
                Частота: 5-7 постов в неделю
              </p>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              YouTube — для глубокого погружения
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Видеоконтент для демонстрации культуры и экспертизы компании.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Форматы:</p>
              <ul className="space-y-1 ml-4">
                <li>• Экскурсии по офису</li>
                <li>• Интервью с сотрудниками</li>
                <li>• День из жизни специалиста</li>
                <li>• Технические доклады</li>
              </ul>
              <p className="mt-2 text-muted-foreground">
                Частота: 1-2 видео в месяц
              </p>
            </div>
          </div>
        </div>

        <h2
          id="content"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Контент-стратегия: что публиковать
        </h2>

        <div className="my-6 rounded-lg border border-border p-6 bg-primary/5">
          <h3 className="font-semibold text-foreground mb-3">
            Правило 70-20-10:
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium mb-1">70% — Ценность и культура</p>
              <p className="text-muted-foreground">
                Истории сотрудников, жизнь офиса, корпоративная культура,
                достижения команды
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">20% — Экспертиза</p>
              <p className="text-muted-foreground">
                Технические статьи, кейсы, инсайты из индустрии, обучающий
                контент
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">10% — Вакансии</p>
              <p className="text-muted-foreground">
                Прямые объявления о найме, приглашения на интервью
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 my-6">
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-2">
              Типы контента, которые работают:
            </h3>
            <ul className="text-sm space-y-2 ml-4">
              <li>
                <strong>Истории сотрудников</strong> — "Как я пришёл в компанию
                и вырос до тимлида"
              </li>
              <li>
                <strong>День из жизни</strong> — фото/видео рабочего дня
                специалиста
              </li>
              <li>
                <strong>Офисная жизнь</strong> — корпоративы, митапы, обеды,
                игровые зоны
              </li>
              <li>
                <strong>Достижения</strong> — запуск продукта, награды, рост
                команды
              </li>
              <li>
                <strong>Обучение</strong> — курсы, конференции, менторство
              </li>
              <li>
                <strong>Технологии</strong> — стек, инструменты, архитектура
              </li>
              <li>
                <strong>Ценности</strong> — как компания живёт своими принципами
              </li>
            </ul>
          </div>
        </div>

        <DocsCallout type="tip" title="Золотое правило">
          Показывайте реальность, а не идеальную картинку. Кандидаты ценят
          честность больше, чем глянец.
        </DocsCallout>

        <h2
          id="implementation"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          План внедрения за 90 дней
        </h2>

        <div className="space-y-6 my-6">
          <div className="border-l-4 border-green-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Месяц 1: Подготовка фундамента
            </h3>
            <ul className="text-sm space-y-2 ml-4">
              <li>
                <strong>Неделя 1-2:</strong> Аудит текущего присутствия в
                соцсетях, анализ конкурентов
              </li>
              <li>
                <strong>Неделя 3:</strong> Разработка контент-стратегии и tone
                of voice
              </li>
              <li>
                <strong>Неделя 4:</strong> Создание контент-плана на 3 месяца,
                подготовка первых 10 постов
              </li>
            </ul>
          </div>

          <div className="border-l-4 border-green-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Месяц 2: Запуск и тестирование
            </h3>
            <ul className="text-sm space-y-2 ml-4">
              <li>
                <strong>Неделя 5-6:</strong> Запуск публикаций на выбранных
                платформах
              </li>
              <li>
                <strong>Неделя 7:</strong> Сбор обратной связи от команды и
                аудитории
              </li>
              <li>
                <strong>Неделя 8:</strong> Корректировка стратегии на основе
                первых результатов
              </li>
            </ul>
          </div>

          <div className="border-l-4 border-green-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Месяц 3: Масштабирование
            </h3>
            <ul className="text-sm space-y-2 ml-4">
              <li>
                <strong>Неделя 9-10:</strong> Увеличение частоты публикаций,
                добавление новых форматов
              </li>
              <li>
                <strong>Неделя 11:</strong> Запуск программы амбассадоров среди
                сотрудников
              </li>
              <li>
                <strong>Неделя 12:</strong> Анализ результатов, планирование на
                следующий квартал
              </li>
            </ul>
          </div>
        </div>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3">
            Чек-лист для каждого поста:
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Визуал высокого качества (фото/видео)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>
                Текст написан простым языком, без корпоративного жаргона
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Есть призыв к действию (лайк, комментарий, репост)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Показывает реальных людей и реальные ситуации</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Соответствует tone of voice компании</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Релевантные хештеги для поиска</span>
            </li>
          </ul>
        </div>

        <h2
          id="metrics"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Метрики эффективности
        </h2>

        <div className="space-y-4 my-6">
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-2">
              Метрики вовлечённости:
            </h3>
            <ul className="text-sm space-y-2 ml-4">
              <li>
                <strong>Reach</strong> — количество уникальных просмотров
              </li>
              <li>
                <strong>Engagement rate</strong> — процент взаимодействий
                (лайки, комментарии, репосты)
              </li>
              <li>
                <strong>Follower growth</strong> — рост подписчиков
              </li>
              <li>
                <strong>Share rate</strong> — процент репостов
              </li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Цель: Engagement rate 3-5% для B2B, 5-10% для B2C
            </p>
          </div>

          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-2">
              Метрики найма:
            </h3>
            <ul className="text-sm space-y-2 ml-4">
              <li>
                <strong>Sourcing rate</strong> — процент кандидатов из соцсетей
              </li>
              <li>
                <strong>Application rate</strong> — конверсия подписчиков в
                отклики
              </li>
              <li>
                <strong>Quality of hire</strong> — качество кандидатов из
                соцсетей
              </li>
              <li>
                <strong>Cost per hire</strong> — стоимость найма через соцсети
              </li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Цель: 20-30% кандидатов должны приходить из соцсетей
            </p>
          </div>

          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-2">
              Метрики бренда:
            </h3>
            <ul className="text-sm space-y-2 ml-4">
              <li>
                <strong>Brand awareness</strong> — узнаваемость компании как
                работодателя
              </li>
              <li>
                <strong>Sentiment</strong> — тональность упоминаний (позитив /
                негатив)
              </li>
              <li>
                <strong>Employer NPS</strong> — готовность рекомендовать
                компанию
              </li>
              <li>
                <strong>Glassdoor rating</strong> — рейтинг на площадках отзывов
              </li>
            </ul>
          </div>
        </div>

        <div className="my-6 rounded-lg border border-green-500/30 bg-green-500/5 p-6">
          <h3 className="font-semibold text-foreground mb-3">
            Примеры успешных employer brands:
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium mb-1">Яндекс</p>
              <p className="text-muted-foreground">
                Активный Telegram-канал с техническими кейсами, митапами и
                историями сотрудников. 50K+ подписчиков.
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">VK</p>
              <p className="text-muted-foreground">
                YouTube-канал с видео о жизни офиса, интервью с разработчиками,
                технические доклады. 100K+ подписчиков.
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">Тинькофф</p>
              <p className="text-muted-foreground">
                Активное присутствие во всех соцсетях, открытая культура,
                регулярные митапы и хакатоны.
              </p>
            </div>
          </div>
        </div>

        <div className="my-6 rounded-lg border border-border p-6">
          <h3 className="font-semibold text-foreground mb-3">Частые ошибки:</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">✗</span>
              <span className="text-sm">
                <strong>Только вакансии</strong> — соцсети превращаются в доску
                объявлений
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">✗</span>
              <span className="text-sm">
                <strong>Постановочные фото</strong> — фальшивые улыбки и
                глянцевые картинки
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">✗</span>
              <span className="text-sm">
                <strong>Нерегулярность</strong> — публикации раз в месяц или
                длительные паузы
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">✗</span>
              <span className="text-sm">
                <strong>Игнорирование комментариев</strong> — отсутствие
                взаимодействия с аудиторией
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">✗</span>
              <span className="text-sm">
                <strong>Копирование конкурентов</strong> — отсутствие
                уникальности и аутентичности
              </span>
            </li>
          </ul>
        </div>

        <DocsCallout type="info" title="Совет">
          Начните с одной платформы и делайте это хорошо. Лучше качественный
          контент на одном канале, чем посредственный на пяти.
        </DocsCallout>

        <div className="my-6 rounded-lg border border-border p-6 bg-primary/5">
          <h3 className="font-semibold text-foreground mb-3">
            Ресурсы для старта:
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <strong>Команда:</strong> 1 контент-менеджер (0.5 FTE) + помощь
              сотрудников
            </li>
            <li>
              <strong>Бюджет:</strong> 50,000 - 100,000 ₽/месяц на фото/видео и
              продвижение
            </li>
            <li>
              <strong>Инструменты:</strong> Canva для дизайна, планировщик
              постов, аналитика
            </li>
            <li>
              <strong>Время:</strong> 10-15 часов в неделю на создание и
              публикацию контента
            </li>
          </ul>
        </div>

        <DocsCallout type="warning" title="Важно">
          Employer branding — это марафон, а не спринт. Первые результаты будут
          через 3-6 месяцев регулярной работы.
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
            href="/help/knowledge-base/articles/passive-candidates"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Пассивные кандидаты
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
