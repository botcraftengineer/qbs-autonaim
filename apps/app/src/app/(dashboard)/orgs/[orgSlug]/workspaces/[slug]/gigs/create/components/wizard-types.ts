import type { GigType } from "./types";

export type WizardStep =
  | "category"
  | "subtype"
  | "stack"
  | "features"
  | "budget"
  | "timeline"
  | "details"
  | "review";

export interface CategoryOption {
  id: GigType;
  label: string;
  emoji: string;
  description: string;
  subtypes: SubtypeOption[];
}

export interface SubtypeOption {
  id: string;
  label: string;
  features: FeatureOption[];
  stacks?: TechStackOption[];
}

export interface FeatureOption {
  id: string;
  label: string;
  popular?: boolean;
}

export interface TechStackOption {
  id: string;
  label: string;
  description: string;
  popular?: boolean;
}

export interface BudgetOption {
  id: string;
  label: string;
  min: number;
  max: number;
}

export interface TimelineOption {
  id: string;
  label: string;
  emoji: string;
  days: string;
}

export const CATEGORIES: CategoryOption[] = [
  {
    id: "DEVELOPMENT",
    label: "Разработка",
    emoji: "💻",
    description: "Сайты, приложения, боты",
    subtypes: [
      {
        id: "landing",
        label: "Лендинг",
        stacks: [
          { id: "html-css", label: "HTML/CSS/JS", description: "Простой статичный сайт", popular: true },
          { id: "react", label: "React", description: "Next.js, Gatsby" },
          { id: "vue", label: "Vue", description: "Nuxt.js" },
          { id: "wordpress", label: "WordPress", description: "Готовые темы и плагины", popular: true },
          { id: "tilda", label: "Tilda/Конструктор", description: "Без кода" },
          { id: "any", label: "На усмотрение", description: "Доверяю выбор исполнителю" },
        ],
        features: [
          { id: "responsive", label: "Адаптивный дизайн", popular: true },
          { id: "animations", label: "Анимации" },
          { id: "forms", label: "Формы обратной связи", popular: true },
          { id: "analytics", label: "Аналитика" },
          { id: "seo", label: "SEO-оптимизация" },
        ],
      },
      {
        id: "corporate",
        label: "Корпоративный сайт",
        stacks: [
          { id: "wordpress", label: "WordPress", description: "Популярная CMS", popular: true },
          { id: "react-next", label: "React + Next.js", description: "Современный стек" },
          { id: "php-laravel", label: "PHP/Laravel", description: "Классический backend" },
          { id: "bitrix", label: "1С-Битрикс", description: "Для интеграции с 1С" },
          { id: "any", label: "На усмотрение", description: "Доверяю выбор исполнителю" },
        ],
        features: [
          { id: "cms", label: "Админ-панель (CMS)", popular: true },
          { id: "blog", label: "Блог" },
          { id: "multilang", label: "Мультиязычность" },
          { id: "responsive", label: "Адаптивный дизайн", popular: true },
          { id: "seo", label: "SEO-оптимизация" },
        ],
      },
      {
        id: "ecommerce",
        label: "Интернет-магазин",
        stacks: [
          { id: "shopify", label: "Shopify", description: "Готовое решение" },
          { id: "woocommerce", label: "WooCommerce", description: "WordPress + магазин", popular: true },
          { id: "bitrix", label: "1С-Битрикс", description: "Интеграция с 1С", popular: true },
          { id: "react-next", label: "React + Next.js", description: "Кастомное решение" },
          { id: "any", label: "На усмотрение", description: "Доверяю выбор исполнителю" },
        ],
        features: [
          { id: "catalog", label: "Каталог товаров", popular: true },
          { id: "cart", label: "Корзина и оформление", popular: true },
          { id: "payment", label: "Онлайн-оплата" },
          { id: "filters", label: "Фильтры и поиск" },
          { id: "admin", label: "Админ-панель" },
        ],
      },
      {
        id: "webapp",
        label: "Веб-приложение",
        stacks: [
          { id: "react-node", label: "React + Node.js", description: "JavaScript fullstack", popular: true },
          { id: "react-next", label: "Next.js", description: "React фреймворк", popular: true },
          { id: "vue-nuxt", label: "Vue + Nuxt", description: "Vue фреймворк" },
          { id: "python-django", label: "Python + Django", description: "Python backend" },
          { id: "php-laravel", label: "PHP + Laravel", description: "PHP backend" },
          { id: "any", label: "На усмотрение", description: "Доверяю выбор исполнителю" },
        ],
        features: [
          { id: "auth", label: "Авторизация", popular: true },
          { id: "dashboard", label: "Личный кабинет" },
          { id: "api", label: "API интеграции" },
          { id: "realtime", label: "Real-time функции" },
          { id: "notifications", label: "Уведомления" },
        ],
      },
      {
        id: "mobile",
        label: "Мобильное приложение",
        stacks: [
          { id: "react-native", label: "React Native", description: "Кроссплатформа JS", popular: true },
          { id: "flutter", label: "Flutter", description: "Кроссплатформа Dart", popular: true },
          { id: "swift", label: "Swift (iOS)", description: "Нативный iOS" },
          { id: "kotlin", label: "Kotlin (Android)", description: "Нативный Android" },
          { id: "any", label: "На усмотрение", description: "Доверяю выбор исполнителю" },
        ],
        features: [
          { id: "ios", label: "iOS", popular: true },
          { id: "android", label: "Android", popular: true },
          { id: "push", label: "Push-уведомления" },
          { id: "offline", label: "Офлайн-режим" },
          { id: "geolocation", label: "Геолокация" },
        ],
      },
      {
        id: "bot",
        label: "Telegram-бот",
        stacks: [
          { id: "python", label: "Python", description: "aiogram, python-telegram-bot", popular: true },
          { id: "nodejs", label: "Node.js", description: "Telegraf, grammY", popular: true },
          { id: "php", label: "PHP", description: "Telegram Bot API" },
          { id: "any", label: "На усмотрение", description: "Доверяю выбор исполнителю" },
        ],
        features: [
          { id: "commands", label: "Команды и меню", popular: true },
          { id: "payments", label: "Приём платежей" },
          { id: "notifications", label: "Рассылки" },
          { id: "ai", label: "AI-функции" },
          { id: "admin", label: "Админ-панель" },
        ],
      },
    ],
  },
  {
    id: "DESIGN",
    label: "Дизайн",
    emoji: "",
    description: "Логотипы, UI/UX, графика",
    subtypes: [
      {
        id: "logo",
        label: "Логотип",
        features: [
          { id: "variants", label: "3+ варианта", popular: true },
          { id: "brandbook", label: "Брендбук" },
          { id: "mockups", label: "Мокапы" },
          { id: "source", label: "Исходники" },
        ],
      },
      {
        id: "ui",
        label: "UI/UX дизайн",
        features: [
          { id: "wireframes", label: "Прототипы", popular: true },
          { id: "uikit", label: "UI-кит" },
          { id: "responsive", label: "Адаптив", popular: true },
          { id: "animations", label: "Анимации" },
        ],
      },
      {
        id: "banner",
        label: "Баннеры и креативы",
        features: [
          { id: "social", label: "Для соцсетей", popular: true },
          { id: "ads", label: "Рекламные" },
          { id: "animated", label: "Анимированные" },
          { id: "sizes", label: "Разные размеры" },
        ],
      },
      {
        id: "presentation",
        label: "Презентация",
        features: [
          { id: "template", label: "Шаблон", popular: true },
          { id: "infographics", label: "Инфографика" },
          { id: "icons", label: "Иконки" },
          { id: "animations", label: "Анимации" },
        ],
      },
    ],
  },
  {
    id: "COPYWRITING",
    label: "Тексты",
    emoji: "",
    description: "Статьи, копирайтинг, контент",
    subtypes: [
      {
        id: "article",
        label: "Статья / Блог",
        features: [
          { id: "seo", label: "SEO-оптимизация", popular: true },
          { id: "research", label: "Исследование темы" },
          { id: "images", label: "Подбор изображений" },
          { id: "editing", label: "Редактура" },
        ],
      },
      {
        id: "landing-text",
        label: "Текст для лендинга",
        features: [
          { id: "selling", label: "Продающий текст", popular: true },
          { id: "structure", label: "Структура блоков" },
          { id: "cta", label: "CTA-кнопки" },
          { id: "benefits", label: "УТП и преимущества" },
        ],
      },
      {
        id: "smm",
        label: "SMM-контент",
        features: [
          { id: "posts", label: "Посты", popular: true },
          { id: "stories", label: "Сторис" },
          { id: "reels", label: "Сценарии Reels" },
          { id: "plan", label: "Контент-план" },
        ],
      },
    ],
  },
  {
    id: "MARKETING",
    label: "Маркетинг",
    emoji: "",
    description: "Реклама, SMM, продвижение",
    subtypes: [
      {
        id: "targeting",
        label: "Таргетированная реклама",
        features: [
          { id: "vk", label: "ВКонтакте", popular: true },
          { id: "tg", label: "Telegram Ads" },
          { id: "yandex", label: "Яндекс.Директ" },
          { id: "analytics", label: "Аналитика" },
        ],
      },
      {
        id: "smm-management",
        label: "Ведение соцсетей",
        features: [
          { id: "content", label: "Контент", popular: true },
          { id: "design", label: "Дизайн постов" },
          { id: "engagement", label: "Вовлечение" },
          { id: "reports", label: "Отчёты" },
        ],
      },
    ],
  },
  {
    id: "VIDEO",
    label: "Видео",
    emoji: "",
    description: "Монтаж, анимация, ролики",
    subtypes: [
      {
        id: "editing",
        label: "Монтаж видео",
        features: [
          { id: "cuts", label: "Нарезка и склейка", popular: true },
          { id: "color", label: "Цветокоррекция" },
          { id: "sound", label: "Звук и музыка" },
          { id: "subtitles", label: "Субтитры" },
        ],
      },
      {
        id: "motion",
        label: "Моушн-дизайн",
        features: [
          { id: "intro", label: "Интро/Аутро", popular: true },
          { id: "infographics", label: "Инфографика" },
          { id: "logo-animation", label: "Анимация лого" },
          { id: "explainer", label: "Эксплейнер" },
        ],
      },
    ],
  },
  {
    id: "OTHER",
    label: "Другое",
    emoji: "",
    description: "Опишите задачу своими словами",
    subtypes: [],
  },
];

