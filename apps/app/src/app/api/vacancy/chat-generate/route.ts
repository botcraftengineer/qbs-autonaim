import { AuditLoggerService } from "@qbs-autonaim/api";
import { db } from "@qbs-autonaim/db";
import {
  companySettings,
  workspace,
  workspaceMember,
} from "@qbs-autonaim/db/schema";
import {
  checkRateLimit,
  sanitizeConversationMessage,
  sanitizePromptText,
  truncateText,
} from "@qbs-autonaim/lib";
import { streamText } from "@qbs-autonaim/lib/ai";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "~/auth/server";

interface VacancyDocument {
  title?: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  conditions?: string;
  customBotInstructions?: string;
  customScreeningPrompt?: string;
  customInterviewQuestions?: string;
  customOrganizationalQuestions?: string;
}

/**
 * Извлекает частичные данные из незавершённого JSON-стрима
 * Использует regex для извлечения завершённых полей
 */
function extractPartialDocument(
  text: string,
  fallback?: VacancyDocument,
): VacancyDocument {
  const result: VacancyDocument = { ...fallback };

  // Убираем markdown-обёртку если есть
  const cleanText = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  // Извлекаем каждое поле отдельно с помощью regex
  const fields = [
    "title",
    "description",
    "requirements",
    "responsibilities",
    "conditions",
    "customBotInstructions",
    "customScreeningPrompt",
    "customInterviewQuestions",
    "customOrganizationalQuestions",
  ] as const;

  for (const field of fields) {
    // Ищем паттерн "field": "value" или "field": "value...
    // Поддерживаем многострочные значения
    const regex = new RegExp(
      `"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)(?:"|$)`,
      "s",
    );
    const match = cleanText.match(regex);
    if (match?.[1]) {
      // Декодируем escape-последовательности
      try {
        result[field] = JSON.parse(`"${match[1]}"`);
      } catch {
        // Если не удалось распарсить, используем как есть
        result[field] = match[1]
          .replace(/\\n/g, "\n")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\");
      }
    }
  }

  return result;
}

/**
 * Пытается распарсить полный JSON, с fallback на частичное извлечение
 */
function parseVacancyJSON(
  text: string,
  fallback?: VacancyDocument,
): { document: VacancyDocument; isComplete: boolean } {
  // Убираем markdown-обёртку
  let cleanText = text.trim();
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.slice(7);
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.slice(3);
  }
  if (cleanText.endsWith("```")) {
    cleanText = cleanText.slice(0, -3);
  }
  cleanText = cleanText.trim();

  // Находим JSON-объект
  const startIndex = cleanText.indexOf("{");
  if (startIndex === -1) {
    return {
      document: extractPartialDocument(text, fallback),
      isComplete: false,
    };
  }

  // Ищем закрывающую скобку
  let braceCount = 0;
  let endIndex = -1;

  for (let i = startIndex; i < cleanText.length; i++) {
    const char = cleanText[i];
    if (char === "{") braceCount++;
    else if (char === "}") {
      braceCount--;
      if (braceCount === 0) {
        endIndex = i;
        break;
      }
    }
  }

  // Если JSON не завершён, извлекаем частичные данные
  if (endIndex === -1) {
    return {
      document: extractPartialDocument(cleanText, fallback),
      isComplete: false,
    };
  }

  const jsonText = cleanText.substring(startIndex, endIndex + 1);

  try {
    const parsed = JSON.parse(jsonText);
    return {
      document: validateAndNormalizeDocument(parsed, fallback),
      isComplete: true,
    };
  } catch {
    // Если парсинг не удался, извлекаем частичные данные
    return {
      document: extractPartialDocument(cleanText, fallback),
      isComplete: false,
    };
  }
}

/**
 * Валидирует и нормализует документ вакансии
 * Применяет значения по умолчанию и проверяет типы
 */
