import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Users, Bot, BarChart3, Zap, Shield, Clock } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">Q</span>
            </div>
            <span className="font-semibold">QBS Автонайм</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Документация
            </Link>
            <Link href="/docs/api" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              API
            </Link>
            <Link
              href="https://qbs-autonaim.ru/pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Цены
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="https://app.qbs-autonaim.ru">Войти</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="https://app.qbs-autonaim.ru/signup">Попробовать бесплатно</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl text-balance">
            AI-ассистент для автоматизации найма
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed text-pretty">
            QBS Автонайм помогает рекрутерам автоматизировать скрининг резюме, общаться с кандидатами и отслеживать
            аналитику найма — всё в одном месте.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="https://app.qbs-autonaim.ru/signup">
                Начать бесплатно
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/docs">Читать документацию</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Всё для эффективного найма</h2>
            <p className="mt-4 text-muted-foreground">Полный набор инструментов для автоматизации рекрутинга</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="AI-скрининг резюме"
              description="Автоматический анализ и оценка кандидатов по вашим критериям. Экономьте часы на ручной обработке."
            />
            <FeatureCard
              icon={<Bot className="h-6 w-6" />}
              title="Умный чат-бот"
              description="AI-ассистент отвечает на вопросы кандидатов 24/7 и назначает собеседования по вашему календарю."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Аналитика найма"
              description="Отслеживайте воронку, конверсию и метрики эффективности в реальном времени."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Быстрые интеграции"
              description="Подключите hh.ru, SuperJob, Telegram и другие сервисы за несколько кликов."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Безопасность данных"
              description="Все данные кандидатов защищены и хранятся в соответствии с требованиями 152-ФЗ."
            />
            <FeatureCard
              icon={<Clock className="h-6 w-6" />}
              title="Экономия времени"
              description="Сократите время закрытия вакансии на 40% благодаря автоматизации рутинных задач."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="rounded-2xl bg-primary p-8 md:p-12 text-center">
            <h2 className="text-2xl font-bold text-primary-foreground md:text-3xl">Готовы автоматизировать найм?</h2>
            <p className="mt-4 text-primary-foreground/80">Начните 14-дневный бесплатный период без привязки карты</p>
            <Button size="lg" variant="secondary" className="mt-8" asChild>
              <Link href="https://app.qbs-autonaim.ru/signup">
                Попробовать бесплатно
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                <span className="text-xs font-bold text-primary-foreground">Q</span>
              </div>
              <span className="text-sm text-muted-foreground">© 2025 QBS Автонайм</span>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Документация
              </Link>
              <Link
                href="https://qbs-autonaim.ru/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Политика конфиденциальности
              </Link>
              <Link
                href="https://qbs-autonaim.ru/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Условия использования
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