export const BUDGET_OPTIONS: BudgetOption[] = [
  { id: "micro", label: "до 5 000 ₽", min: 0, max: 5000 },
  { id: "small", label: "5 000  15 000 ₽", min: 5000, max: 15000 },
  { id: "medium", label: "15 000  50 000 ₽", min: 15000, max: 50000 },
  { id: "large", label: "50 000  150 000 ₽", min: 50000, max: 150000 },
  { id: "enterprise", label: "от 150 000 ₽", min: 150000, max: 500000 },
];

export const TIMELINE_OPTIONS: TimelineOption[] = [
  { id: "asap", label: "Срочно", emoji: "", days: "1-3 дня" },
  { id: "week", label: "Неделя", emoji: "", days: "5-7 дней" },
  { id: "two-weeks", label: "2 недели", emoji: "", days: "10-14 дней" },
  { id: "month", label: "Месяц", emoji: "", days: "3-4 недели" },
  { id: "flexible", label: "Гибкие сроки", emoji: "", days: "обсуждаемо" },
];

export interface WizardState {
  step: WizardStep;
  category: CategoryOption | null;
  subtype: SubtypeOption | null;
  stack: TechStackOption | null;
  features: string[];
  budget: BudgetOption | null;
  timeline: TimelineOption | null;
  customDetails: string;
}

export const initialWizardState: WizardState = {
  step: "category",
  category: null,
  subtype: null,
  stack: null,
  features: [],
  budget: null,
  timeline: null,
  customDetails: "",
};