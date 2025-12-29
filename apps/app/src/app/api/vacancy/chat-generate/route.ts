import { AuditLoggerService } from "@qbs-autonaim/api";
import { db } from "@qbs-autonaim/db";
import { workspace, workspaceMember } from "@qbs-autonaim/db/schema";
import { streamText } from "@qbs-autonaim/lib/ai";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "~/auth/server";

interface VacancyDocument {
  title?: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  conditions?: string;
}

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

    // Парсинг входных данных
    const body = await request.json();
    const { workspaceId, message, currentDocument, conversationHistory } = body;

    if (!workspaceId || !message) {
      return NextResponse.json(
        { error: "Отсутствуют обязательные поля" },
        { status: 400 },
      );
    }

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
    try {
      const auditLogger = new AuditLoggerService(db);
      await auditLogger.logAccess({
        userId: session.user.id,
        action: "ACCESS",
        resourceType: "VACANCY",
        resourceId: workspaceId,
        metadata: {
          action: "vacancy_ai_generation_started",
          messageLength: message.length,
          hasConversationHistory: !!conversationHistory?.length,
        },
      });
    } catch (auditError) {
      // Логируем ошибку, но не блокируем основной поток
      console.error("Failed to log audit entry:", auditError);
    }

    // Генерация промпта
    const prompt = buildVacancyGenerationPrompt(
      message,
      currentDocument,
      conversationHistory,
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
    const encoder = new TextEncoder();
    let fullText = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            fullText += chunk;

            // Отправляем chunk клиенту
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`),
            );
          }

          // Парсим финальный JSON
          const jsonMatch = fullText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const document = {
              title: parsed.title || currentDocument?.title || "",
              description:
                parsed.description || currentDocument?.description || "",
              requirements:
                parsed.requirements || currentDocument?.requirements || "",
              responsibilities:
                parsed.responsibilities ||
                currentDocument?.responsibilities ||
                "",
              conditions:
                parsed.conditions || currentDocument?.conditions || "",
            };

            // Отправляем финальный документ
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ document, done: true })}\n\n`,
              ),
            );
          } else {
            throw new Error("Invalid JSON response from AI");
          }

          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error:
                  error instanceof Error ? error.message : "Ошибка генерации",
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
