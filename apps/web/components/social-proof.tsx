import { Users, Target, Clock } from "lucide-react"

export function SocialProof() {
  const stats = [
    {
      icon: Users,
      value: "1000+",
      label: "обработанных откликов",
    },
    {
      icon: Target,
      value: "95%",
      label: "точность AI-скрининга",
    },
    {
      icon: Clock,
      value: "5 мин",
      label: "на настройку",
    },
  ]

  const companies = ["Яндекс", "Сбер", "VK", "Ozon", "Wildberries", "Авито", "Тинькoff", "Kaspersky"]

  return (
    <section className="bg-muted/20 py-20 md:py-24">
      <div className="container mx-auto px-4">
        <p className="text-center text-xs uppercase tracking-wider text-muted-foreground/60 mb-16 font-medium">
          Нам доверяют ведущие российские компании
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 mb-20 md:gap-x-16">
          {companies.map((company, index) => (
            <div
              key={company}
              className="text-lg font-semibold text-muted-foreground/40 hover:text-foreground/60 transition-colors duration-300 cursor-default"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {company}
            </div>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="relative group">
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card/50 border border-border/40 backdrop-blur-sm hover:border-border transition-all duration-300">
                <div className="mb-4 p-3 rounded-xl bg-primary/5 group-hover:bg-primary/10 transition-colors duration-300">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-4xl font-bold text-foreground mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
