export function TargetAudienceSection() {
  const audiences = [
    {
      icon: "👔",
      title: "HR-менеджеры",
      description: "Автоматизируйте рутинные задачи и сфокусируйтесь на стратегических решениях",
      stats: "Экономия 20+ часов в неделю",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      icon: "🏢",
      title: "Руководители компаний",
      description: "Масштабируйте найм без увеличения HR-команды",
      stats: "Рост на 300% без доп. затрат",
      gradient: "from-purple-500 to-purple-600",
    },
    {
      icon: "🚀",
      title: "Стартапы",
      description: "Быстро находите таланты для роста вашего бизнеса",
      stats: "Первый найм за 48 часов",
      gradient: "from-cyan-500 to-cyan-600",
    },
    {
      icon: "📈",
      title: "Рекрутинговые агентства",
      description: "Увеличивайте количество успешных размещений",
      stats: "До 5x больше кандидатов",
      gradient: "from-violet-500 to-violet-600",
    },
  ]

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
            <span className="text-sm font-medium text-blue-600">Для кого это решение</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance mb-6">
            Создано для тех, кто{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
              ценит своё время
            </span>
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground text-balance">
            Независимо от размера вашей команды или отрасли, QBS Автонайм помогает находить лучших кандидатов быстрее
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {audiences.map((audience, index) => (
            <div
              key={index}
              className="group relative rounded-2xl border border-border bg-card p-8 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
            >
              {/* Gradient hover effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative">
                {/* Icon with gradient background */}
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${audience.gradient} mb-6 text-2xl`}
                >
                  {audience.icon}
                </div>

                <h3 className="text-2xl font-bold mb-3">{audience.title}</h3>

                <p className="text-muted-foreground mb-4 leading-relaxed">{audience.description}</p>

                <div className="flex items-center gap-2 pt-4 border-t border-border">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{audience.stats}</p>
                  </div>
                  <svg
                    className="w-5 h-5 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
