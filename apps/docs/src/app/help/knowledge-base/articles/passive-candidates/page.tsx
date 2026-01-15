import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";

export default function PassiveCandidatesPage() {
  const tocItems = [
    { id: "who", title: "Кто такие пассивные кандидаты", level: 2 },
    { id: "why", title: "Почему они важны", level: 2 },
    { id: "strategies", title: "Стратегии привлечения", level: 2 },
    { id: "outreach", title: "Как выходить на контакт", level: 2 },
    { id: "mistakes", title: "Частые ошибки", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "База знаний", href: "/help/knowledge-base" },
            { title: "Работа с пассивными кандидатами" },
          ]}
        />

        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
            Лучшие практики
          </span>
          <span className="text-sm text-muted-foreground">9 мин чтения</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Работа с пассивными кандидатами
        </h1>

        <p className="text-lg text-muted-foreground mb-8">
          Стратегии привлечения топ-специалистов, которые не ищут работу активно
        </p>

        <h2
          id="who"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Кто такие пассивные кандидаты
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Пассивные кандидаты — это специалисты, которые не ищут работу активно,
          но могут рассмотреть интересное предложение. По статистике, 70% лучших
          специалистов относятся именно к этой категории.
        </p>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3">
            Характеристики пассивных кандидатов:
          </h3>
          <ul className="space-y-2 text-sm">
            <li>✓ Довольны текущей работой</li>
            <li>✓ Не обновляют резюме на job-сайтах</li>
            <li>✓ Не откликаются на вакансии</li>
            <li>✓ Имеют стабильный карьерный рост</li>
            <li>✓ Часто являются ключевыми специалистами в своих компаниях</li>
          </ul>
        </div>

        <h2
          id="why"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Почему пассивные кандидаты важны
        </h2>

        <div className="space-y-4 my-6">
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-2">
              Высокое качество
            </h3>
            <p className="text-sm text-muted-foreground">
              Пассивные кандидаты обычно более квалифицированы и стабильны, чем
              активно ищущие работу.
            </p>
          </div>

          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-2">
              Меньше конкуренции
            </h3>
            <p className="text-sm text-muted-foreground">
              Они не получают десятки предложений одновременно, как активные
              кандидаты на HH.ru.
            </p>
          </div>

          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-2">
              Долгосрочная перспектива
            </h3>
            <p className="text-sm text-muted-foreground">
              Пассивные кандидаты меняют работу обдуманно и остаются в компании
              дольше.
            </p>
          </div>
        </div>

        <h2
          id="strategies"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          5 стратегий привлечения пассивных кандидатов
        </h2>

        <div className="space-y-6 my-6">
          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              1. Прямой поиск (headhunting)
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Активно ищите специалистов на LinkedIn, GitHub, профессиональных
              форумах и конференциях.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Где искать:</p>
              <ul className="space-y-1 ml-4">
                <li>• LinkedIn — профессиональные профили</li>
                <li>• GitHub — разработчики с активными проектами</li>
                <li>• Хабр Карьера — IT-специалисты</li>
                <li>• Отраслевые конференции и митапы</li>
                <li>• Telegram-каналы профессиональных сообществ</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              2. Employer branding
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Создайте привлекательный бренд работодателя, чтобы кандидаты сами
              хотели у вас работать.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Что делать:</p>
              <ul className="space-y-1 ml-4">
                <li>• Публикуйте кейсы и истории сотрудников</li>
                <li>• Показывайте офис и команду в соцсетях</li>
                <li>• Участвуйте в профессиональных мероприятиях</li>
                <li>• Создавайте полезный контент для индустрии</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              3. Программа рекомендаций
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Ваши сотрудники знают лучших специалистов в индустрии. Мотивируйте
              их приводить коллег.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Как организовать:</p>
              <ul className="space-y-1 ml-4">
                <li>• Бонус за успешный найм: 50,000 - 150,000 ₽</li>
                <li>• Выплата после прохождения испытательного срока</li>
                <li>• Регулярные напоминания о программе</li>
                <li>• Упрощённый процесс подачи рекомендаций</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              4. Talent pool (база талантов)
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Создайте базу интересных кандидатов и поддерживайте с ними связь,
              даже если сейчас нет подходящих вакансий.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Как поддерживать контакт:</p>
              <ul className="space-y-1 ml-4">
                <li>• Ежеквартальная рассылка о компании</li>
                <li>• Приглашения на корпоративные мероприятия</li>
                <li>
                  • Персональные поздравления с профессиональными праздниками
                </li>
                <li>• Информация о новых вакансиях</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              5. Контент-маркетинг
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Создавайте полезный контент, который привлекает внимание
              специалистов в вашей индустрии.
            </p>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <p className="font-medium mb-2">Форматы контента:</p>
              <ul className="space-y-1 ml-4">
                <li>• Технические статьи и туториалы</li>
                <li>• Подкасты с экспертами</li>
                <li>• Вебинары и онлайн-курсы</li>
                <li>• Open source проекты</li>
              </ul>
            </div>
          </div>
        </div>

        <h2
          id="outreach"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Как правильно выходить на контакт
        </h2>

        <div className="my-6 rounded-lg border border-green-500/30 bg-green-500/5 p-6">
          <h3 className="font-semibold text-foreground mb-3">
            Структура идеального сообщения:
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium mb-1">1. Персонализация (2-3 строки)</p>
              <p className="text-muted-foreground ml-4">
                "Увидел ваш доклад на конференции X / ваш проект на GitHub /
                вашу статью о Y"
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">
                2. Причина обращения (1-2 строки)
              </p>
              <p className="text-muted-foreground ml-4">
                "Мы ищем Senior разработчика для работы над проектом Z"
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">
                3. Ценностное предложение (2-3 строки)
              </p>
              <p className="text-muted-foreground ml-4">
                "Интересные технические вызовы / работа с топ-командой / влияние
                на продукт"
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">
                4. Призыв к действию (1 строка)
              </p>
              <p className="text-muted-foreground ml-4">
                "Готовы обсудить детали в 15-минутном звонке?"
              </p>
            </div>
          </div>
        </div>

        <DocsCallout type="tip" title="Важно">
          Не продавайте вакансию в первом сообщении. Цель — начать диалог и
          узнать, что интересно кандидату.
        </DocsCallout>

        <h2
          id="mistakes"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          5 частых ошибок при работе с пассивными кандидатами
        </h2>

        <div className="space-y-4 my-6">
          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              1. Шаблонные сообщения
            </h3>
            <p className="text-sm text-muted-foreground">
              Пассивные кандидаты сразу видят копипасту. Персонализируйте каждое
              сообщение.
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              2. Фокус на компании, а не на кандидате
            </h3>
            <p className="text-sm text-muted-foreground">
              Не рассказывайте, какая вы крутая компания. Расскажите, что
              получит кандидат.
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              3. Давление и спешка
            </h3>
            <p className="text-sm text-muted-foreground">
              Пассивным кандидатам нужно время на размышление. Не торопите их с
              решением.
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              4. Отсутствие follow-up
            </h3>
            <p className="text-sm text-muted-foreground">
              Если кандидат не ответил сразу, это не значит "нет". Напишите
              повторно через 1-2 недели.
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              5. Игнорирование текущей ситуации
            </h3>
            <p className="text-sm text-muted-foreground">
              Узнайте, что кандидату нравится в текущей работе и что могло бы
              его мотивировать на переход.
            </p>
          </div>
        </div>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3">
            Метрики успеха:
          </h3>
          <ul className="space-y-2 text-sm">
            <li>📊 Response rate: 20-30% (хороший показатель)</li>
            <li>💬 Conversion в интервью: 10-15%</li>
            <li>🎯 Conversion в оффер: 30-40%</li>
            <li>⏱️ Время от первого контакта до оффера: 4-8 недель</li>
          </ul>
        </div>

        <DocsCallout type="info" title="Совет">
          Работа с пассивными кандидатами — это марафон, а не спринт.
          Инвестируйте в долгосрочные отношения, и вы получите доступ к лучшим
          специалистам рынка.
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
            href="/help/knowledge-base/articles/objective-candidate-assessment"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Оценка кандидатов
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
