import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";

export default function PhrasesThatScareCandidatesPage() {
  const tocItems = [
    { id: "intro", title: "Почему это важно", level: 2 },
    { id: "phrases", title: "5 опасных фраз", level: 2 },
    { id: "alternatives", title: "Что писать вместо", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "База знаний", href: "/help/knowledge-base" },
            { title: "5 фраз, которые отпугивают кандидатов" },
          ]}
        />

        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
            Полезные советы
          </span>
          <span className="text-sm text-muted-foreground">4 мин чтения</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          5 фраз, которые отпугивают кандидатов
        </h1>

        <p className="text-lg text-muted-foreground mb-8">
          Что не стоит писать в вакансиях, если хотите получать качественные
          отклики
        </p>

        <h2
          id="intro"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Почему слова имеют значение
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Одна неудачная фраза может стоить вам десятков хороших кандидатов.
          Люди читают между строк и делают выводы о компании по тому, как
          написана вакансия.
        </p>

        <h2
          id="phrases"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          5 фраз-убийц откликов
        </h2>

        <div className="space-y-6 my-6">
          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              1. "Зарплата по результатам собеседования"
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              ❌ Что слышит кандидат: "Мы не хотим платить рыночную зарплату"
            </p>
            <p className="text-sm text-green-600">
              ✅ Что писать: "Зарплата 150,000 - 250,000 ₽ в зависимости от
              опыта"
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              2. "Мы как одна большая семья"
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              ❌ Что слышит кандидат: "Здесь нет границ между работой и личной
              жизнью"
            </p>
            <p className="text-sm text-green-600">
              ✅ Что писать: "Дружная команда с уважением к work-life balance"
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              3. "Ищем стрессоустойчивого кандидата"
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              ❌ Что слышит кандидат: "Здесь постоянный хаос и переработки"
            </p>
            <p className="text-sm text-green-600">
              ✅ Что писать: "Умение работать в динамичной среде и расставлять
              приоритеты"
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              4. "Молодой и амбициозный кандидат"
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              ❌ Что слышит кандидат: "Мы дискриминируем по возрасту"
            </p>
            <p className="text-sm text-green-600">
              ✅ Что писать: "Кандидат с желанием развиваться и достигать целей"
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="font-semibold text-foreground mb-2">
              5. "Гибкий график (иногда по выходным)"
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              ❌ Что слышит кандидат: "Придётся работать по выходным без
              доплаты"
            </p>
            <p className="text-sm text-green-600">
              ✅ Что писать: "График 5/2, редкие дежурства по выходным с
              компенсацией"
            </p>
          </div>
        </div>

        <h2
          id="alternatives"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Общие правила формулировок
        </h2>

        <ul className="space-y-3 mb-6">
          <li>
            <strong className="font-semibold text-foreground">
              Будьте конкретны
            </strong>{" "}
            — вместо "конкурентная зарплата" укажите цифры
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Избегайте клише
            </strong>{" "}
            — "проактивный team player" ничего не значит
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Говорите правду
            </strong>{" "}
            — приукрашивание вскроется на интервью
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Фокус на возможностях
            </strong>{" "}
            — что кандидат получит, а не только что должен делать
          </li>
        </ul>

        <DocsCallout type="tip" title="Совет">
          Покажите вакансию коллеге или другу. Если они морщатся при чтении
          какой-то фразы — переписывайте.
        </DocsCallout>

        <div className="my-6 rounded-lg border border-green-500/30 bg-green-500/5 p-6">
          <h3 className="font-semibold text-foreground mb-3">
            Чек-лист перед публикацией:
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Указана конкретная зарплатная вилка</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Нет клише и корпоративного жаргона</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Честно описаны условия работы</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Нет дискриминационных формулировок</span>
            </li>
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
            href="/help/knowledge-base/articles/job-description-mistakes"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Ошибки в вакансиях
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
