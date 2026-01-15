import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";

export default function CoverLettersGuidePage() {
  const tocItems = [
    { id: "debate", title: "Спор о письмах", level: 2 },
    { id: "when-read", title: "Когда читать", level: 2 },
    { id: "when-skip", title: "Когда пропускать", level: 2 },
    { id: "red-flags", title: "Красные флаги", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "База знаний", href: "/help/knowledge-base" },
            { title: "Сопроводительные письма: читать или нет" },
          ]}
        />

        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
            Полезные советы
          </span>
          <span className="text-sm text-muted-foreground">5 мин чтения</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Сопроводительные письма: читать или нет
        </h1>

        <p className="text-lg text-muted-foreground mb-8">
          Практическое руководство по работе с cover letters в процессе найма
        </p>

        <h2
          id="debate"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Спор о сопроводительных письмах
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Сопроводительные письма — один из самых спорных элементов в
          рекрутинге. Одни считают их устаревшим формализмом, другие — важным
          источником информации о кандидате.
        </p>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3">
            Статистика показывает:
          </h3>
          <ul className="space-y-2 text-sm">
            <li>📊 26% рекрутеров считают cover letter важным фактором</li>
            <li>⏱️ В среднем рекрутер тратит 30 секунд на чтение письма</li>
            <li>✍️ 45% кандидатов не пишут сопроводительные письма</li>
            <li>🎯 Качественное письмо может увеличить шансы на 40%</li>
          </ul>
        </div>

        <h2
          id="when-read"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Когда стоит читать cover letter
        </h2>

        <div className="space-y-4 my-6">
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-2">
              Смена карьерного трека
            </h3>
            <p className="text-sm text-muted-foreground">
              Когда кандидат переходит из одной индустрии в другую, письмо
              помогает понять мотивацию и как прошлый опыт применим к новой
              роли.
            </p>
          </div>

          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-2">
              Большие пробелы в резюме
            </h3>
            <p className="text-sm text-muted-foreground">
              Письмо может объяснить перерывы в карьере (учёба, семейные
              обстоятельства, путешествия, фриланс).
            </p>
          </div>

          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-2">
              Креативные и коммуникационные роли
            </h3>
            <p className="text-sm text-muted-foreground">
              Для копирайтеров, маркетологов, PR-специалистов письмо — это
              демонстрация навыков письменной коммуникации.
            </p>
          </div>

          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-2">
              Удалённые позиции
            </h3>
            <p className="text-sm text-muted-foreground">
              Письмо показывает способность кандидата к письменной коммуникации,
              что критично для удалённой работы.
            </p>
          </div>

          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-2">
              Нестандартные кандидаты
            </h3>
            <p className="text-sm text-muted-foreground">
              Самоучки, кандидаты без профильного образования могут объяснить
              свой путь и компенсировать формальные требования.
            </p>
          </div>
        </div>

        <h2
          id="when-skip"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Когда можно пропустить
        </h2>

        <div className="space-y-4 my-6">
          <div className="border-l-4 border-muted-foreground/30 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Массовый найм
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              При найме большого количества людей на типовые позиции (продавцы,
              операторы) письма редко добавляют ценности.
            </p>
          </div>

          <div className="border-l-4 border-muted-foreground/30 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Технические специалисты
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Для разработчиков, аналитиков, инженеров важнее портфолио, GitHub,
              тестовое задание, чем письмо.
            </p>
          </div>

          <div className="border-l-4 border-muted-foreground/30 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Линейное резюме
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Если карьерный путь понятен и логичен, письмо вряд ли добавит
              новой информации.
            </p>
          </div>

          <div className="border-l-4 border-muted-foreground/30 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              Внутренние кандидаты
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Вы уже знаете человека, его работу и мотивацию — письмо избыточно.
            </p>
          </div>
        </div>

        <DocsCallout type="tip" title="Совет">
          Сделайте cover letter опциональным, но укажите, что качественное
          письмо будет плюсом. Так вы не отпугнёте кандидатов, но получите
          ценную информацию от тех, кто готов приложить усилия.
        </DocsCallout>

        <h2
          id="red-flags"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Красные флаги в сопроводительных письмах
        </h2>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3">
            На что обратить внимание:
          </h3>
          <ul className="space-y-2 text-sm">
            <li>🚩 Шаблонное письмо без упоминания компании или позиции</li>
            <li>
              🚩 Грамматические ошибки и опечатки (особенно в названии компании)
            </li>
            <li>🚩 Копипаста из резюме без новой информации</li>
            <li>🚩 Слишком длинное письмо (больше 1 страницы)</li>
            <li>🚩 Фокус на том, что компания даст кандидату, а не наоборот</li>
            <li>🚩 Негатив о предыдущих работодателях</li>
            <li>
              🚩 Неуместный тон (слишком фамильярный или наоборот формальный)
            </li>
          </ul>
        </div>

        <DocsCallout type="warning" title="Важно">
          Если вы требуете cover letter, обязательно читайте его. Игнорирование
          обязательного элемента заявки демотивирует кандидатов и портит
          впечатление о компании.
        </DocsCallout>

        <div className="my-6 rounded-lg border border-border p-6 bg-primary/5">
          <h3 className="font-semibold text-foreground mb-3">
            Что искать в хорошем письме:
          </h3>
          <ul className="space-y-2 text-sm">
            <li>✅ Конкретные примеры достижений</li>
            <li>✅ Понимание компании и её продукта</li>
            <li>✅ Ясная мотивация для перехода</li>
            <li>✅ Связь между опытом и требованиями вакансии</li>
            <li>✅ Личность и стиль коммуникации</li>
            <li>✅ Энтузиазм и искренний интерес</li>
          </ul>
        </div>

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
            href="/help/knowledge-base/articles/checking-candidate-references"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Проверка рекомендаций
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
