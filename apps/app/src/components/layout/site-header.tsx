"use client";

import { Separator, SidebarTrigger } from "@qbs-autonaim/ui";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { InfoTooltip } from "../ui/info-tooltip";

interface SiteHeaderProps {
  children?: React.ReactNode;
}

// Тип для конфигурации раздела
type SectionConfig = {
  title: string;
  description: string;
  docsUrl: string;
};

// Конфигурация разделов с названиями, описаниями и ссылками на документацию
const sectionConfig = {
  // Обзор
  "/": { title: "Панель управления", description: "Обзор вашего рабочего пространства", docsUrl: "https://docs.hh.qbs.ru/dashboard" },

  // Рекрутинг
  "/vacancies": { title: "Вакансии", description: "Управление вакансиями и их настройками", docsUrl: "https://docs.hh.qbs.ru/vacancies" },
  "/gigs": { title: "Разовые задания", description: "Создание и управление разовыми задачами", docsUrl: "https://docs.hh.qbs.ru/gigs" },
  "/responses": { title: "Отклики", description: "Просмотр и обработка откликов кандидатов", docsUrl: "https://docs.hh.qbs.ru/responses" },
  "/candidates": { title: "Кандидаты", description: "База данных кандидатов и их профили", docsUrl: "https://docs.hh.qbs.ru/candidates" },

  // Коммуникации
  "/chat": { title: "Чаты", description: "Общение с кандидатами и заказчиками", docsUrl: "https://docs.hh.qbs.ru/chat" },
  "/funnel": { title: "Воронка найма", description: "Аналитика процесса подбора персонала", docsUrl: "https://docs.hh.qbs.ru/funnel" },

  // Настройки
  "/settings": { title: "Настройки", description: "Настройки аккаунта и рабочего пространства", docsUrl: "https://docs.hh.qbs.ru/settings" },

  // Создание/Редактирование
  "create": { title: "Создание", description: "Создание новой вакансии или задания", docsUrl: "https://docs.hh.qbs.ru/creating" },
  "edit": { title: "Редактирование", description: "Редактирование существующего контента", docsUrl: "https://docs.hh.qbs.ru/editing" },
  "generate": { title: "Генерация", description: "Автоматическая генерация контента с помощью AI", docsUrl: "https://docs.hh.qbs.ru/generation" },
} as const;

// Функция для определения текущего раздела на основе пути
function getCurrentSection(pathname: string): SectionConfig {
  // Проверяем точные совпадения сначала
  if (pathname in sectionConfig) {
    return sectionConfig[pathname as keyof typeof sectionConfig];
  }

  // Проверяем частичные совпадения (содержит ключевые слова)
  for (const [key, config] of Object.entries(sectionConfig)) {
    if (key !== "/" && pathname.includes(key)) {
      return config;
    }
  }

  // Разбираем путь по сегментам для более точного определения
  const segments = pathname.split("/").filter(Boolean);

  // Для вложенных маршрутов типа /orgs/.../workspaces/.../vacancies
  if (segments.includes("vacancies")) {
    if (segments.includes("create")) {
      return sectionConfig.create;
    }
    if (segments.includes("generate")) {
      return sectionConfig.generate;
    }
    return sectionConfig["/vacancies"];
  }

  if (segments.includes("gigs")) {
    if (segments.includes("create")) {
      return sectionConfig.create;
    }
    if (segments.includes("edit")) {
      return sectionConfig.edit;
    }
    return sectionConfig["/gigs"];
  }

  if (segments.includes("responses")) {
    return sectionConfig["/responses"];
  }

  if (segments.includes("candidates")) {
    return sectionConfig["/candidates"];
  }

  if (segments.includes("chat")) {
    return sectionConfig["/chat"];
  }

  if (segments.includes("funnel")) {
    return sectionConfig["/funnel"];
  }

  if (segments.includes("settings")) {
    return sectionConfig["/settings"];
  }

  // По умолчанию возвращаем панель управления
  return sectionConfig["/"];
}

export function SiteHeader({ children }: SiteHeaderProps) {
  const pathname = usePathname();

  const currentSection = useMemo(() => getCurrentSection(pathname), [pathname]);

  return (
    <header className="bg-background/40 sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) md:rounded-tl-xl md:rounded-tr-xl">
      <div className="flex w-full items-center gap-1 px-4 py-3 lg:gap-2 lg:px-6 lg:py-4">
        <SidebarTrigger />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="lg:flex-1">
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-base font-medium text-foreground">
              {currentSection.title}
            </span>
            <InfoTooltip
              content={`${currentSection.description} [Подробнее в документации](${currentSection.docsUrl})`}
            />
          </div>
          {/* Мобильная версия - только иконка помощи */}
          <div className="flex lg:hidden">
            <InfoTooltip
              content={`**${currentSection.title}**\n\n${currentSection.description} [Подробнее в документации](${currentSection.docsUrl})`}
            />
          </div>
        </div>
        {children && (
          <div className="ml-auto flex items-center gap-2">{children}</div>
        )}
      </div>
    </header>
  );
}
