import { Hono } from "hono";
import { z } from "zod";
import { botManager } from "../../bot-manager";

const app = new Hono();

const workspaceIdSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId не может быть пустым"),
});

/**
 * Запустить новую сессию для workspace
 * POST /sessions/start/:workspaceId
 */
app.post("/start/:workspaceId", async (c) => {
  const validation = workspaceIdSchema.safeParse(c.req.param());

  if (!validation.success) {
    return c.json(
      {
        success: false,
        message: "Невалидный workspaceId",
        errors: validation.error.issues,
      },
      400,
    );
  }

  const { workspaceId } = validation.data;

  try {
    if (botManager.isRunningForWorkspace(workspaceId)) {
      return c.json(
        {
          success: false,
          message: `Сессия для workspace ${workspaceId} уже запущена`,
        },
        400,
      );
    }

    await botManager.restartBot(workspaceId);

    return c.json({
      success: true,
      message: `Сессия для workspace ${workspaceId} успешно запущена`,
    });
  } catch (error) {
    console.error(`Ошибка запуска сессии для ${workspaceId}:`, error);
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Неизвестная ошибка",
      },
      500,
    );
  }
});

/**
 * Перезапустить сессию для workspace
 * POST /sessions/restart/:workspaceId
 */
app.post("/restart/:workspaceId", async (c) => {
  const validation = workspaceIdSchema.safeParse(c.req.param());

  if (!validation.success) {
    return c.json(
      {
        success: false,
        message: "Невалидный workspaceId",
        errors: validation.error.issues,
      },
      400,
    );
  }

  const { workspaceId } = validation.data;

  try {
    await botManager.restartBot(workspaceId);

    return c.json({
      success: true,
      message: `Сессия для workspace ${workspaceId} перезапущена`,
    });
  } catch (error) {
    console.error(`Ошибка перезапуска сессии для ${workspaceId}:`, error);
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Неизвестная ошибка",
      },
      500,
    );
  }
});

/**
 * Получить статус всех сессий
 * GET /sessions/status
 */
app.get("/status", (c) => {
  const bots = botManager.getBotsInfo();

  return c.json({
    count: bots.length,
    sessions: bots.map((bot) => ({
      workspaceId: bot.workspaceId,
      sessionId: bot.sessionId,
      userId: bot.userId,
      username: bot.username,
      phone: bot.phone,
    })),
  });
});

/**
 * Проверить статус конкретной сессии
 * GET /sessions/status/:workspaceId
 */
app.get("/status/:workspaceId", (c) => {
  const validation = workspaceIdSchema.safeParse(c.req.param());

  if (!validation.success) {
    return c.json(
      {
        success: false,
        message: "Невалидный workspaceId",
        errors: validation.error.issues,
      },
      400,
    );
  }

  const { workspaceId } = validation.data;
  const isRunning = botManager.isRunningForWorkspace(workspaceId);

  if (!isRunning) {
    return c.json(
      {
        success: false,
        message: `Сессия для workspace ${workspaceId} не запущена`,
      },
      404,
    );
  }

  const bots = botManager.getBotsInfo();
  const bot = bots.find((b) => b.workspaceId === workspaceId);

  return c.json({
    success: true,
    session: bot,
  });
});

/**
 * Синхронизировать сессии с БД (запустить только новые)
 * POST /sessions/sync
 */
app.post("/sync", async (c) => {
  try {
    const result = await botManager.startNewSessions();

    return c.json({
      success: true,
      message: "Синхронизация выполнена",
      started: result.started,
      failed: result.failed,
      total: botManager.getBotsCount(),
    });
  } catch (error) {
    console.error("Ошибка синхронизации сессий:", error);
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Неизвестная ошибка",
      },
      500,
    );
  }
});

export default app;
