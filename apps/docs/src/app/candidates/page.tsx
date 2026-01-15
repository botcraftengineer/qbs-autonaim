import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCard } from "@/components/docs/docs-card";
import { DocsToc } from "@/components/docs/docs-toc";
import { DocsCallout } from "@/components/docs/docs-callout";
import { ScanSearch, Target, GitBranch } from "lucide-react";
import Link from "next/link";

export default function CandidatesPage() {
  const tocItems = [
    { id: "overview", title: "Обзор возможностей", level: 2 },
    { id: "workflow", title: "Рабочий процесс", level: 2 },
    { id: "sections", title: "Разделы", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[{ title: "Работа с кандидатами" }, { title: "Обзор" }]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">
            Работа с кандидатами
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Работа с кандидатами
        </h1>

        <p className="text-lg">
          Узнайте, как QBS Автонайм помогает автоматизировать работу с
          кандидатами — от первичного скрининга до финального отбора.
        </p>

        <h2
          id="overview"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Обзор возможностей
        </h2>

        <p>
          QBS Автонайм предоставляет полный набор инструментов для эффективной
          работы с кандидатами на каждом этапе воронки найма:
        </p>

        <ul>
          <li>
            <strong className="font-semibold text-foreground">
              AI-скрининг
            </strong>{" "}
            — автоматический анализ резюме и определение соответствия
            требованиям
          </li>
          <li>
            <strong className="font-semibold text-foreground">Скоринг</strong> —
            числовая оценка кандидатов по настраиваемым критериям
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Воронка найма
            </strong>{" "}
            — визуальное управление этапами отбора
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Массовые операции
            </strong>{" "}
            — работа с группами кандидатов одновременно
          </li>
        </ul>

        <DocsCallout type="tip" title="Совет">
          Начните с настройки критериев скрининга для каждой вакансии — это
          позволит AI точнее оценивать кандидатов и экономить ваше время.
        </DocsCallout>

        <h2
          id="workflow"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Рабочий процесс
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Типичный процесс работы с кандидатами в QBS Автонайм выглядит
          следующим образом:
        </p>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li>
            <strong className="font-semibold text-foreground">
              Поступление отклика
            </strong>{" "}
            — кандидат откликается на вакансию или резюме импортируется из
            внешнего источника
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              AI-скрининг
            </strong>{" "}
            — система автоматически анализирует резюме и определяет
            релевантность
          </li>
          <li>
            <strong className="font-semibold text-foreground">Скоринг</strong> —
            кандидату присваивается балл на основе соответствия критериям
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Сортировка
            </strong>{" "}
            — кандидаты распределяются по категориям (подходит / требует
            внимания / не подходит)
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Коммуникация
            </strong>{" "}
            — AI-ассистент связывается с подходящими кандидатами
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Продвижение по воронке
            </strong>{" "}
            — вы управляете переходом кандидатов между этапами
          </li>
        </ol>

        <h2
          id="sections"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Разделы
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Подробная информация о каждом аспекте работы с кандидатами:
        </p>

        <div className="grid gap-4 sm:grid-cols-1 my-6">
          <DocsCard
            title="AI-скрининг"
            description="Автоматический анализ резюме с помощью искусственного интеллекта. Настройка критериев, обработка большого объёма откликов."
            href="/candidates/screening"
            icon={<ScanSearch className="h-5 w-5" />}
          />
          <DocsCard
            title="Скоринг кандидатов"
            description="Система оценки кандидатов по баллам. Настройка весов критериев, интерпретация результатов."
            href="/candidates/scoring"
            icon={<Target className="h-5 w-5" />}
          />
          <DocsCard
            title="Воронка найма"
            description="Визуальное управление этапами отбора. Настройка пайплайна, массовые действия, автоматические переходы."
            href="/candidates/pipeline"
            icon={<GitBranch className="h-5 w-5" />}
          />
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/glossary"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Глоссарий
          </Link>
          <Link
            href="/candidates/screening"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            AI-скрининг
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
