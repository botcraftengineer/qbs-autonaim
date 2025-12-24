"use client";

import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle,
  Clock,
  Link2,
  type LucideIcon,
  MessageCircle,
  Mic,
  Play,
  Send,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { icon: Link2, label: "Интеграция HH", color: "text-red-500" },
    { icon: Send, label: "Telegram MTProto", color: "text-[#0088cc]" },
    { icon: Brain, label: "AI Анализ", color: "text-violet-500" },
    { icon: MessageCircle, label: "Интервью", color: "text-blue-500" },
    { icon: CheckCircle, label: "Результат", color: "text-emerald-500" },
  ];

  return (
    <section
      id="how-it-works"
      className="py-24 md:py-32 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.05),transparent)]" />
      <div className="absolute top-40 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
      <div className="absolute bottom-40 right-1/4 w-96 h-96 bg-violet-500/3 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">QBS Автонайм</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6 text-balance">
            От отклика до найма
            <br />
            <span className="text-muted-foreground">за 5 простых шагов</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Автоматизируйте рутину найма и сфокусируйтесь на лучших кандидатах.
            QBS делает всю работу за вас.
          </p>
        </div>

        {/* Tabs navigation like dub.co */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-1 p-1.5 rounded-full bg-muted/50 border border-border">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === index
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon
                  className={`h-4 w-4 ${activeTab === index ? tab.color : ""}`}
                />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div className="max-w-6xl mx-auto">
          {activeTab === 0 && <HHIntegrationDemo />}
          {activeTab === 1 && <TelegramMTProtoDemo />}
          {activeTab === 2 && <AIAnalysisDemo />}
          {activeTab === 3 && <TelegramInterviewDemo />}
          {activeTab === 4 && <ResultsDemo />}
        </div>

        {/* Feature cards at the bottom like dub.co */}
        <div className="grid md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto">
          <FeatureCard
            icon={Clock}
            title="Экономия времени"
            description="Сократите время на первичный отбор с 5 часов до 15 минут в день."
            link="#"
          />
          <FeatureCard
            icon={Shield}
            title="Точность оценки"
            description="AI анализирует резюме по 50+ параметрам для точного соответствия."
            link="#"
          />
          <FeatureCard
            icon={Zap}
            title="Мгновенный старт"
            description="Подключите HH.ru за 2 минуты и начните получать кандидатов."
            link="#"
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  link,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  link: string;
}) {
  return (
    <div className="group p-6 rounded-2xl border border-border bg-card/50 hover:bg-card hover:shadow-lg transition-all">
      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <a
        href={link}
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
      >
        Подробнее
        <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

function TelegramMTProtoDemo() {
  return (
    <div className="relative">
      {/* Decorative gradient blurs */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-[#0088cc]/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />

      <div className="relative rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-4 py-1 rounded-lg bg-background text-xs text-muted-foreground">
              qbs.ru/integrations/telegram
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Telegram MTProto visual */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#0088cc] to-[#0099dd] flex items-center justify-center shadow-lg">
                  <Send className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-[#0088cc] via-[#00b4d8] to-primary rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  QBS
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Telegram MTProto
                  </span>
                  <span className="text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2 py-1 rounded-full">
                    Прямое подключение
                  </span>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-[#0088cc]/10 to-cyan-500/10 p-4 border border-[#0088cc]/20">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#0088cc]/20 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-[#0088cc]" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-sm mb-1">
                        Что такое MTProto?
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Это официальный протокол Telegram для прямой связи с
                        серверами. Работает как полноценный клиент — без ботов и
                        ограничений.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Чаты с кандидатами", value: "234", icon: "💬" },
                    {
                      label: "Отправлено сообщений",
                      value: "1.2K",
                      icon: "📨",
                    },
                    { label: "Средний ответ", value: "< 5 мин", icon: "⚡" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-foreground">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Benefits and explanation */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-gradient-to-br from-[#0088cc]/5 to-cyan-500/5 p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#0088cc]" />
                  Преимущества для вашего найма
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      title: "Мгновенная связь с кандидатами",
                      desc: "Сообщения доставляются напрямую в личный Telegram кандидата — там, где он точно их увидит",
                    },
                    {
                      title: "Без ограничений ботов",
                      desc: "Нет лимитов на сообщения, нет задержек. Работает как ваш личный рекрутер 24/7",
                    },
                    {
                      title: "Полная автоматизация",
                      desc: "AI сам ведёт диалог, назначает интервью и отвечает на вопросы кандидатов",
                    },
                    {
                      title: "Безопасное соединение",
                      desc: "Шифрование военного уровня. Ваши данные и переписка под надёжной защитой",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5">
                        <CheckCircle className="h-3 w-3 text-emerald-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground">
                          {item.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    98%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Доставляемость
                  </div>
                  <div className="text-xs text-emerald-500 mt-2">
                    vs 45% email
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    3x
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Скорость ответа
                  </div>
                  <div className="text-xs text-emerald-500 mt-2">
                    быстрее звонков
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HHIntegrationDemo() {
  return (
    <div className="relative">
      {/* Decorative gradient blurs */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-red-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />

      <div className="relative rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-4 py-1 rounded-lg bg-background text-xs text-muted-foreground">
              qbs.ru/integrations
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Integration visual */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  hh
                </div>
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-red-500 via-violet-500 to-primary rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  QBS
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Синхронизация
                  </span>
                  <span className="text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2 py-1 rounded-full">
                    Активно
                  </span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Вакансии", value: "12", icon: "📋" },
                    { label: "Отклики сегодня", value: "47", icon: "📩" },
                    { label: "В обработке", value: "156", icon: "⚙️" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-foreground">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Stats cards */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  value="15 сек"
                  label="Синхронизация"
                  trend="+автоматически"
                />
                <StatCard value="99.9%" label="Uptime" trend="SLA гарантия" />
              </div>
              <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-violet-500/5 p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">
                      Готово к работе
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Ваш аккаунт HH.ru успешно подключен. Все отклики
                      автоматически импортируются.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  value,
  label,
  trend,
}: {
  value: string;
  label: string;
  trend: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-xs text-emerald-500 mt-2">{trend}</div>
    </div>
  );
}

function AIAnalysisDemo() {
  return (
    <div className="relative">
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />

      <div className="relative rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-4 py-1 rounded-lg bg-background text-xs text-muted-foreground">
              qbs.ru/candidates/analysis
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12">
          <div className="grid md:grid-cols-5 gap-6">
            {/* Candidate card */}
            <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-semibold text-lg">
                  АИ
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">
                    Алексей Иванов
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Python Developer
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      8 лет опыта
                    </span>
                    <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">
                      Релевантен
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Соответствие", value: 95, color: "bg-emerald-500" },
                  { label: "Hard skills", value: 92, color: "bg-primary" },
                  { label: "Soft skills", value: 88, color: "bg-violet-500" },
                ].map((skill, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">
                        {skill.label}
                      </span>
                      <span className="font-semibold text-foreground">
                        {skill.value}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full ${skill.color} rounded-full transition-all`}
                        style={{ width: `${skill.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Analysis panel */}
            <div className="md:col-span-3 space-y-4">
              <div className="rounded-2xl border border-border bg-gradient-to-br from-violet-500/5 to-primary/5 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-violet-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      AI Рекомендация
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      GPT-4 анализ за 3.2 сек
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Кандидат имеет релевантный опыт в разработке высоконагруженных
                  систем на Python. Стек технологий полностью соответствует
                  требованиям вакансии.
                  <span className="text-foreground font-medium">
                    {" "}
                    Рекомендуется пригласить на собеседование.
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    Ключевые навыки
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      "Python",
                      "Django",
                      "FastAPI",
                      "PostgreSQL",
                      "Docker",
                    ].map((skill) => (
                      <span
                        key={skill}
                        className="text-xs bg-muted px-2 py-1 rounded-md text-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    Зарплатные ожидания
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    250-300K ₽
                  </div>
                  <div className="text-xs text-emerald-500 mt-1">
                    В рамках бюджета
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TelegramInterviewDemo() {
  return (
    <div className="relative">
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />

      <div className="relative rounded-3xl border border-border shadow-2xl overflow-hidden">
        {/* Desktop Telegram app simulation */}
        <div className="flex h-[500px] md:h-[550px]">
          {/* Sidebar */}
          <div className="hidden md:flex flex-col w-80 border-r border-border bg-[#17212b]">
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold">QBS Автонайм</span>
                <div className="flex gap-2">
                  <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-white/60" />
                  </div>
                </div>
              </div>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-auto">
              {[
                {
                  name: "Алексей Иванов",
                  msg: "Голосовое сообщение",
                  time: "14:25",
                  unread: 0,
                  active: true,
                },
                {
                  name: "Мария Сидорова",
                  msg: "Спасибо за приглашение!",
                  time: "13:42",
                  unread: 2,
                  active: false,
                },
                {
                  name: "Дмитрий Козлов",
                  msg: "Готов к интервью",
                  time: "12:18",
                  unread: 0,
                  active: false,
                },
                {
                  name: "Анна Петрова",
                  msg: "Когда удобно созвониться?",
                  time: "вчера",
                  unread: 1,
                  active: false,
                },
              ].map((chat, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 cursor-pointer ${chat.active ? "bg-[#2b5278]" : "hover:bg-white/5"}`}
                >
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                    {chat.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <span className="text-white text-sm font-medium truncate">
                        {chat.name}
                      </span>
                      <span className="text-white/40 text-xs">{chat.time}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/50 text-sm truncate">
                        {chat.msg}
                      </span>
                      {chat.unread > 0 && (
                        <span className="ml-2 h-5 min-w-5 rounded-full bg-[#3390ec] text-white text-xs flex items-center justify-center px-1.5">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main chat area */}
          <div className="flex-1 flex flex-col bg-[#0e1621]">
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#17212b]">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                АИ
              </div>
              <div className="flex-1">
                <div className="text-white text-sm font-medium">
                  Алексей Иванов
                </div>
                <div className="text-white/50 text-xs">был(а) только что</div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer">
                  <BarChart3 className="h-4 w-4 text-white/60" />
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 p-4 space-y-3 overflow-auto"
              style={{
                background:
                  "linear-gradient(180deg, #0e1621 0%, #0d1219 50%, #0a0f14 100%)",
              }}
            >
              {/* Bot question */}
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-[#182533] px-4 py-3 shadow">
                  <p className="text-sm text-white">
                    Здравствуйте, Алексей! Это автоматическое интервью от QBS.
                    Расскажите о вашем опыте работы с Python?
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px] text-white/40">14:20</span>
                  </div>
                </div>
              </div>

              {/* Voice message */}
              <div className="flex justify-end">
                <div className="flex items-center gap-3 rounded-2xl rounded-tr-sm bg-[#2b5278] px-4 py-3 min-w-[200px] shadow">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                    <Play className="h-4 w-4 text-white ml-0.5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-[2px] h-6 mb-1">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-[3px] rounded-full bg-white/60"
                          style={{
                            height: `${Math.max(20, Math.random() * 100)}%`,
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/60">1:24</span>
                      <div className="flex items-center gap-0.5">
                        <CheckCircle className="h-3 w-3 text-[#4fae4e]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transcription */}
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-xl bg-[#182533]/60 border border-[#2b5278]/30 px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[11px] text-emerald-400 font-medium uppercase tracking-wide">
                      Транскрибация AI
                    </span>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed">
                    Работаю с Python уже 8 лет. Начинал с веб-разработки на
                    Django, последние 3 года специализируюсь на FastAPI и
                    асинхронном программировании...
                  </p>
                </div>
              </div>

              {/* Follow-up question */}
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-[#182533] px-4 py-3 shadow">
                  <p className="text-sm text-white">
                    Отлично! Расскажите о самом сложном проекте, над которым вы
                    работали.
                  </p>
                  <span className="text-[10px] text-white/40 mt-1 block">
                    14:25
                  </span>
                </div>
              </div>
            </div>

            {/* Input area */}
            <div className="p-3 border-t border-white/5 bg-[#17212b]">
              <div className="flex items-center gap-3 bg-[#242f3d] rounded-xl px-4 py-2.5">
                <Mic className="h-5 w-5 text-white/40" />
                <span className="flex-1 text-white/40 text-sm">
                  Голосовое сообщение...
                </span>
                <div className="h-8 w-8 rounded-full bg-[#3390ec] flex items-center justify-center">
                  <Mic className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultsDemo() {
  const candidates = [
    {
      name: "Алексей Иванов",
      role: "Python Developer",
      score: 95,
      avatar: "АИ",
      trend: "+12%",
    },
    {
      name: "Мария Сидорова",
      role: "Product Manager",
      score: 91,
      avatar: "МС",
      trend: "+8%",
    },
    {
      name: "Дмитрий Козлов",
      role: "Frontend Dev",
      score: 87,
      avatar: "ДК",
      trend: "+5%",
    },
  ];

  return (
    <div className="relative">
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />

      <div className="relative rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-4 py-1 rounded-lg bg-background text-xs text-muted-foreground">
              qbs.ru/dashboard
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Stats overview */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="text-sm text-muted-foreground mb-2">
                    Обработано откликов
                  </div>
                  <div className="text-3xl font-bold text-foreground">247</div>
                  <div className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                    <ArrowRight className="h-3 w-3 rotate-[-45deg]" />
                    за последние 7 дней
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="text-sm text-muted-foreground mb-2">
                    Финалистов
                  </div>
                  <div className="text-3xl font-bold text-foreground">12</div>
                  <div className="text-xs text-primary mt-1">
                    топ 5% кандидатов
                  </div>
                </div>
              </div>

              {/* Conversion funnel mini */}
              <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-violet-500/5 to-emerald-500/5 p-5">
                <div className="text-sm font-medium text-foreground mb-4">
                  Воронка найма
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 space-y-2">
                    {[
                      {
                        label: "Просмотры",
                        value: 247,
                        width: "100%",
                        color: "bg-primary",
                      },
                      {
                        label: "Интервью",
                        value: 86,
                        width: "35%",
                        color: "bg-violet-500",
                      },
                      {
                        label: "Финалисты",
                        value: 12,
                        width: "5%",
                        color: "bg-emerald-500",
                      },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-20 text-xs text-muted-foreground">
                          {item.label}
                        </div>
                        <div className="flex-1 h-6 rounded-full bg-muted/50 overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full flex items-center justify-end pr-2`}
                            style={{ width: item.width }}
                          >
                            <span className="text-[10px] font-medium text-white">
                              {item.value}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Top candidates */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-semibold text-foreground">Топ кандидаты</h4>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  Python Developer
                </span>
              </div>
              <div className="space-y-3">
                {candidates.map((c, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer hover:shadow-md ${
                      i === 0
                        ? "bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20"
                        : "bg-muted/30 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {i === 0 && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-yellow-400 flex items-center justify-center text-[10px] font-bold text-yellow-900">
                            1
                          </div>
                        )}
                        <div
                          className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-medium ${
                            i === 0
                              ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                              : i === 1
                                ? "bg-gradient-to-br from-violet-400 to-violet-600"
                                : "bg-gradient-to-br from-primary to-blue-600"
                          }`}
                        >
                          {c.avatar}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {c.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {c.role}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-xl font-bold ${i === 0 ? "text-emerald-500" : "text-foreground"}`}
                      >
                        {c.score}%
                      </div>
                      <div className="text-xs text-emerald-500">{c.trend}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-3 rounded-xl bg-foreground text-background font-medium text-sm hover:opacity-90 transition-opacity">
                Посмотреть всех кандидатов
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