function validateAndNormalizeDocument(
  parsed: unknown,
  fallbackDocument?: VacancyDocument,
): VacancyDocument {
  // Проверяем, что parsed - это объект
  if (!parsed || typeof parsed !== "object") {
    return {
      title: fallbackDocument?.title || "",
      description: fallbackDocument?.description || "",
      requirements: fallbackDocument?.requirements || "",
      responsibilities: fallbackDocument?.responsibilities || "",
      conditions: fallbackDocument?.conditions || "",
    };
  }

  const data = parsed as Record<string, unknown>;

  // Безопасно извлекаем строковые поля с fallback значениями
  const getString = (key: string, fallback: string = ""): string => {
    const value = data[key];
    return typeof value === "string" ? value : fallback;
  };

  return {
    title: getString("title", fallbackDocument?.title || ""),
    description: getString("description", fallbackDocument?.description || ""),
    requirements: getString(
      "requirements",
      fallbackDocument?.requirements || "",
    ),
    responsibilities: getString(
      "responsibilities",
      fallbackDocument?.responsibilities || "",
    ),
    conditions: getString("conditions", fallbackDocument?.conditions || ""),
    customBotInstructions: getString(
      "customBotInstructions",
      fallbackDocument?.customBotInstructions || "",
    ),
    customScreeningPrompt: getString(
      "customScreeningPrompt",
      fallbackDocument?.customScreeningPrompt || "",
    ),
    customInterviewQuestions: getString(
      "customInterviewQuestions",
      fallbackDocument?.customInterviewQuestions || "",
    ),
    customOrganizationalQuestions: getString(
      "customOrganizationalQuestions",
      fallbackDocument?.customOrganizationalQuestions || "",
    ),
  };
}

// Zod схема для валидации входных данных
const vacancyChatRequestSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId обязателен"),
  message: z
    .string()
    .min(1, "Сообщение не может быть пустым")
    .max(5000, "Сообщение не может превышать 5000 символов"),
  currentDocument: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      requirements: z.string().optional(),
      responsibilities: z.string().optional(),
      conditions: z.string().optional(),
      customBotInstructions: z.string().optional(),
      customScreeningPrompt: z.string().optional(),
      customInterviewQuestions: z.string().optional(),
      customOrganizationalQuestions: z.string().optional(),
    })
    .optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .max(10, "История диалога не может содержать более 10 сообщений")
    .optional(),
});

