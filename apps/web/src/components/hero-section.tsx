"use client";

import {
  ArrowRight,
  BarChart3,
  Brain,
  FileText,
  MessageCircle,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { env } from "@/env";

export function HeroSection() {
  return (
    <section className="relative bg-background pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0001_1px,transparent_1px),linear-gradient(to_bottom,#0001_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_70%,transparent),linear-gradient(to_right,transparent_20%,black_35%,black_65%,transparent_80%)]" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex">
            <a
              href="#"
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm transition-all hover:border-foreground/20 hover:bg-muted/50"
            >
              <span className="text-muted-foreground">
                Запущено 10M+ интервью с AI
              </span>
              <span className="text-foreground font-medium group-hover:underline flex items-center gap-1">
                Подробнее
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
          </div>

          <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl leading-[1.1] text-balance">
            Превращайте отклики в наймы
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed text-balance">
            QBS — современная платформа для автоматизации найма. AI-скрининг,
            умные интервью и аналитика в одном месте.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="bg-foreground text-background hover:bg-neutral-800 transition-all duration-200 h-12 px-8 text-base font-medium rounded-xl"
              asChild
            >
              <Link href={`${env.NEXT_PUBLIC_APP_URL}/auth/signup`}>
                Начать бесплатно
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base font-medium rounded-xl border-border bg-card text-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200"
              asChild
            >
              <Link href={`#`}>Посмотреть демо</Link>
            </Button>
          </div>
        </div>

        <div className="mt-20 md:mt-28">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { icon: Users, label: "AI Скрининг", color: "text-amber-500" },
    { icon: BarChart3, label: "Аналитика воронки", color: "text-emerald-500" },
    { icon: MessageCircle, label: "Telegram интервью", color: "text-blue-500" },
  ];

  return (
    <div className="relative mx-auto max-w-6xl">
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-2 p-1.5 rounded-full bg-muted/50 border border-border">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === index
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon
                className={`h-4 w-4 ${activeTab === index ? tab.color : ""}`}
              />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground">
              <span className="text-xs font-bold text-background">Q</span>
            </div>
            <span className="text-sm font-medium text-foreground">
              QBS Автонайм
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
          </div>
        </div>

        <div className="grid grid-cols-3 border-b border-border">
          <div className="px-6 py-4 border-r border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              Клики
            </div>
            <div className="text-2xl font-bold text-foreground">7.2K</div>
          </div>
          <div className="px-6 py-4 border-r border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              Отклики
            </div>
            <div className="text-2xl font-bold text-foreground">165</div>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              Наймы
            </div>
            <div className="text-2xl font-bold text-foreground">$12K</div>
          </div>
        </div>

        {/* Main content area */}
        <div className="relative bg-gradient-to-b from-background via-muted/5 to-background p-8 md:p-12">
          <img
            src="/images/gemini-generated-image-aoxe93aoxe93aoxe.png"
            alt="QBS Автонайм - Воронка найма с метриками: просмотры, отклики, наймы"
            className="w-full h-auto rounded-lg"
          />
        </div>

        <div className="grid md:grid-cols-3 border-t border-border">
          <div className="p-6 border-r border-border group cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Скрининг резюме
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Анализ кандидатов от отклика до интервью
            </p>
            <span className="text-xs text-foreground font-medium flex items-center gap-1 group-hover:underline">
              Подробнее
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
          <div className="p-6 border-r border-border group cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Аналитика в реальном времени
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Полная статистика по кликам и откликам
            </p>
            <span className="text-xs text-foreground font-medium flex items-center gap-1 group-hover:underline">
              Подробнее
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
          <div className="p-6 group cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Инсайты о кандидатах
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Понимание пути кандидата и рейтинг
            </p>
            <span className="text-xs text-foreground font-medium flex items-center gap-1 group-hover:underline">
              Подробнее
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
