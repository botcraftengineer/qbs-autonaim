import { BASE_RULES } from "@qbs-autonaim/ai";
import {
  getInterviewSessionMetadata,
  updateInterviewSessionMetadata,
} from "@qbs-autonaim/shared";
import { z } from "zod";

type EntityType = "gig" | "vacancy" | "unknown";

type BotSettings = {
  botName?: string;
  botRole?: string;
  companyName?: string;
};

type InterviewContextLite = {
  botSettings?: BotSettings;
  candidateName?: string | null;
};

type GigLike = {
  title?: string | null;
  description?: string | null;
  type?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  estimatedDuration?: string | null;
  deadline?: Date | null;
  customBotInstructions?: string | null;
  customScreeningPrompt?: string | null;
  customOrganizationalQuestions?: string | null;
  customInterviewQuestions?: string | null;
  requirements?: unknown;
};

type VacancyLike = {
  title?: string | null;
  description?: string | null;
  region?: string | null;
  customBotInstructions?: string | null;
  customScreeningPrompt?: string | null;
  customOrganizationalQuestions?: string | null;
  customInterviewQuestions?: string | null;
  requirements?: unknown;
};

function parseQuestions(raw: string | null | undefined): string[] {
  if (!raw) return [];

  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean);
}

export function createWebInterviewRuntime(params: {
  sessionId: string;
  gig: GigLike | null;
  vacancy: VacancyLike | null;
  interviewContext: InterviewContextLite;
  isFirstResponse: boolean;
}): {
  tools: Record<
    string,
    {
      description: string;
      inputSchema: z.ZodTypeAny;
      execute: (args: any) => Promise<any>;
    }
  >;
  systemPrompt: string;
} {
  const { sessionId, gig, vacancy, interviewContext, isFirstResponse } = params;

  const entityType: EntityType = gig ? "gig" : vacancy ? "vacancy" : "unknown";

  const getInterviewSettings = {
    description:
      "Возвращает настройки интервью (gig/vacancy): инструкции бота, вопросы, ограничения, контекст задачи/вакансии, а также настройки бота компании.",
    inputSchema: z.object({}),
    execute: async () => {
      if (gig) {
        return {
          entityType: "gig" as const,
          botSettings: interviewContext.botSettings ?? null,
          candidateName: interviewContext.candidateName ?? null,
          title: gig.title ?? null,
          description: gig.description ?? null,
          type: gig.type ?? null,
          budgetMin: gig.budgetMin ?? null,
          budgetMax: gig.budgetMax ?? null,
          estimatedDuration: gig.estimatedDuration ?? null,
          deadline: gig.deadline ?? null,
          customBotInstructions: gig.customBotInstructions ?? null,
          customScreeningPrompt: gig.customScreeningPrompt ?? null,
          customOrganizationalQuestions: gig.customOrganizationalQuestions ?? null,
          customInterviewQuestions: gig.customInterviewQuestions ?? null,
          requirements: gig.requirements ?? null,
        };
      }

      if (vacancy) {
        return {
          entityType: "vacancy" as const,
          botSettings: interviewContext.botSettings ?? null,
          candidateName: interviewContext.candidateName ?? null,
          title: vacancy.title ?? null,
          description: vacancy.description ?? null,
          region: vacancy.region ?? null,
          customBotInstructions: vacancy.customBotInstructions ?? null,
          customScreeningPrompt: vacancy.customScreeningPrompt ?? null,
          customOrganizationalQuestions: vacancy.customOrganizationalQuestions ?? null,
          customInterviewQuestions: vacancy.customInterviewQuestions ?? null,
          requirements: vacancy.requirements ?? null,
        };
      }

      return {
        entityType: "unknown" as const,
        botSettings: interviewContext.botSettings ?? null,
        candidateName: interviewContext.candidateName ?? null,
      };
    },
  };

  const getInterviewPolicy = {
    description:
      "Возвращает правила проведения интервью для текущего типа сущности (gig/vacancy): какие темы разрешены/запрещены и на что делать фокус.",
    inputSchema: z.object({}),
    execute: async () => {
      if (entityType === "gig") {
        return {
          entityType,
          allowOrganizationalEmploymentQuestions: false,
          focusAreas: ["опыт", "навыки", "понимание задачи", "сроки", "оплата"],
          forbiddenTopics: ["зарплата", "график работы", "оформление", "отпуск"],
          allowedOrgTopics: [
            "оплата за задачу",
            "сроки",
            "дедлайн",
            "доступность",
            "процесс сдачи",
          ],
        };
      }

      if (entityType === "vacancy") {
        return {
          entityType,
          allowOrganizationalEmploymentQuestions: true,
          focusAreas: ["опыт", "навыки", "мотивация", "коммуникация"],
          forbiddenTopics: [],
          allowedOrgTopics: [
            "график",
            "зарплата",
            "формат работы",
            "дата выхода",
          ],
        };
      }

      return {
        entityType,
        allowOrganizationalEmploymentQuestions: true,
        focusAreas: ["опыт", "навыки"],
        forbiddenTopics: [],
        allowedOrgTopics: [],
      };
    },
  };

  const getInterviewQuestionBank = {
    description:
      "Возвращает нормализованный банк вопросов для интервью (организационные и технические) в виде массивов строк.",
    inputSchema: z.object({}),
    execute: async () => {
      const orgDefaults =
        entityType === "gig"
          ? [
              "Какую оплату за задание вы ожидаете?",
              "В какие сроки готовы выполнить?",
              "Есть ли другие проекты, которые могут повлиять на сроки?",
            ]
          : [
              "Какой график работы вам подходит?",
              "Какие ожидания по зарплате?",
              "Когда готовы приступить к работе?",
              "Какой формат работы предпочитаете?",
            ];

      const orgCustom = parseQuestions(
        (gig?.customOrganizationalQuestions ??
          vacancy?.customOrganizationalQuestions) ||
          null,
      );
      const techCustom = parseQuestions(
        (gig?.customInterviewQuestions ?? vacancy?.customInterviewQuestions) ||
          null,
      );

      return {
        entityType,
        organizational: orgCustom.length > 0 ? orgCustom : orgDefaults,
        technical: techCustom,
      };
    },
  };

  const getScoringRubric = {
    description:
      "Возвращает рубрику для внутренней оценки интервью. Можно использовать при итоговой оценке и для фиксации критериев в метаданных.",
    inputSchema: z.object({}),
    execute: async () => {
      const criteria =
        entityType === "gig"
          ? [
              {
                key: "relevance",
                title: "Релевантность опыта",
                description:
                  "Насколько опыт и примеры кандидата соответствуют задаче.",
                weight: 0.35,
              },
              {
                key: "execution",
                title: "Способ выполнения",
                description:
                  "Понимание задачи, подход, инструменты, готовность к выполнению.",
                weight: 0.3,
              },
              {
                key: "timeline_budget",
                title: "Сроки и ожидания по оплате",
                description:
                  "Адекватность сроков/оплаты и согласованность ожиданий.",
                weight: 0.2,
              },
              {
                key: "communication",
                title: "Коммуникация",
                description: "Ясность ответов, уточнения, структурность.",
                weight: 0.15,
              },
            ]
          : [
              {
                key: "completeness",
                title: "Полнота ответов",
                description:
                  "Насколько кандидат отвечает по существу и покрывает вопрос.",
                weight: 0.25,
              },
              {
                key: "relevance",
                title: "Релевантность опыта",
                description: "Соответствие опыта и навыков вакансии.",
                weight: 0.35,
              },
              {
                key: "motivation",
                title: "Мотивация",
                description: "Интерес к роли, осознанность выбора, ожидания.",
                weight: 0.2,
              },
              {
                key: "communication",
                title: "Коммуникация",
                description:
                  "Качество коммуникации, ясность и последовательность.",
                weight: 0.2,
              },
            ];

      const rubric = {
        version: "v1",
        entityType,
        criteria,
      };

      const metadata = await getInterviewSessionMetadata(sessionId);
      if (!metadata.interviewRubric) {
        await updateInterviewSessionMetadata(sessionId, {
          interviewRubric: rubric,
        });
      }

      return rubric;
    },
  };

  const saveInterviewNote = {
    description:
      "Сохраняет внутреннюю заметку/сигнал по интервью в метаданные interview session. Это НЕ отправляется кандидату.",
    inputSchema: z.object({
      type: z.enum(["note", "signal"]),
      content: z.string().min(1).max(2000),
      tag: z.string().max(50).optional(),
    }),
    execute: async ({ type, content, tag }: { type: "note" | "signal"; content: string; tag?: string }) => {
      const metadata = await getInterviewSessionMetadata(sessionId);
      const existing = metadata.interviewNotes ?? [];

      const next = [
        ...existing,
        {
          type,
          content,
          tag,
          timestamp: new Date().toISOString(),
        },
      ];

      const success = await updateInterviewSessionMetadata(sessionId, {
        interviewNotes: next,
      });

      return {
        success,
        count: next.length,
      };
    },
  };

  const tools = {
    getInterviewSettings,
    getInterviewPolicy,
    getInterviewQuestionBank,
    getScoringRubric,
    saveInterviewNote,
  };

  const systemPrompt = `${BASE_RULES}

Ты проводишь интервью в чате.

Используй инструменты:
- getInterviewSettings: получить настройки gig/vacancy и инструкции
- getInterviewPolicy: получить ограничения и фокус
- getInterviewQuestionBank: получить банк вопросов массивами
- getScoringRubric: получить рубрику оценки (и сохранить снапшот в метаданные)
- saveInterviewNote: сохранить внутреннюю заметку/сигнал (не показывать кандидату)

Если тебе нужна информация о вакансии/задании, инструкциях, списках вопросов или настройках компании, СНАЧАЛА вызови инструмент getInterviewSettings.

ПРАВИЛА:
- Не здоровайся заново.
- Пиши коротко и естественно.
- Задавай 1-2 вопроса за раз.
- Не используй нумерацию и списки.
- Не давай оценок кандидату и не озвучивай баллы.

${isFirstResponse ? "Это первый ответ после приветствия — начни интервью (и ОДИН раз предложи голосовые как опцию)." : "Продолжай интервью на основе истории."}`;

  return {
    tools,
    systemPrompt,
  };
}