function buildVacancyGenerationPrompt(
  message: string,
  currentDocument?: VacancyDocument,
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>,
  companySettings?: {
    name: string;
    description?: string | null;
    website?: string | null;
    botName?: string | null;
    botRole?: string | null;
  } | null,
): string {
  const historySection = conversationHistory?.length
    ? `
ИСТОРИЯ ДИАЛОГА:
${conversationHistory
  .map(
    (msg) =>
      `${msg.role === "user" ? "Пользователь" : "Ассистент"}: ${msg.content}`,
  )
  .join("\n")}
`
    : "";

  const documentSection = currentDocument
    ? `
ТЕКУЩИЙ ДОКУМЕНТ ВАКАНСИИ:
${currentDocument.title ? `Название: ${currentDocument.title}` : ""}
${currentDocument.description ? `Описание: ${currentDocument.description}` : ""}
${currentDocument.requirements ? `Требования:\n${currentDocument.requirements}` : ""}
${currentDocument.responsibilities ? `Обязанности:\n${currentDocument.responsibilities}` : ""}
${currentDocument.conditions ? `Условия:\n${currentDocument.conditions}` : ""}
${currentDocument.customBotInstructions ? `Инструкции для бота:\n${currentDocument.customBotInstructions}` : ""}
${currentDocument.customScreeningPrompt ? `Промпт для скрининга:\n${currentDocument.customScreeningPrompt}` : ""}
${currentDocument.customInterviewQuestions ? `Вопросы для интервью:\n${currentDocument.customInterviewQuestions}` : ""}
${currentDocument.customOrganizationalQuestions ? `Организационные вопросы:\n${currentDocument.customOrganizationalQuestions}` : ""}
`
    : "ТЕКУЩИЙ ДОКУМЕНТ: (пусто)";

  // Настройки компании для персонализации (Requirements 1.5, 7.1, 7.2)
  const companySection = companySettings
    ? `
НАСТРОЙКИ КОМПАНИИ:
Название компании: ${companySettings.name}
${companySettings.description ? `Описание компании: ${companySettings.description}` : ""}
${companySettings.website ? `Сайт: ${companySettings.website}` : ""}
${companySettings.botName ? `Имя бота-рекрутера: ${companySettings.botName}` : ""}
${companySettings.botRole ? `Роль бота: ${companySettings.botRole}` : ""}
`
    : "";

  const botPersonality =
    companySettings?.botName && companySettings?.botRole
      ? `Ты — ${companySettings.botName}, ${companySettings.botRole} компании "${companySettings.name}".`
      : companySettings?.name
        ? `Ты — эксперт по подбору персонала для компании "${companySettings.name}".`
        : "Ты — эксперт по подбору персонала и созданию вакансий.";

  const companyContext = companySettings?.description
    ? `\n\nКОНТЕКСТ КОМПАНИИ: ${companySettings.description}\nУчитывай специфику и потребности этой компании при создании вакансий.`
    : "";

  return `${botPersonality}

ЗАДАЧА: На основе сообщения пользователя обнови документ вакансии.${companyContext}
${companySection}${historySection}
НОВОЕ СООБЩЕНИЕ ПОЛЬЗОВАТЕЛЯ:
${message}
${documentSection}

ИНСТРУКЦИИ:
- Проанализируй сообщение пользователя и пойми, что он хочет добавить/изменить
${companySettings?.name ? `- Учитывай специфику и потребности компании "${companySettings.name}"` : ""}
- Обнови соответствующие разделы документа
- Если пользователь указывает название должности - обнови title
- Если описывает компанию/проект - обнови description
- Если перечисляет требования к кандидату - обнови requirements
- Если описывает обязанности - обнови responsibilities
- Если говорит о зарплате/условиях - обнови conditions
- Если просит настроить бота для интервью - обнови customBotInstructions (Requirements 5.1)
- Если просит настроить скрининг - обнови customScreeningPrompt (Requirements 5.2)
- Если просит добавить вопросы для интервью - обнови customInterviewQuestions (Requirements 5.3)
- Если просит добавить организационные вопросы - обнови customOrganizationalQuestions (Requirements 5.4)
- Сохрани существующую информацию, если пользователь не просит её изменить
- Используй профессиональный язык
- Структурируй списки с помощью маркеров или нумерации

НАСТРОЙКИ БОТА (когда пользователь просит):
- customBotInstructions: Инструкции для бота-интервьюера (как вести себя, на что обращать внимание, стиль общения)
- customScreeningPrompt: Промпт для первичного скрининга кандидатов (критерии отбора, что проверять в первую очередь)
- customInterviewQuestions: Вопросы для технического/профессионального интервью (конкретные вопросы по навыкам и опыту)
- customOrganizationalQuestions: Вопросы об организационных моментах (график работы, удалёнка, релокация, командировки)

ФОРМАТ ОТВЕТА (JSON):
{
  "title": "Название должности",
  "description": "Описание компании и проекта",
  "requirements": "Требования к кандидату (список)",
  "responsibilities": "Обязанности (список)",
  "conditions": "Условия работы и зарплата",
  "customBotInstructions": "Инструкции для бота (если запрошено)",
  "customScreeningPrompt": "Промпт для скрининга (если запрошено)",
  "customInterviewQuestions": "Вопросы для интервью (если запрошено)",
  "customOrganizationalQuestions": "Организационные вопросы (если запрошено)"
}

ВАЖНО: Верни ТОЛЬКО валидный JSON без дополнительных пояснений.`;
}

