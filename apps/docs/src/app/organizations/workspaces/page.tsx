import type { Metadata } from "next";
import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsFeedback } from "@/components/docs/docs-feedback";
import { DocsMobileToc } from "@/components/docs/docs-mobile-toc";
import { DocsToc } from "@/components/docs/docs-toc";
import { generatePageSEO } from "@/lib/seo";

export const metadata: Metadata = generatePageSEO("workspaces", {
  url: "/organizations/workspaces",
  type: "article",
});

export default function WorkspacesPage() {
  const tocItems = [
    { id: "what-is-workspace", title: "Что такое воркспейс", level: 2 },
    { id: "create-workspace", title: "Создание воркспейса", level: 2 },
    { id: "workspace-settings", title: "Настройки воркспейса", level: 2 },
    { id: "workspace-members", title: "Участники воркспейса", level: 2 },
    { id: "use-cases", title: "Примеры использования", level: 2 },
    { id: "real-examples", title: "Реальные примеры настройки", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "Документация", href: "/docs" },
            { title: "Организации", href: "/organizations" },
            { title: "Воркспейсы" },
          ]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">Управление</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Воркспейсы
        </h1>

        <p className="text-lg">
          Воркспейс — это изолированное пространство внутри организации для
          работы с вакансиями и кандидатами. Используйте воркспейсы для
          разделения команд, проектов или направлений найма.
        </p>

        <DocsMobileToc items={tocItems} />

        <h2
          id="what-is-workspace"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Что такое воркспейс
        </h2>

        <p className="mb-4">
          Воркспейс позволяет организовать работу отдельной команды или проекта
          с собственными вакансиями, кандидатами и настройками. Каждый воркспейс
          имеет свой набор участников с определенными правами доступа.
        </p>

        <div className="my-6 space-y-3">
          <div className="border border-border rounded-lg p-4">
            <h3 className="text-base font-semibold mb-2">
              Основные возможности
            </h3>
            <ul className="space-y-2 text-sm">
              <li>• Изолированная работа с вакансиями и кандидатами</li>
              <li>• Собственные интеграции с HH.ru и фриланс-платформами</li>
              <li>• Настройка AI-ассистента под специфику команды</li>
              <li>• Отдельная аналитика и отчеты</li>
              <li>• Управление доступом участников</li>
            </ul>
          </div>
        </div>

        <DocsCallout type="info" title="Структура">
          Организация может содержать несколько воркспейсов. На бесплатном
          тарифе доступен 1 воркспейс, на платных — неограниченно.
        </DocsCallout>

        <h2
          id="create-workspace"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Создание воркспейса
        </h2>

        <p className="mb-4">
          Создать новый воркспейс может владелец или администратор организации.
        </p>

        <ol className="space-y-3 mb-6">
          <li>1. Откройте меню организации в левом верхнем углу</li>
          <li>2. Нажмите «Создать воркспейс»</li>
          <li>3. Заполните название и slug (используется в URL)</li>
          <li>4. Добавьте описание (опционально)</li>
          <li>5. Нажмите «Создать»</li>
        </ol>

        <div className="my-6 rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            📸 Скриншот: Создание воркспейса
          </p>
          <p className="text-xs text-muted-foreground">
            Показать форму создания воркспейса с полями: Название, Slug,
            Описание
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Путь: /orgs/[orgSlug]/workspaces/new
          </p>
        </div>

        <DocsCallout type="tip" title="Совет">
          Используйте понятные названия воркспейсов: «IT-отдел», «Продажи»,
          «Маркетинг» или по проектам: «Проект А», «Летняя стажировка 2026».
        </DocsCallout>

        <h2
          id="workspace-settings"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Настройки воркспейса
        </h2>

        <p className="mb-4">
          Каждый воркспейс имеет собственные настройки, которые не влияют на
          другие воркспейсы организации.
        </p>

        <div className="space-y-4">
          <div className="border border-border rounded-lg p-4">
            <h3 className="text-base font-semibold mb-2">Основные настройки</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">Название и slug:</strong>{" "}
                Можно изменить в любой момент
              </li>
              <li>
                <strong className="text-foreground">Описание:</strong> Краткая
                информация о назначении воркспейса
              </li>
              <li>
                <strong className="text-foreground">Видимость:</strong>{" "}
                Приватный (только участники) или публичный (все в организации)
              </li>
            </ul>
          </div>

          <div className="border border-border rounded-lg p-4">
            <h3 className="text-base font-semibold mb-2">Интеграции</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">HH.ru:</strong> Подключение
                аккаунта работодателя
              </li>
              <li>
                <strong className="text-foreground">Фриланс-платформы:</strong>{" "}
                Kwork, FL.ru, Freelance.ru
              </li>
              <li>
                <strong className="text-foreground">Telegram:</strong> Бот для
                проведения интервью
              </li>
              <li>
                <strong className="text-foreground">Email:</strong>{" "}
                Автоматические уведомления
              </li>
            </ul>
          </div>

          <div className="border border-border rounded-lg p-4">
            <h3 className="text-base font-semibold mb-2">AI-настройки</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">Шаблоны оценки:</strong>{" "}
                Критерии для AI-скрининга
              </li>
              <li>
                <strong className="text-foreground">Сценарии интервью:</strong>{" "}
                Вопросы для автоматических интервью
              </li>
              <li>
                <strong className="text-foreground">Автоответы:</strong> Шаблоны
                сообщений кандидатам
              </li>
            </ul>
          </div>
        </div>

        <h2
          id="workspace-members"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Участники воркспейса
        </h2>

        <p className="mb-4">
          Управляйте доступом к воркспейсу, добавляя участников из организации.
        </p>

        <div className="my-6 rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            📸 Скриншот: Участники воркспейса
          </p>
          <p className="text-xs text-muted-foreground">
            Показать список участников воркспейса с ролями
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Путь: /orgs/[orgSlug]/workspaces/[slug]/settings/members
          </p>
        </div>

        <h3 className="text-lg font-semibold mb-3">Роли в воркспейсе</h3>

        <div className="space-y-4 mb-6">
          <div className="border border-border rounded-lg p-4">
            <h4 className="text-base font-semibold mb-2">Менеджер (Manager)</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Полный доступ к воркспейсу
            </p>
            <ul className="space-y-1 text-sm">
              <li>• Управление настройками воркспейса</li>
              <li>• Добавление и удаление участников</li>
              <li>• Создание и редактирование вакансий</li>
              <li>• Доступ ко всей аналитике</li>
            </ul>
          </div>

          <div className="border border-border rounded-lg p-4">
            <h4 className="text-base font-semibold mb-2">
              Рекрутер (Recruiter)
            </h4>
            <p className="text-sm text-muted-foreground mb-2">
              Работа с вакансиями и кандидатами
            </p>
            <ul className="space-y-1 text-sm">
              <li>• Создание и редактирование вакансий</li>
              <li>• Оценка и коммуникация с кандидатами</li>
              <li>• Использование AI-инструментов</li>
              <li>• Просмотр аналитики по своим вакансиям</li>
            </ul>
          </div>

          <div className="border border-border rounded-lg p-4">
            <h4 className="text-base font-semibold mb-2">
              Наблюдатель (Viewer)
            </h4>
            <p className="text-sm text-muted-foreground mb-2">
              Только просмотр данных
            </p>
            <ul className="space-y-1 text-sm">
              <li>• Просмотр вакансий и кандидатов</li>
              <li>• Доступ к аналитике</li>
              <li>• Нет возможности редактирования</li>
            </ul>
          </div>
        </div>

        <h2
          id="use-cases"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Примеры использования
        </h2>

        <p className="mb-4">
          Воркспейсы можно организовать по-разному в зависимости от структуры
          компании:
        </p>

        <div className="space-y-4">
          <div className="border border-border rounded-lg p-4">
            <h3 className="text-base font-semibold mb-2">По отделам</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Каждый отдел имеет свой воркспейс
            </p>
            <ul className="space-y-1 text-sm">
              <li>• «IT-отдел» — найм разработчиков, тестировщиков, DevOps</li>
              <li>• «Продажи» — менеджеры по продажам, аккаунт-менеджеры</li>
              <li>• «Маркетинг» — маркетологи, дизайнеры, контент-менеджеры</li>
            </ul>
          </div>

          <div className="border border-border rounded-lg p-4">
            <h3 className="text-base font-semibold mb-2">По проектам</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Временные воркспейсы для конкретных проектов
            </p>
            <ul className="space-y-1 text-sm">
              <li>• «Запуск нового продукта» — найм команды для стартапа</li>
              <li>• «Летняя стажировка 2026» — набор стажеров</li>
              <li>• «Открытие филиала в Москве» — массовый найм</li>
            </ul>
          </div>

          <div className="border border-border rounded-lg p-4">
            <h3 className="text-base font-semibold mb-2">По регионам</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Разделение по географическому признаку
            </p>
            <ul className="space-y-1 text-sm">
              <li>• «Москва» — вакансии в московском офисе</li>
              <li>• «Санкт-Петербург» — вакансии в питерском офисе</li>
              <li>• «Удаленка» — вакансии для удаленной работы</li>
            </ul>
          </div>

          <div className="border border-border rounded-lg p-4">
            <h3 className="text-base font-semibold mb-2">По типу найма</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Разделение по характеру работы
            </p>
            <ul className="space-y-1 text-sm">
              <li>• «Штат» — постоянные сотрудники</li>
              <li>• «Фриланс» — проектная работа</li>
              <li>• «Стажировки» — студенты и начинающие специалисты</li>
            </ul>
          </div>
        </div>

        <DocsCallout type="tip" title="Рекомендация">
          Начните с одного воркспейса и создавайте новые по мере роста команды.
          Слишком много воркспейсов может усложнить управление.
        </DocsCallout>

        <h2
          id="real-examples"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Реальные примеры настройки воркспейсов
        </h2>

        <p className="mb-4">
          Посмотрите, как разные компании организуют воркспейсы под свои задачи:
        </p>

        <div className="space-y-6">
          <div className="border-2 border-primary/20 rounded-lg p-5 bg-primary/5">
            <div className="flex items-start gap-3 mb-3">
              <div className="text-2xl">🚀</div>
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  Стартап "Фудтех" (15 человек)
                </h3>
                <p className="text-sm text-muted-foreground">
                  Быстрорастущий стартап в сфере доставки еды
                </p>
              </div>
            </div>

            <div className="bg-background/50 rounded p-3 mb-3 text-sm font-mono">
              Организация: "Фудтех"
              <br />
              └─ Воркспейс: "Команда" (все вакансии в одном месте)
            </div>

            <div className="space-y-2 text-sm">
              <p>
                <strong className="text-foreground">Задача:</strong> Быстро
                нанять первых 10 сотрудников без HR-отдела
              </p>
              <p>
                <strong className="text-foreground">Решение:</strong> Один
                воркспейс для всех вакансий, основатель сам управляет наймом
                через AI-скрининг
              </p>
              <p>
                <strong className="text-foreground">Результат:</strong> Закрыли
                8 вакансий за месяц, сэкономили на найме HR-менеджера
              </p>
            </div>
          </div>

          <div className="border-2 border-primary/20 rounded-lg p-5 bg-primary/5">
            <div className="flex items-start gap-3 mb-3">
              <div className="text-2xl">🏢</div>
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  IT-компания "ТехноСервис" (150 человек)
                </h3>
                <p className="text-sm text-muted-foreground">
                  Разработка корпоративного ПО
                </p>
              </div>
            </div>

            <div className="bg-background/50 rounded p-3 mb-3 text-sm font-mono">
              Организация: "ТехноСервис"
              <br />
              ├─ Воркспейс: "Backend-разработка"
              <br />
              ├─ Воркспейс: "Frontend-разработка"
              <br />
              ├─ Воркспейс: "QA и тестирование"
              <br />
              ├─ Воркспейс: "DevOps"
              <br />
              └─ Воркспейс: "Продажи и поддержка"
            </div>

            <div className="space-y-2 text-sm">
              <p>
                <strong className="text-foreground">Задача:</strong> Разделить
                найм по техническим направлениям с разными требованиями
              </p>
              <p>
                <strong className="text-foreground">Решение:</strong> Каждый
                тимлид управляет своим воркспейсом, настраивает AI под специфику
                стека
              </p>
              <p>
                <strong className="text-foreground">Результат:</strong> Точность
                оценки кандидатов выросла на 40%, время найма сократилось вдвое
              </p>
            </div>
          </div>

          <div className="border-2 border-primary/20 rounded-lg p-5 bg-primary/5">
            <div className="flex items-start gap-3 mb-3">
              <div className="text-2xl">🏪</div>
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  Ритейл сеть "Продукты 24" (500+ человек)
                </h3>
                <p className="text-sm text-muted-foreground">
                  Сеть продуктовых магазинов в 3 регионах
                </p>
              </div>
            </div>

            <div className="bg-background/50 rounded p-3 mb-3 text-sm font-mono">
              Организация: "Продукты 24"
              <br />
              ├─ Воркспейс: "Москва — Продавцы"
              <br />
              ├─ Воркспейс: "Москва — Управляющие"
              <br />
              ├─ Воркспейс: "Санкт-Петербург"
              <br />
              ├─ Воркспейс: "Казань"
              <br />
              └─ Воркспейс: "Головной офис"
            </div>

            <div className="space-y-2 text-sm">
              <p>
                <strong className="text-foreground">Задача:</strong> Массовый
                найм продавцов в разных городах с учетом региональной специфики
              </p>
              <p>
                <strong className="text-foreground">Решение:</strong> Воркспейсы
                по регионам, региональные HR-менеджеры работают независимо
              </p>
              <p>
                <strong className="text-foreground">Результат:</strong>{" "}
                Обрабатывают 200+ откликов в день, закрывают вакансии за 3 дня
                вместо 2 недель
              </p>
            </div>
          </div>

          <div className="border-2 border-primary/20 rounded-lg p-5 bg-primary/5">
            <div className="flex items-start gap-3 mb-3">
              <div className="text-2xl">🤝</div>
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  Кадровое агентство "HR Эксперт"
                </h3>
                <p className="text-sm text-muted-foreground">
                  Подбор персонала для 20+ клиентов
                </p>
              </div>
            </div>

            <div className="bg-background/50 rounded p-3 mb-3 text-sm font-mono">
              Организация: "HR Эксперт"
              <br />
              ├─ Воркспейс: "Клиент: Банк Альфа"
              <br />
              ├─ Воркспейс: "Клиент: Ритейл Групп"
              <br />
              ├─ Воркспейс: "Клиент: Логистика Про"
              <br />
              ├─ Воркспейс: "Массовый подбор"
              <br />
              ├─ Воркспейс: "IT-специалисты"
              <br />
              └─ Воркспейс: "Топ-менеджмент"
            </div>

            <div className="space-y-2 text-sm">
              <p>
                <strong className="text-foreground">Задача:</strong> Изолировать
                данные клиентов, предоставлять отчеты по каждому проекту
              </p>
              <p>
                <strong className="text-foreground">Решение:</strong> Отдельный
                воркспейс на клиента, клиенты получают доступ только к своему
                воркспейсу
              </p>
              <p>
                <strong className="text-foreground">Результат:</strong>{" "}
                Прозрачность для клиентов, автоматические отчеты, рост числа
                клиентов на 30%
              </p>
            </div>
          </div>

          <div className="border-2 border-primary/20 rounded-lg p-5 bg-primary/5">
            <div className="flex items-start gap-3 mb-3">
              <div className="text-2xl">🏗️</div>
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  Строительный холдинг "СтройГрупп"
                </h3>
                <p className="text-sm text-muted-foreground">
                  5 компаний в составе холдинга
                </p>
              </div>
            </div>

            <div className="bg-background/50 rounded p-3 mb-3 text-sm font-mono">
              Организация: "СтройГрупп Холдинг"
              <br />
              ├─ Воркспейс: "СтройГрупп — Жилье"
              <br />
              ├─ Воркспейс: "СтройГрупп — Коммерция"
              <br />
              ├─ Воркспейс: "СтройМатериалы"
              <br />
              ├─ Воркспейс: "Проектное бюро"
              <br />
              └─ Воркспейс: "Управляющая компания"
            </div>

            <div className="space-y-2 text-sm">
              <p>
                <strong className="text-foreground">Задача:</strong>{" "}
                Централизованный HR для всех компаний холдинга с единым
                биллингом
              </p>
              <p>
                <strong className="text-foreground">Решение:</strong> Одна
                организация, воркспейсы по компаниям, общая база кандидатов
              </p>
              <p>
                <strong className="text-foreground">Результат:</strong> Экономия
                на подписке, возможность перемещать кандидатов между компаниями
              </p>
            </div>
          </div>

          <div className="border-2 border-primary/20 rounded-lg p-5 bg-primary/5">
            <div className="flex items-start gap-3 mb-3">
              <div className="text-2xl">🎪</div>
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  Организатор фестивалей "Лето Фест"
                </h3>
                <p className="text-sm text-muted-foreground">
                  Проведение музыкальных фестивалей
                </p>
              </div>
            </div>

            <div className="bg-background/50 rounded p-3 mb-3 text-sm font-mono">
              Организация: "Лето Фест"
              <br />
              ├─ Воркспейс: "Фестиваль 2026 — Москва"
              <br />
              ├─ Воркспейс: "Фестиваль 2026 — Питер"
              <br />
              ├─ Воркспейс: "Архив 2025"
              <br />
              └─ Воркспейс: "Постоянная команда"
            </div>

            <div className="space-y-2 text-sm">
              <p>
                <strong className="text-foreground">Задача:</strong> Массовый
                сезонный найм волонтеров и технического персонала
              </p>
              <p>
                <strong className="text-foreground">Решение:</strong> Временные
                воркспейсы под каждое мероприятие, архивирование после
                завершения
              </p>
              <p>
                <strong className="text-foreground">Результат:</strong> Наняли
                150 человек за 2 недели, повторно пригласили лучших из прошлого
                года
              </p>
            </div>
          </div>

          <div className="border-2 border-primary/20 rounded-lg p-5 bg-primary/5">
            <div className="flex items-start gap-3 mb-3">
              <div className="text-2xl">💼</div>
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  Аутсорсинг "Бизнес Поддержка"
                </h3>
                <p className="text-sm text-muted-foreground">
                  Аутсорсинг бухгалтерии и IT
                </p>
              </div>
            </div>

            <div className="bg-background/50 rounded p-3 mb-3 text-sm font-mono">
              Организация: "Бизнес Поддержка"
              <br />
              ├─ Воркспейс: "Бухгалтеры"
              <br />
              ├─ Воркспейс: "Системные администраторы"
              <br />
              ├─ Воркспейс: "Helpdesk"
              <br />
              └─ Воркспейс: "Юристы"
            </div>

            <div className="space-y-2 text-sm">
              <p>
                <strong className="text-foreground">Задача:</strong> Постоянный
                поток кандидатов для быстрой замены специалистов у клиентов
              </p>
              <p>
                <strong className="text-foreground">Решение:</strong> Воркспейсы
                по специализациям, постоянный скрининг входящих резюме
              </p>
              <p>
                <strong className="text-foreground">Результат:</strong> База
                готовых кандидатов, замена специалиста у клиента за 1 день
              </p>
            </div>
          </div>
        </div>

        <div className="my-8">
          <DocsFeedback />
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/organizations"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Организации
          </Link>
          <Link
            href="/candidates"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Кандидаты
            <span className="group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  );
}
