import { BookOpen, Calendar, Search, Tag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsFeedback } from "@/components/docs/docs-feedback";
import { DocsMobileToc } from "@/components/docs/docs-mobile-toc";
import { DocsToc } from "@/components/docs/docs-toc";

export const metadata: Metadata = {
  title: "База знаний QBS Автонайм — статьи и гайды по рекрутингу",
  description:
    "База знаний по AI-рекрутингу. Статьи о лучших практиках найма, кейсы компаний, советы по работе с кандидатами. Полезные материалы для HR.",
  keywords: [
    "база знаний HR",
    "статьи о рекрутинге",
    "лучшие практики найма",
    "кейсы компаний",
    "гайды по AI HR",
    "советы рекрутерам",
  ],
};

export default function KnowledgeBasePage() {
  const tocItems = [
    { id: "featured", title: "Рекомендуемые статьи", level: 2 },
    { id: "best-practices", title: "Лучшие практики", level: 2 },
    { id: "case-studies", title: "Кейсы компаний", level: 2 },
    { id: "tutorials", title: "Пошаговые гайды", level: 2 },
    { id: "tips", title: "Полезные советы", level: 2 },
  ];

  const featuredArticles = [
    {
      id: "ai-recruitment",
      title: "Как сократить время найма на 70% с AI",
      description:
        "Практическое руководство по автоматизации первичного скрининга кандидатов",
      category: "Автоматизация",
      readTime: "8 мин",
      publishDate: "2026-01-10",
      href: "/help/knowledge-base/articles/ai-recruitment-automation",
    },
    {
      id: "job-mistakes",
      title: "Топ-10 ошибок в описании вакансий",
      description:
        "Почему хорошие кандидаты проходят мимо и как писать привлекательные вакансии",
      category: "Вакансии",
      readTime: "12 мин",
      publishDate: "2026-01-05",
      href: "/help/knowledge-base/articles/job-description-mistakes",
    },
    {
      id: "metrics",
      title: "Метрики найма: что отслеживать в 2026 году",
      description:
        "KPI для оценки эффективности рекрутинга и ROI инвестиций в найм",
      category: "Аналитика",
      readTime: "15 мин",
      publishDate: "2025-12-28",
      href: "/help/knowledge-base/articles/recruitment-metrics-2025",
    },
  ];

  const categories = [
    {
      id: "best-practices",
      title: "Лучшие практики",
      icon: "🎯",
      description: "Проверенные методы и подходы к рекрутингу",
      articles: [
        {
          title: "Структура идеального процесса найма",
          description: "От отклика до оффера: оптимизация каждого этапа",
          readTime: "6 мин",
          href: "/help/knowledge-base/articles/ideal-hiring-process",
        },
        {
          title: "Как оценивать кандидатов объективно",
          description: "Методы снижения bias в оценке резюме",
          readTime: "10 мин",
          href: "/help/knowledge-base/articles/objective-candidate-assessment",
        },
        {
          title: "Работа с пассивными кандидатами",
          description: "Стратегии привлечения топ-специалистов",
          readTime: "9 мин",
          href: "#",
        },
      ],
    },
    {
      id: "case-studies",
      title: "Кейсы компаний",
      icon: "🏢",
      description: "Реальные истории успеха от российских компаний",
      articles: [
        {
          title: "Как Ozon нанял 200+ разработчиков за 3 месяца",
          description: "Масштабирование команды с помощью AI",
          readTime: "14 мин",
          href: "#",
        },
        {
          title: "Кейс IT-компании: автоматизация найма на 500 вакансий",
          description: "От ручного подбора к AI-платформе",
          readTime: "18 мин",
          href: "/help/knowledge-base/articles/tech-company-automation-case",
        },
        {
          title: "История успеха IT-компании: +300% эффективность",
          description: "Как стартап стал лидером рынка благодаря AI",
          readTime: "11 мин",
          href: "#",
        },
      ],
    },
    {
      id: "tutorials",
      title: "Пошаговые гайды",
      icon: "📋",
      description: "Подробные инструкции по решению задач",
      articles: [
        {
          title: "Настройка мультиканального найма",
          description: "HH.ru + Telegram + сайт компании",
          readTime: "13 мин",
          href: "/help/knowledge-base/articles/multichannel-recruitment-setup",
        },
        {
          title: "Создание бренда работодателя в соцсетях",
          description: "Комплексный гайд по привлечению кандидатов",
          readTime: "16 мин",
          href: "#",
        },
        {
          title: "Анализ конкурентов на рынке труда",
          description: "Как изучать предложения других компаний",
          readTime: "8 мин",
          href: "#",
        },
      ],
    },
    {
      id: "tips",
      title: "Полезные советы",
      icon: "💡",
      description: "Короткие лайфхаки и рекомендации",
      articles: [
        {
          title: "5 фраз, которые отпугивают кандидатов",
          description: "Что не писать в вакансиях",
          readTime: "4 мин",
          href: "/help/knowledge-base/articles/phrases-that-scare-candidates",
        },
        {
          title: "Как проверить рекомендации кандидатов",
          description: "Эффективные методы проверки background",
          readTime: "7 мин",
          href: "/help/knowledge-base/articles/checking-candidate-references",
        },
        {
          title: "Мотивационные письма: читать или нет?",
          description: "Когда сопроводительное письмо важно",
          readTime: "5 мин",
          href: "/help/knowledge-base/articles/cover-letters-guide",
        },
      ],
    },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "Помощь и поддержка", href: "/help" },
            { title: "База знаний" },
          ]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">
            Помощь и поддержка
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          База знаний
        </h1>

        <p className="text-lg">
          Статьи, гайды и кейсы по современному рекрутингу. Лучшие практики,
          реальные истории успеха и практические советы для HR-специалистов.
        </p>

        <DocsMobileToc items={tocItems} />

        {/* Search bar */}
        <div className="relative my-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск по базе знаний..."
            className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <h2
          id="featured"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Рекомендуемые статьи
        </h2>

        <div className="grid gap-4 my-6 md:grid-cols-1">
          {featuredArticles.map((article) => (
            <Link
              key={article.id}
              href={article.href}
              className="p-6 border border-border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground">
                    {article.title}
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    {article.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {article.category}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {article.readTime} чтения
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {article.publishDate}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {categories.map((category) => (
          <div key={category.id}>
            <h2 id={category.id} className="flex items-center gap-2">
              <span className="text-2xl">{category.icon}</span>
              {category.title}
            </h2>
            <p className="text-muted-foreground mb-6">{category.description}</p>

            <div className="grid gap-4 mb-8 md:grid-cols-1">
              {category.articles.map((article) => (
                <Link
                  key={article.title}
                  href={article.href}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{article.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {article.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground ml-4">
                    <BookOpen className="h-4 w-4" />
                    {article.readTime}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        <DocsCallout type="info" title="Хотите поделиться опытом?">
          <p>
            У вас есть интересный кейс или полезный гайд? Напишите нам — мы
            опубликуем вашу статью в базе знаний и поделимся с сообществом HR.
          </p>
          <div className="mt-3">
            <a
              href="mailto:content@qbs-autonaim.ru"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              ✍️ Предложить статью
            </a>
          </div>
        </DocsCallout>

        <div className="bg-linear-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6 my-8">
          <h3 className="font-semibold text-primary mb-3">
            📈 Ежемесячный HR-инсайт
          </h3>
          <p className="text-muted-foreground mb-4">
            Подпишитесь на ежемесячную рассылку с аналитикой рынка труда,
            трендами рекрутинга и практическими советами для HR.
          </p>
          <div className="flex gap-4">
            <input
              type="email"
              placeholder="Ваш email"
              className="flex-1 px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              type="button"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Подписаться
            </button>
          </div>
        </div>

        <div className="my-8">
          <DocsFeedback />
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <a
            href="/help/videos"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Видео-инструкции
          </a>
          <a
            href="https://t.me/qbs_autonaim"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Поддержка
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
