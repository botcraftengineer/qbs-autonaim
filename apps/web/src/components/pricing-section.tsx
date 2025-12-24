"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { env } from "@/env";

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "Старт",
      price: "Бесплатно",
      priceAnnual: "Бесплатно",
      description: "Для небольших команд",
      features: [
        "1 workspace",
        "3 активные вакансии",
        "100 откликов/месяц",
        "AI-скрининг резюме",
        "Базовая аналитика",
      ],
      cta: "Начать бесплатно",
      ctaLink: `${env.NEXT_PUBLIC_APP_URL}/auth/signup`,
      popular: false,
    },
    {
      name: "Бизнес",
      price: "9 900 ₽",
      priceAnnual: "7 900 ₽",
      description: "Для активного найма",
      features: [
        "3 workspace",
        "Неограниченные вакансии",
        "1000 откликов/месяц",
        "AI-интервью в Telegram",
        "Расширенная аналитика",
        "Приоритетная поддержка",
      ],
      cta: "Попробовать 14 дней",
      ctaLink: `${env.NEXT_PUBLIC_APP_URL}/auth/signup?plan=business`,
      popular: true,
    },
    {
      name: "Корпоративный",
      price: "По запросу",
      priceAnnual: "По запросу",
      description: "Для крупных компаний",
      features: [
        "Неограниченные workspace",
        "Неограниченные отклики",
        "Кастомные AI-модели",
        "Выделенная инфраструктура",
        "SLA 99.9%",
        "Персональный менеджер",
      ],
      cta: "Связаться с нами",
      ctaLink: `${env.NEXT_PUBLIC_APP_URL}/contact`,
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="bg-muted/30 py-24 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
            Прозрачные цены для каждой команды
          </h2>
          <p className="mb-12 text-xl text-muted-foreground">
            Начните бесплатно. Масштабируйтесь по мере роста.
          </p>

          <div className="mb-16 inline-flex items-center gap-3 rounded-full border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                !isAnnual
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Помесячно
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                isAnnual
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Ежегодно
              <Badge
                variant="secondary"
                className="ml-2 bg-emerald-500/10 text-emerald-600 border-0"
              >
                -20%
              </Badge>
            </button>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative border transition-all ${
                plan.popular
                  ? "border-foreground shadow-xl scale-105"
                  : "border-border hover:border-foreground/20 hover:shadow-lg"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-foreground text-background border-0 px-4 py-1">
                    Популярный
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <CardDescription className="text-base">
                  {plan.description}
                </CardDescription>
                <div className="mt-6">
                  <span className="text-5xl font-bold text-foreground">
                    {isAnnual ? plan.priceAnnual : plan.price}
                  </span>
                  {plan.price !== "Бесплатно" &&
                    plan.price !== "По запросу" && (
                      <span className="text-muted-foreground ml-1">/мес</span>
                    )}
                </div>
              </CardHeader>
              <CardContent className="pb-8">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                      <Check className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  className={`w-full h-11 ${
                    plan.popular
                      ? "bg-foreground text-background hover:bg-neutral-800"
                      : "hover:bg-muted hover:text-foreground"
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link href={plan.ctaLink}>{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
