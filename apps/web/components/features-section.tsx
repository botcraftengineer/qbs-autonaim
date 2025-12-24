import { Sparkles } from "lucide-react"

export function FeaturesSection() {
  return (
    <section id="features" className="bg-background py-24 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-20">
          <h2 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl leading-tight text-balance">
            Найм — это не просто отклики.
            <br />
            Это результаты.
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed text-balance">
            QBS — современная платформа автоматизации найма, которая объединяет AI-скрининг, умные интервью и аналитику
            в одном месте.
          </p>
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* AI Screening */}
            <div className="group">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400">
                <Sparkles className="h-3.5 w-3.5" />
                AI-скрининг
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Начинается с анализа</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Автоматический анализ резюме с AI. Извлечение опыта, навыков и оценка соответствия вакансии за секунды.
              </p>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    АИ
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">Алексей Иванов</div>
                    <div className="text-xs text-muted-foreground">Python Developer</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Соответствие</span>
                    <span className="font-semibold text-emerald-600">95%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-[95%] bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Analytics */}
            <div className="group">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-600 dark:text-purple-400">
                <Sparkles className="h-3.5 w-3.5" />
                Аналитика
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Данные в реальном времени</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Отслеживайте весь путь кандидата от первого клика до финального найма с полной детализацией.
              </p>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Клики</div>
                    <div className="text-lg font-bold text-foreground">7.2K</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Отклики</div>
                    <div className="text-lg font-bold text-foreground">165</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Наймы</div>
                    <div className="text-lg font-bold text-foreground">12</div>
                  </div>
                </div>
                <div className="h-16 flex items-end gap-1">
                  {[40, 60, 45, 75, 55, 85, 70, 90].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Interview Insights */}
            <div className="group">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-600 dark:text-cyan-400">
                <Sparkles className="h-3.5 w-3.5" />
                AI-интервью
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Умные интервью</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Голосовые интервью в Telegram с автоматической транскрибацией и анализом ответов кандидатов.
              </p>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start gap-2 mb-3">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    QBS
                  </div>
                  <div className="flex-1 bg-muted rounded-lg px-3 py-2">
                    <p className="text-xs text-foreground">Расскажите о вашем опыте с Python?</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-blue-500/10 rounded-lg px-3 py-2">
                  <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                  </div>
                  <div className="flex-1 flex items-center gap-[2px] h-4">
                    {[30, 50, 40, 70, 45, 80, 60].map((h, i) => (
                      <div key={i} className="w-1 bg-blue-500/60 rounded-full" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">0:47</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl mt-20 text-center">
          <blockquote className="text-2xl md:text-3xl font-medium text-foreground leading-relaxed text-balance mb-8">
            "QBS кардинально изменил наш процесс найма. Мы обрабатываем тысячи откликов ежемесячно — с QBS мы легко
            находим лучших кандидатов и экономим 90% времени рекрутеров."
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
            <div className="text-left">
              <div className="font-semibold text-foreground">Иван Петров</div>
              <div className="text-sm text-muted-foreground">HR Director at TechCorp</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
