import type { Metadata } from "next";
import { generatePageSEO } from "@/lib/seo";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsFeedback } from "@/components/docs/docs-feedback";
import { DocsMobileToc } from "@/components/docs/docs-mobile-toc";
import { DocsToc } from "@/components/docs/docs-toc";
import { Check, X } from "lucide-react";

export const metadata: Metadata = generatePageSEO("pricing", {
  title: "Цены и тарифы QBS Автонайм — AI для рекрутинга",
  description: "Тарифы QBS Автонайм: от бесплатного плана до корпоративных решений. Сравнение функций, цены в рублях, скидки при годовой оплате.",
  url: "/pricing",
  keywords: [
    "цены QBS Автонайм",
    "тарифы рекрутинг AI",
    "стоимость HR софт",
    "цены автоматизация найма",
    "тарифы AI скрининг",
    "цены интеграция HH.ru",
  ],
});

export default function PricingPage() {
  const tocItems = [
    { id: "plans", title: "Тарифные планы", level: 2 },
    { id: "features", title: "Сравнение функций", level: 2 },
    { id: "billing", title: "Оплата и биллинг", level: 2 },
    { id: "faq", title: "Часто задаваемые вопросы", level: 2 },
  ];

  const plans = [
    {
      name: "Бесплатный",
      price: "0₽",
      period: "навсегда",
      description: "Идеально для тестирования основных функций",
      features: [
        "До 50 кандидатов в месяц",
        "AI-скрининг резюме",
        "Интеграция с HH.ru",
        "Базовая аналитика",
        "Поддержка через email",
      ],
      limitations: [
        "Ограничение по кандидатам",
        "Базовые шаблоны интервью",
        "Один пользователь",
      ],
      popular: false,
      buttonText: "Начать бесплатно",
      buttonVariant: "outline" as const,
    },
    {
      name: "Стартап",
      price: "2 990₽",
      period: "в месяц",
      description: "Для растущих компаний с активным наймом",
      features: [
        "До 500 кандидатов в месяц",
        "Все функции AI-скрининга",
        "Telegram-боты для интервью",
        "Расширенная аналитика",
        "API доступ",
        "Приоритетная поддержка",
        "До 5 пользователей",
      ],
      limitations: [],
      popular: true,
      buttonText: "Попробовать 14 дней",
      buttonVariant: "default" as const,
    },
    {
      name: "Профессиональный",
      price: "7 990₽",
      period: "в месяц",
      description: "Для HR-отделов с большим объёмом вакансий",
      features: [
        "До 2 000 кандидатов в месяц",
        "Все интеграции (HH.ru, SuperJob, etc.)",
        "Голосовые резюме",
        "Расширенные отчёты",
        "White-label решение",
        "API с повышенными лимитами",
        "До 20 пользователей",
        "Персональный менеджер",
      ],
      limitations: [],
      popular: false,
      buttonText: "Связаться с нами",
      buttonVariant: "outline" as const,
    },
    {
      name: "Корпоративный",
      price: "от 19 990₽",
      period: "в месяц",
      description: "Для крупных компаний с индивидуальными требованиями",
      features: [
        "Безлимитные кандидаты",
        "Все функции платформы",
        "Интеграция с ERP/HRM системами",
        "Собственный AI-модель",
        "SLA 99.9% доступность",
        "Выделенный сервер",
        "Безлимитные пользователи",
        "Круглосуточная поддержка",
        "Индивидуальная разработка",
      ],
      limitations: [],
      popular: false,
      buttonText: "Запросить предложение",
      buttonVariant: "outline" as const,
    },
  ];

  const features = [
    {
      category: "AI-функции",
      items: [
        { name: "AI-скрининг резюме", free: true, startup: true, pro: true, enterprise: true },
        { name: "Автоматические интервью", free: false, startup: true, pro: true, enterprise: true },
        { name: "Голосовые резюме", free: false, startup: false, pro: true, enterprise: true },
        { name: "Кастомные AI-модели", free: false, startup: false, pro: false, enterprise: true },
      ],
    },
    {
      category: "Интеграции",
      items: [
        { name: "HH.ru", free: true, startup: true, pro: true, enterprise: true },
        { name: "SuperJob", free: false, startup: true, pro: true, enterprise: true },
        { name: "Telegram", free: false, startup: true, pro: true, enterprise: true },
        { name: "API для разработчиков", free: false, startup: true, pro: true, enterprise: true },
        { name: "1C / ERP системы", free: false, startup: false, pro: false, enterprise: true },
      ],
    },
    {
      category: "Аналитика",
      items: [
        { name: "Базовые отчёты", free: true, startup: true, pro: true, enterprise: true },
        { name: "Расширенная аналитика", free: false, startup: true, pro: true, enterprise: true },
        { name: "Кастомные дашборды", free: false, startup: false, pro: true, enterprise: true },
        { name: "Экспорт данных", free: false, startup: true, pro: true, enterprise: true },
      ],
    },
    {
      category: "Поддержка",
      items: [
        { name: "Email поддержка", free: true, startup: true, pro: true, enterprise: true },
        { name: "Чат поддержка", free: false, startup: true, pro: true, enterprise: true },
        { name: "Приоритетная поддержка", free: false, startup: true, pro: true, enterprise: true },
        { name: "Персональный менеджер", free: false, startup: false, pro: true, enterprise: true },
        { name: "Круглосуточная поддержка", free: false, startup: false, pro: false, enterprise: true },
      ],
    },
  ];

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "Цены и тарифы" },
          ]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">
            Цены и тарифы
          </span>
        </div>

        <h1>Цены и тарифы</h1>

        <p className="text-lg">
          Гибкие тарифы для компаний любого размера. Начните с бесплатного плана
          и масштабируйтесь по мере роста. Все цены указаны в рублях с учётом НДС.
        </p>

        <DocsMobileToc items={tocItems} />

        <DocsCallout type="info" title="Бесплатный период">
          Все платные тарифы включают 14-дневный бесплатный период тестирования со всеми функциями.
        </DocsCallout>

        <h2 id="plans">Тарифные планы</h2>

        <div className="grid gap-6 my-8 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-lg border p-6 ${
                plan.popular
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Популярный
                  </span>
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
                {plan.limitations.map((limitation, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <X className="h-4 w-4 flex-shrink-0" />
                    {limitation}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                  plan.buttonVariant === "default"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border hover:bg-accent"
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        <DocsCallout type="tip" title="Скидки при годовой оплате">
          Экономьте до 20% при оплате за год вперёд. Для корпоративных клиентов предусмотрены индивидуальные условия.
        </DocsCallout>

        <h2 id="features">Сравнение функций</h2>

        <div className="overflow-x-auto my-6">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-border p-3 text-left font-semibold">
                  Функция
                </th>
                <th className="border border-border p-3 text-center font-semibold">
                  Бесплатный
                </th>
                <th className="border border-border p-3 text-center font-semibold">
                  Стартап
                </th>
                <th className="border border-border p-3 text-center font-semibold">
                  Профессиональный
                </th>
                <th className="border border-border p-3 text-center font-semibold">
                  Корпоративный
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((category, categoryIndex) => (
                <>
                  <tr key={categoryIndex} className="bg-muted/20">
                    <td
                      colSpan={5}
                      className="border border-border p-3 font-semibold text-primary"
                    >
                      {category.category}
                    </td>
                  </tr>
                  {category.items.map((item, itemIndex) => (
                    <tr key={itemIndex} className="hover:bg-muted/30">
                      <td className="border border-border p-3">{item.name}</td>
                      <td className="border border-border p-3 text-center">
                        {item.free ? (
                          <Check className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="border border-border p-3 text-center">
                        {item.startup ? (
                          <Check className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="border border-border p-3 text-center">
                        {item.pro ? (
                          <Check className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="border border-border p-3 text-center">
                        {item.enterprise ? (
                          <Check className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        <h2 id="billing">Оплата и биллинг</h2>

        <div className="space-y-4 my-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Способы оплаты</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Банковские карты (МИР, Visa, Mastercard)</li>
              <li>Банковский перевод для юридических лиц</li>
              <li>Электронные кошельки (по запросу)</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Период оплаты</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Ежемесячная оплата</li>
              <li>Поквартальная оплата (скидка 5%)</li>
              <li>Годовая оплата (скидка 20%)</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Документы</h3>
            <p className="text-muted-foreground">
              Для юридических лиц предоставляем полный пакет документов:
              договор, счёт, акт выполненных работ, счёт-фактуру.
            </p>
          </div>
        </div>

        <h2 id="faq">Часто задаваемые вопросы</h2>

        <div className="space-y-6 my-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Можно ли изменить тариф в процессе использования?
            </h3>
            <p className="text-muted-foreground">
              Да, тариф можно изменить в любой момент в личном кабинете.
              При повышении тарифа доплата рассчитывается пропорционально.
              При понижении изменения вступают в силу со следующего месяца.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">
              Что происходит с данными при смене тарифа?
            </h3>
            <p className="text-muted-foreground">
              Все данные сохраняются. При понижении тарифа могут применяться
              ограничения по количеству кандидатов или функциям, но данные остаются доступными.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">
              Есть ли ограничения на количество вакансий?
            </h3>
            <p className="text-muted-foreground">
              Ограничения по количеству кандидатов, а не вакансий.
              В бесплатном тарифе — до 50 кандидатов в месяц,
              в Стартап — до 500, в Профессиональном — до 2000.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">
              Как рассчитывается количество кандидатов?
            </h3>
            <p className="text-muted-foreground">
              Считаются уникальные кандидаты, по которым проводился AI-скрининг
              или автоматическое интервью. Повторные взаимодействия с одним кандидатом не учитываются.
            </p>
          </div>
        </div>

        <DocsCallout type="info" title="Нужна консультация?">
          <p>
            Не уверены какой тариф выбрать? Свяжитесь с нами для персональной консультации.
            Мы подберём оптимальное решение под ваши задачи и бюджет.
          </p>
          <div className="flex gap-4 mt-4">
            <a
              href="https://t.me/qbs_support"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              💬 Написать в Telegram
            </a>
            <a
              href="mailto:sales@qbs-autonaim.ru"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
            >
              📧 Написать email
            </a>
          </div>
        </DocsCallout>

        <div className="my-8">
          <DocsFeedback />
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <a
            href="/"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Введение
          </a>
          <a
            href="/quickstart"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Быстрый старт
            <span className="group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </a>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  );
}