export async function POST(request: Request) {
  let workspaceId: string | undefined;
  let userId: string | undefined;

  try {
    // Проверка авторизации (Requirements 12.1)
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    userId = session.user.id;

    // Парсинг и валидация входных данных (Requirements 12.3, 12.4)
    let body: unknown;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          error: "Ошибка парсинга запроса",
          details:
            parseError instanceof Error ? parseError.message : "Invalid JSON",
        },
        { status: 400 },
      );
    }

    const validationResult = vacancyChatRequestSchema.safeParse(body);

    if (!validationResult.success) {
      // Validation error (Requirements 8.3)
      return NextResponse.json(
        {
          error: "Ошибка валидации",
          details: validationResult.error.flatten(),
        },
        { status: 400 },
      );
    }

    const {
      workspaceId: wsId,
      message,
      currentDocument,
      conversationHistory,
    } = validationResult.data;

    workspaceId = wsId;

    // Rate limiting - проверяем до обращения к БД (Requirements 12.2)
    const rateLimitResult = checkRateLimit(workspaceId, 10, 60_000);
    if (!rateLimitResult.allowed) {
      const resetInSeconds = Math.ceil(
        (rateLimitResult.resetAt - Date.now()) / 1000,
      );
      return NextResponse.json(
        {
          error: "Превышен лимит запросов",
          retryAfter: resetInSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": resetInSeconds.toString(),
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
          },
        },
      );
    }

    // Санитизация входных данных
    const sanitizedMessage = truncateText(sanitizePromptText(message), 5000);
    const sanitizedHistory = conversationHistory
      ? conversationHistory
          .slice(0, 10)
          .map((msg) => sanitizeConversationMessage(msg))
      : undefined;

    // Проверка доступа к workspace (Requirements 12.2)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let workspaceData: any;
    try {
      workspaceData = await db.query.workspace.findFirst({
        where: eq(workspace.id, workspaceId),
        with: {
          members: {
            where: eq(workspaceMember.userId, session.user.id),
          },
        },
      });
    } catch (dbError) {
      console.error("Database error checking workspace access:", dbError);
      return NextResponse.json(
        { error: "Внутренняя ошибка сервера" },
        { status: 500 },
      );
    }

    if (
      !workspaceData ||
      !workspaceData.members ||
      workspaceData.members.length === 0
    ) {
      // Authorization error (Requirements 12.2)
      return NextResponse.json(
        { error: "Нет доступа к workspace" },
        { status: 403 },
      );
    }

    // Загружаем настройки компании для персонализации промпта (Requirements 1.5, 7.1)
    let companySettingsData = null;
    try {
      companySettingsData = await db.query.companySettings.findFirst({
        where: eq(companySettings.workspaceId, workspaceId),
      });
    } catch (dbError) {
      console.error("Database error loading company settings:", dbError);
      // Continue without company settings - not critical
      companySettingsData = null;
    }

    // Логирование начала AI генерации (Requirements 10.1)
    // Примечание: auditLog.resourceId ожидает UUID, но workspaceId имеет формат prefixed ID (ws_...)
    // Поэтому логируем в metadata, а resourceId оставляем пустым UUID
    try {
      const auditLogger = new AuditLoggerService(db);
      await auditLogger.logAccess({
        userId: session.user.id,
        action: "ACCESS",
        resourceType: "VACANCY",
        resourceId: "00000000-0000-0000-0000-000000000000", // placeholder UUID для AI генерации
        metadata: {
          action: "vacancy_ai_generation_started",
          workspaceId, // сохраняем prefixed ID в metadata
          messageLength: sanitizedMessage.length,
          hasConversationHistory: !!sanitizedHistory?.length,
        },
      });
    } catch (auditError) {
      // Логируем ошибку, но не блокируем основной поток
      console.error("Failed to log audit entry:", auditError);
    }

    // Генерация промпта с санитизированными данными и настройками компании
    const prompt = buildVacancyGenerationPrompt(
      sanitizedMessage,
      currentDocument,
      sanitizedHistory,
      companySettingsData,
    );

    // Запуск streaming генерации
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any;
    try {
      result = streamText({
        prompt,
        generationName: "vacancy-chat-streaming",
        entityId: workspaceId,
        metadata: {
          workspaceId,
          userId: session.user.id,
        },
      });
    } catch (aiError) {
      // AI generation error (Requirements 12.2)
      console.error("AI generation error:", aiError);

      // Log error to audit
      try {
        const auditLogger = new AuditLoggerService(db);
        await auditLogger.logAccess({
          userId: session.user.id,
          action: "ACCESS",
          resourceType: "VACANCY",
          resourceId: "00000000-0000-0000-0000-000000000000",
          metadata: {
            action: "vacancy_ai_generation_error",
            workspaceId,
            error:
              aiError instanceof Error ? aiError.message : "Unknown AI error",
          },
        });
      } catch (auditLogError) {
        console.error("Failed to log AI error:", auditLogError);
      }

      return NextResponse.json(
        { error: "Не удалось сгенерировать вакансию. Попробуйте позже." },
        { status: 500 },
      );
    }

    // Создание ReadableStream для передачи данных клиенту
    const encoder = new TextEncoder();
    let fullText = "";
    let lastSentDocument: VacancyDocument | null = null;
    let chunkCounter = 0;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            fullText += chunk;
            chunkCounter++;

            // Каждые 3 чанка отправляем частичный документ для real-time обновления
            if (chunkCounter % 3 === 0) {
              const { document: partialDoc } = parseVacancyJSON(
                fullText,
                currentDocument,
              );

              // Отправляем только если документ изменился
              const docString = JSON.stringify(partialDoc);
              const lastDocString = JSON.stringify(lastSentDocument);

              if (docString !== lastDocString) {
                lastSentDocument = partialDoc;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ document: partialDoc, partial: true })}\n\n`,
                  ),
                );
              }
            }
          }

          // Финальный парсинг
          const { document, isComplete } = parseVacancyJSON(
            fullText,
            currentDocument,
          );

          if (!isComplete) {
            console.warn("JSON parsing incomplete, using partial data");
          }

          // Отправляем финальный документ
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ document, done: true })}\n\n`,
            ),
          );

          // Log successful completion (Requirements 10.2)
          if (userId && workspaceId) {
            try {
              const auditLogger = new AuditLoggerService(db);
              await auditLogger.logAccess({
                userId,
                action: "ACCESS",
                resourceType: "VACANCY",
                resourceId: "00000000-0000-0000-0000-000000000000",
                metadata: {
                  action: "vacancy_ai_generation_completed",
                  workspaceId,
                  documentComplete: isComplete,
                  responseLength: fullText.length,
                },
              });
            } catch (auditLogError) {
              console.error("Failed to log completion:", auditLogError);
            }
          }

          controller.close();
        } catch (streamError) {
          console.error("Streaming error:", streamError);

          // Log streaming error (Requirements 10.3)
          if (userId && workspaceId) {
            try {
              const auditLogger = new AuditLoggerService(db);
              await auditLogger.logAccess({
                userId,
                action: "ACCESS",
                resourceType: "VACANCY",
                resourceId: "00000000-0000-0000-0000-000000000000",
                metadata: {
                  action: "vacancy_ai_generation_stream_error",
                  workspaceId,
                  error:
                    streamError instanceof Error
                      ? streamError.message
                      : "Unknown streaming error",
                },
              });
            } catch (auditLogError) {
              console.error("Failed to log streaming error:", auditLogError);
            }
          }

          // Пытаемся извлечь хоть что-то из накопленного текста
          const { document: recoveredDoc } = parseVacancyJSON(
            fullText,
            currentDocument,
          );

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                document: recoveredDoc,
                error:
                  streamError instanceof Error
                    ? streamError.message
                    : "Ошибка генерации",
                done: true,
              })}\n\n`,
            ),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    // Catch-all error handler (Requirements 12.2)
    console.error("API error:", error);

    // Log unexpected error (Requirements 10.3)
    if (userId && workspaceId) {
      try {
        const auditLogger = new AuditLoggerService(db);
        await auditLogger.logAccess({
          userId,
          action: "ACCESS",
          resourceType: "VACANCY",
          resourceId: "00000000-0000-0000-0000-000000000000",
          metadata: {
            action: "vacancy_ai_generation_unexpected_error",
            workspaceId,
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
          },
        });
      } catch (auditLogError) {
        console.error("Failed to log unexpected error:", auditLogError);
      }
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 },
    );
  }
}
