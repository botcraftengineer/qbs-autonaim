import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";

export default function MultichannelRecruitmentSetupPage() {
  const tocItems = [
    { id: "why", title: "Зачем нужно", level: 2 },
    { id: "channels", title: "Каналы привлечения", level: 2 },
    { id: "setup", title: "Настройка", level: 2 },
    { id: "tips", title: "Советы", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "База знаний", href: "/help/knowledge-base" },
            { title: "Настройка мультиканального найма" },
          ]}
        />

        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
            Пошаговые гайды
          </span>
          <span className="text-sm text-muted-foreground">13 мин чтения</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Настройка мультиканального найма
        </h1>

        <p className="text-lg text-muted-foreground mb-8">
          Пошаговое руководство по интеграции HH.ru, Telegram и сайта компании
          для максимального охвата кандидатов
        </p>

        <h2
          id="why"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Зачем использовать несколько каналов
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Разные кандидаты ищут работу в разных местах. Если вы публикуете
          вакансии только на HH.ru, вы теряете 40-50% потенциальных кандидатов,
          которые предпочитают Telegram, LinkedIn или карьерные сайты компаний.
        </p>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3">
            Статистика по каналам:
          </h3>
          <ul className="space-y-2 text-sm">
            <li>📊 HH.ru — 35% успешных найма</li>
            <li>💬 Telegram — 20% (растёт быстрее всего)</li>
            <li>🌐 Сайт компании — 15%</li>
            <li>🤝 Рекомендации — 25%</li>
            <li>📱 Другие каналы — 5%</li>
          </ul>
        </div>

        <h2
          id="channels"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Ключевые каналы привлечения
        </h2>

        <div className="space-y-6 my-6">
          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              1. HH.ru — основной канал
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Самая большая база кандидатов в России. Обязателен для любой
              компании.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Преимущества:</p>
              <ul className="space-y-1 ml-4">
                <li>• Огромная аудитория</li>
                <li>• Удобные фильтры поиска</li>
                <li>• Интеграция с системами найма</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              2. Telegram — растущий канал
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Особенно эффективен для IT-специалистов и молодых кандидатов.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Как использовать:</p>
              <ul className="space-y-1 ml-4">
                <li>• Создайте бот для приёма откликов</li>
                <li>• Публикуйте вакансии в тематических каналах</li>
                <li>• Используйте автоматические ответы</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              3. Сайт компании — ваша витрина
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Привлекает мотивированных кандидатов, которые целенаправленно ищут
              работу именно у вас.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Что важно:</p>
              <ul className="space-y-1 ml-4">
                <li>• Удобная форма отклика</li>
                <li>• Информация о компании и культуре</li>
                <li>• Отзывы сотрудников</li>
              </ul>
            </div>
          </div>
        </div>

        <h2
          id="setup"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Пошаговая настройка
        </h2>

        <div className="space-y-6 my-6">
          <div className="border-l-4 border-green-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Шаг 1: Подключите HH.ru
            </h3>
            <ul className="text-sm space-y-2 ml-4">
              <li>1. Зарегистрируйте аккаунт работодателя на HH.ru</li>
              <li>2. Настройте интеграцию с вашей системой найма</li>
              <li>3. Опубликуйте первую вакансию</li>
              <li>4. Настройте автоматическую синхронизацию откликов</li>
            </ul>
          </div>

          <div className="border-l-4 border-green-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Шаг 2: Создайте Telegram-бот
            </h3>
            <ul className="text-sm space-y-2 ml-4">
              <li>1. Создайте бот через BotFather</li>
              <li>2. Настройте приём резюме и контактов</li>
              <li>3. Добавьте автоматические ответы</li>
              <li>4. Опубликуйте ссылку на бот в тематических каналах</li>
            </ul>
          </div>

          <div className="border-l-4 border-green-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Шаг 3: Оптимизируйте карьерную страницу
            </h3>
            <ul className="text-sm space-y-2 ml-4">
              <li>1. Добавьте раздел "Карьера" на сайт</li>
              <li>2. Разместите актуальные вакансии</li>
              <li>3. Добавьте форму быстрого отклика</li>
              <li>4. Настройте автоматическую отправку откликов в систему</li>
            </ul>
          </div>

          <div className="border-l-4 border-green-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Шаг 4: Объедините всё в одной системе
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Все отклики из разных каналов должны попадать в одно место для
              удобной работы.
            </p>
          </div>
        </div>

        <DocsCallout type="tip" title="Совет">
          Используйте единую систему для управления всеми каналами. Это избавит
          от необходимости переключаться между разными платформами.
        </DocsCallout>

        <h2
          id="tips"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Практические советы
        </h2>

        <ul className="space-y-3 mb-6">
          <li>
            <strong className="font-semibold text-foreground">
              Адаптируйте контент
            </strong>{" "}
            — текст вакансии для HH.ru и Telegram должен отличаться
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Отслеживайте источники
            </strong>{" "}
            — помечайте, откуда пришёл каждый кандидат
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Тестируйте каналы
            </strong>{" "}
            — не все каналы одинаково эффективны для разных позиций
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Автоматизируйте рутину
            </strong>{" "}
            — используйте автоответы и шаблоны сообщений
          </li>
        </ul>

        <div className="my-6 rounded-lg border border-green-500/30 bg-green-500/5 p-6">
          <h3 className="font-semibold text-foreground mb-3">
            Результат правильной настройки:
          </h3>
          <ul className="space-y-2 text-sm">
            <li>✓ +150% откликов на вакансии</li>
            <li>✓ Доступ к кандидатам из разных сегментов</li>
            <li>✓ Снижение зависимости от одного канала</li>
            <li>✓ Улучшение бренда работодателя</li>
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
            href="/integrations"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Интеграции
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
