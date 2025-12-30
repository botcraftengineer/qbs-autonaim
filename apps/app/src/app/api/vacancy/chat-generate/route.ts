import { AuditLoggerService } from "@qbs-autonaim/api";
import { db } from "@qbs-autonaim/db";
import { workspace, workspaceMember } from "@qbs-autonaim/db/schema";
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
}

interface JSONExtractionResult {
  success: boolean;
  data?: VacancyDocument;
  error?: string;
  extractedText?: string;
}

/**
 * Извлекает сбалансированный JSON-объект из текста
 * Использует счётчик скобок для корректного определения границ объекта
 */
function extractBalancedJSON(text: string): JSONExtractionResult {
  // Находим первую открывающую скобку
  const startIndex = text.indexOf("{");
  if (startIndex === -1) {
    return {
      success: false,
      error: "JSON объект не найден в ответе AI",
    };
  }

  // Используем счётчик для поиска соответствующей закрывающей скобки
  let braceCount = 0;
  let endIndex = -1;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];
    if (char === "{") {
      braceCount++;
    } else if (char === "}") {
      braceCount--;
      if (braceCount === 0) {
        endIndex = i;
        break;
      }
    }
  }

  if (endIndex === -1) {
    return {
      success: false,
      error: "Незавершённый JSON объект в ответе AI",
    };
  }

  const jsonText = text.substring(startIndex, endIndex + 1);

  // Пытаемся распарсить извлечённый JSON
  try {
    const parsed = JSON.parse(jsonText);
    return {
      success: true,
      data: parsed,
      extractedText: jsonText,
    };
  } catch (parseError) {
    return {
      success: false,
      error: `Ошибка парсинга JSON: ${parseError instanceof Error ? parseError.message : "неизвестная ошибка"}`,
      extractedText: jsonText,
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
`
    : "ТЕКУЩИЙ ДОКУМЕНТ: (пусто)";

  return `Ты — эксперт по подбору персонала и созданию вакансий.

ЗАДАЧА: На основе сообщения пользователя обнови документ вакансии.
${historySection}
НОВОЕ СООБЩЕНИЕ ПОЛЬЗОВАТЕЛЯ:
${message}
${documentSection}

ИНСТРУКЦИИ:
- Проанализируй сообщение пользователя и пойми, что он хочет добавить/изменить
- Обнови соответствующие разделы документа
- Если пользователь указывает название должности - обнови title
- Если описывает компанию/проект - обнови description
- Если перечисляет требования к кандидату - обнови requirements
- Если описывает обязанности - обнови responsibilities
- Если говорит о зарплате/условиях - обнови conditions
- Сохрани существующую информацию, если пользователь не просит её изменить
- Используй профессиональный язык
- Структурируй списки с помощью маркеров или нумерации

ФОРМАТ ОТВЕТА (JSON):
{
  "title": "Название должности",
  "description": "Описание компании и проекта",
  "requirements": "Требования к кандидату (список)",
  "responsibilities": "Обязанности (список)",
  "conditions": "Условия работы и зарплата"
}

ВАЖНО: Верни ТОЛЬКО валидный JSON без дополнительных пояснений.`;
}

export async function POST(request: Request) {
  try {
    // Проверка авторизации
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Парсинг и валидация входных данных
    const body = await request.json();
    const validationResult = vacancyChatRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Ошибка валидации",
          details: validationResult.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { workspaceId, message, currentDocument, conversationHistory } =
      validationResult.data;

    // Rate limiting - проверяем до обращения к БД
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

    // Проверка доступа к workspace
    const workspaceData = await db.query.workspace.findFirst({
      where: eq(workspace.id, workspaceId),
      with: {
        members: {
          where: eq(workspaceMember.userId, session.user.id),
        },
      },
    });

    if (!workspaceData || workspaceData.members.length === 0) {
      return NextResponse.json(
        { error: "Нет доступа к workspace" },
        { status: 403 },
      );
    }

    // Логирование начала AI генерации
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

    // Генерация промпта с санитизированными данными
    const prompt = buildVacancyGenerationPrompt(
      sanitizedMessage,
      currentDocument,
      sanitizedHistory,
    );

    // Запуск streaming генерации
    const result = streamText({
      prompt,
      generationName: "vacancy-chat-streaming",
      entityId: workspaceId,
      metadata: {
        workspaceId,
        userId: session.user.id,
      },
    });

    // Создание ReadableStream для передачи данных клиенту
    // result.textStream уже является клоном, безопасным для потребления
    const encoder = new TextEncoder();
    let fullText = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Потребляем только наш клон потока (callerStream из ai-client.ts)
          // Второй клон (loggingStream) потребляется внутри streamText для Langfuse
          for await (const chunk of result.textStream) {
            fullText += chunk;

            // Отправляем chunk клиенту
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`),
            );
          }

          // Извлекаем и парсим финальный JSON с надёжной обработкой
          const extractionResult = extractBalancedJSON(fullText);

          if (!extractionResult.success) {
            // Отправляем частичные данные и информацию об ошибке
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  error: extractionResult.error,
                  rawText: fullText,
                  partialDocument: currentDocument || {},
                  done: true,
                })}\n\n`,
              ),
            );
            controller.close();
            return;
          }

          // Валидируем и нормализуем извлечённый документ
          const document = validateAndNormalizeDocument(
            extractionResult.data,
            currentDocument,
          );

          // Отправляем финальный документ
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ document, done: true })}\n\n`,
            ),
          );

          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          // Отправляем структурированную ошибку с контекстом
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error:
                  error instanceof Error ? error.message : "Ошибка генерации",
                rawText: fullText,
                partialDocument: currentDocument || {},
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
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 },
    );
  }
}
