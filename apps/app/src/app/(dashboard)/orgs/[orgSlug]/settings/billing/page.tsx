import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";
import { Check } from "lucide-react";
import { SiteHeader } from "~/components/layout";

const plans = [
  {
    name: "Бесплатный",
    price: "0",
    period: "навсегда",
    description: "Для начинающих и тестирования",
    features: [
      "До 10 откликов в месяц",
      "Базовые шаблоны сопроводительных писем",
      "1 активная вакансия",
      "Поддержка по email",
    ],
    limitations: ["Без приоритетной поддержки", "Без аналитики"],
    badge: null,
    variant: "outline" as const,
    current: true,
  },
  {
    name: "Профессиональный",
    price: "990",
    period: "мес",
    description: "Для активного поиска работы",
    features: [
      "До 100 откликов в месяц",
      "Все шаблоны и персонализация",
      "До 10 активных вакансий",
      "Аналитика откликов",
      "Приоритетная поддержка",
      "Автоматические отклики",
    ],
    limitations: [],
    badge: "Популярный",
    variant: "default" as const,
    current: false,
  },
  {
    name: "Бизнес",
    price: "2490",
    period: "мес",
    description: "Для профессионалов и рекрутеров",
    features: [
      "Неограниченные отклики",
      "Все функции Профессионального",
      "Неограниченные активные вакансии",
      "Расширенная аналитика и отчёты",
      "API доступ",
      "Персональный менеджер",
      "Кастомные интеграции",
    ],
    limitations: [],
    badge: null,
    variant: "outline" as const,
    current: false,
  },
];

export default async function OrganizationBillingPage() {
  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Тарифы и биллинг</h1>
        <p className="text-muted-foreground text-sm">
          Выберите тариф, который подходит для ваших целей
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={
              plan.variant === "default" ? "border-primary shadow-md" : ""
            }
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle>{plan.name}</CardTitle>
                {plan.badge && (
                  <Badge variant="default" className="ml-2">
                    {plan.badge}
                  </Badge>
                )}
                {plan.current && (
                  <Badge variant="secondary" className="ml-2">
                    Текущий
                  </Badge>
                )}
              </div>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">₽</span>
                <span className="text-muted-foreground text-sm">
                  / {plan.period}
                </span>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
              <ul className="flex flex-col gap-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="text-primary mt-0.5 size-4 shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                variant={plan.variant}
                className="w-full"
                disabled={plan.current}
              >
                {plan.current ? "Текущий тариф" : "Выбрать тариф"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>История платежей</CardTitle>
          <CardDescription>Ваши последние транзакции и счета</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
            У вас пока нет платежей
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
