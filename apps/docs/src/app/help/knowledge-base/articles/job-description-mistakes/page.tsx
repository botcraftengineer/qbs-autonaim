import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";
import Link from "next/link";

export default function JobDescriptionMistakesPage() {
  const tocItems = [
    { id: "intro", title: "Почему это важно", level: 2 },
    { id: "mistakes", title: "10 главных ошибок", level: 2 },
    { id: "examples", title: "Примеры", level: 2 },
    { id: "checklist", title: "Чек-лист", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "База знаний", href: "/help/knowledge-base" },
            { title: "Топ-10 ошибок в описании вакансий" },
          ]}
        />

        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
            Вакансии
          </span>
          <span className="text-sm text-muted-foreground">12 мин чтения</span>
          <span className="text-sm text-muted-foreground">5 января 2026</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Топ-10 ошибок в описании вакансий
        </h1>

        <p className="text-lg text-muted-foreground mb-8">
          Почему хорошие кандидаты проходят мимо и как писать привлекательные
          вакансии, которые приносят качественные отклики
        </p>

        <h2
          id="intro"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Почему описание вакансии критично важно
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Описание вакансии — это первое впечатление кандидата о вашей компании.
          По статистике, 60% соискателей отказываются от отклика из-за плохо
          написанной вакансии, даже если позиция им подходит.
        </p>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3">Статистика:</h3>
          <ul className="space-y-2 text-sm">
            <li>📊 60% кандидатов не откликаются из-за плохого описания</li>
            <li>⏱️ Среднее время чтения вакансии — 14 секунд</li>
            <li>🎯 Хорошее описание увеличивает качество откликов на 40%</li>
            <li>💰 Плохая вакансия увеличивает стоимость найма в 2-3 раза</li>
          </ul>
        </div>

        <h2
          id="mistakes"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          10 главных ошибок
        </h2>

        <div className="space-y-6 my-6">
          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              1. Размытые требования
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              ❌ Плохо: "Требуется опыт работы с современными технологиями"
            </p>
            <p className="text-sm text-green-600">
              ✅ Хорошо: "Требуется опыт работы с React 16+, TypeScript, Next.js
              от 2 лет"
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              2. Список из 20+ требований
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Кандидаты видят длинный список и думают: "Они ищут единорога".
              Результат — отказ от отклика.
            </p>
            <p className="text-sm text-green-600">
              ✅ Решение: Разделите на "Обязательно" (5-7 пунктов) и "Будет
              плюсом" (3-5 пунктов)
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              3. Отсутствие зарплатной вилки
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              "Зарплата по результатам собеседования" — главный способ потерять
              70% кандидатов.
            </p>
            <p className="text-sm text-green-600">
              ✅ Решение: Указывайте реальную вилку. Даже широкая вилка лучше,
              чем её отсутствие
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              4. Корпоративный жаргон
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              ❌ "Ищем проактивного team player с out-of-the-box thinking"
            </p>
            <p className="text-sm text-green-600">
              ✅ "Ищем инициативного разработчика, готового предлагать
              нестандартные решения"
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              5. Копипаста из старых вакансий
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Кандидаты видят одинаковые вакансии от разных компаний и теряют
              интерес.
            </p>
            <p className="text-sm text-green-600">
              ✅ Решение: Добавьте уникальные детали о проектах, команде,
              технологиях
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              6. Нет информации о компании
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Кандидаты хотят знать, куда они идут. Отсутствие информации
              вызывает подозрения.
            </p>
            <p className="text-sm text-green-600">
              ✅ Решение: 2-3 предложения о компании, продукте, команде
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              7. Фокус на обязанностях, а не на возможностях
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              ❌ "Вы будете писать код, исправлять баги, участвовать в митингах"
            </p>
            <p className="text-sm text-green-600">
              ✅ "Вы будете разрабатывать новые фичи для 1 млн пользователей,
              влиять на архитектуру продукта"
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              8. Игнорирование удалённой работы
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              В 2026 году 75% IT-специалистов ищут удалённую работу или гибрид.
            </p>
            <p className="text-sm text-green-600">
              ✅ Решение: Чётко укажите формат: офис/удалёнка/гибрид
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              9. Отсутствие призыва к действию
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Вакансия заканчивается списком требований. Кандидат не понимает,
              что делать дальше.
            </p>
            <p className="text-sm text-green-600">
              ✅ Решение: "Откликайтесь прямо сейчас — мы свяжемся в течение 24
              часов"
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              10. Дискриминационные формулировки
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              ❌ "Ищем молодого специалиста", "Желательно мужчина"
            </p>
            <p className="text-sm text-green-600">
              ✅ Решение: Фокус на навыках и опыте, а не на возрасте, поле,
              внешности
            </p>
          </div>
        </div>

        <h2
          id="examples"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Пример хорошей вакансии
        </h2>

        <div className="my-6 rounded-lg border border-green-500/30 bg-green-500/5 p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Senior Frontend Developer
          </h3>

          <div className="space-y-4 text-sm">
            <div>
              <p className="font-semibold text-foreground mb-2">О компании:</p>
              <p className="text-muted-foreground">
                Мы — финтех-стартап с 500K активных пользователей. Разрабатываем
                мобильное приложение для управления личными финансами. Команда
                25 человек, офис в Москве.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-2">
                Что предстоит делать:
              </p>
              <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                <li>
                  Разрабатывать новые фичи для веб-приложения (React +
                  TypeScript)
                </li>
                <li>Участвовать в архитектурных решениях и code review</li>
                <li>Оптимизировать производительность фронтенда</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-2">
                Обязательные требования:
              </p>
              <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                <li>Опыт с React 16+ и TypeScript от 3 лет</li>
                <li>
                  Знание современных подходов к state management (Redux, MobX,
                  Zustand)
                </li>
                <li>Опыт работы с REST API и WebSocket</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-2">
                Будет плюсом:
              </p>
              <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                <li>Опыт с Next.js</li>
                <li>Знание принципов UX/UI дизайна</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-2">Условия:</p>
              <ul className="list-disc ml-6 space-y-1 text-muted-foreground">
                <li>Зарплата: 250,000 - 350,000 ₽ на руки</li>
                <li>Формат: гибрид (2 дня в офисе, 3 дня удалённо)</li>
                <li>ДМС, корпоративное обучение, гибкий график</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="font-semibold text-green-600">
                Откликайтесь прямо сейчас — мы свяжемся в течение 24 часов!
              </p>
            </div>
          </div>
        </div>

        <h2
          id="checklist"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Чек-лист перед публикацией
        </h2>

        <div className="my-6 rounded-lg border border-border p-6">
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span className="text-sm">Указана зарплатная вилка</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span className="text-sm">
                Требования разделены на обязательные и желательные
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span className="text-sm">
                Есть информация о компании и продукте
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span className="text-sm">
                Указан формат работы (офис/удалёнка/гибрид)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span className="text-sm">
                Нет корпоративного жаргона и клише
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span className="text-sm">
                Фокус на возможностях, а не только на обязанностях
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span className="text-sm">Есть призыв к действию в конце</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span className="text-sm">
                Нет дискриминационных формулировок
              </span>
            </li>
          </ul>
        </div>

        <DocsCallout type="tip" title="Совет">
          Попросите коллегу или друга прочитать вакансию. Если они не понимают,
          чем будет заниматься человек и почему ему стоит откликнуться —
          переписывайте.
        </DocsCallout>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/help/knowledge-base"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            База знаний
          </Link>
          <Link
            href="/candidates"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Работа с кандидатами
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
