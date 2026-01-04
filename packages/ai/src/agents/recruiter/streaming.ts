/**
 * Streaming Response для AI-ассистента рекрутера
 * Реализует streaming через SSE с промежуточными обновлениями для multi-step actions
 */

import type {
  AgentTraceEntry,
  ExecutedAction,
  RecruiterIntent,
  RecruiterOrchestratorOutput,
} from "./types";

/**
 * Типы событий для streaming
 */
export type StreamEventType =
  | "start"
  | "intent"
  | "action_start"
  | "action_progress"
  | "action_complete"
  | "text_chunk"
  | "complete"
  | "error";

/**
 * Базовое событие streaming
 */
export interface StreamEvent {
  type: StreamEventType;
  timestamp: Date;
}

/**
 * Событие начала обработки
 */
export interface StartEvent extends StreamEvent {
  type: "start";
  message: string;
}

/**
 * Событие определения намерения
 */
export interface IntentEvent extends StreamEvent {
  type: "intent";
  intent: RecruiterIntent;
  confidence: number;
}

/**
 * Событие начала действия
 */
export interface ActionStartEvent extends StreamEvent {
  type: "action_start";
  actionId: string;
  actionType: string;
  description: string;
}

/**
 * Событие прогресса действия
 */
export interface ActionProgressEvent extends StreamEvent {
  type: "action_progress";
  actionId: string;
  progress: number; // 0-100
  message: string;
}

/**
 * Событие завершения действия
 */
export interface ActionCompleteEvent extends StreamEvent {
  type: "action_complete";
  action: ExecutedAction;
}

/**
 * Событие текстового чанка
 */
export interface TextChunkEvent extends StreamEvent {
  type: "text_chunk";
  chunk: string;
  isPartial: boolean;
}

/**
 * Событие завершения
 */
export interface CompleteEvent extends StreamEvent {
  type: "complete";
  output: RecruiterOrchestratorOutput;
}

/**
 * Событие ошибки
 */
export interface ErrorEvent extends StreamEvent {
  type: "error";
  error: string;
  code?: string;
}

/**
 * Объединенный тип всех событий
 */
export type RecruiterStreamEvent =
  | StartEvent
  | IntentEvent
  | ActionStartEvent
  | ActionProgressEvent
  | ActionCompleteEvent
  | TextChunkEvent
  | CompleteEvent
  | ErrorEvent;

/**
 * Callback для обработки событий streaming
 */
export type StreamEventCallback = (event: RecruiterStreamEvent) => void;

/**
 * Класс для управления streaming ответами
 */
export class RecruiterStreamingResponse {
  private events: RecruiterStreamEvent[] = [];
  private callbacks: StreamEventCallback[] = [];
  private isComplete = false;
  private textBuffer = "";

  /**
   * Подписаться на события
   */
  subscribe(callback: StreamEventCallback): () => void {
    this.callbacks.push(callback);

    // Отправляем все накопленные события новому подписчику
    for (const event of this.events) {
      callback(event);
    }

    // Возвращаем функцию отписки
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Отправить событие всем подписчикам
   */
  private emit(event: RecruiterStreamEvent): void {
    this.events.push(event);
    for (const callback of this.callbacks) {
      try {
        callback(event);
      } catch (error) {
        console.error("[RecruiterStreaming] Callback error:", error);
      }
    }
  }

  /**
   * Начать обработку
   */
  start(message: string): void {
    this.emit({
      type: "start",
      timestamp: new Date(),
      message,
    });
  }

  /**
   * Отправить событие определения намерения
   */
  emitIntent(intent: RecruiterIntent, confidence: number): void {
    this.emit({
      type: "intent",
      timestamp: new Date(),
      intent,
      confidence,
    });
  }

  /**
   * Начать действие
   */
  startAction(actionId: string, actionType: string, description: string): void {
    this.emit({
      type: "action_start",
      timestamp: new Date(),
      actionId,
      actionType,
      description,
    });
  }

  /**
   * Обновить прогресс действия
   */
  updateActionProgress(
    actionId: string,
    progress: number,
    message: string,
  ): void {
    this.emit({
      type: "action_progress",
      timestamp: new Date(),
      actionId,
      progress: Math.min(100, Math.max(0, progress)),
      message,
    });
  }

  /**
   * Завершить действие
   */
  completeAction(action: ExecutedAction): void {
    this.emit({
      type: "action_complete",
      timestamp: new Date(),
      action,
    });
  }

  /**
   * Отправить текстовый чанк
   */
  emitTextChunk(chunk: string, isPartial = true): void {
    this.textBuffer += chunk;
    this.emit({
      type: "text_chunk",
      timestamp: new Date(),
      chunk,
      isPartial,
    });
  }

  /**
   * Завершить streaming
   */
  complete(output: RecruiterOrchestratorOutput): void {
    if (this.isComplete) return;

    this.isComplete = true;
    this.emit({
      type: "complete",
      timestamp: new Date(),
      output,
    });
  }

  /**
   * Отправить ошибку
   */
  error(error: string, code?: string): void {
    this.emit({
      type: "error",
      timestamp: new Date(),
      error,
      code,
    });
  }

  /**
   * Получить накопленный текст
   */
  getTextBuffer(): string {
    return this.textBuffer;
  }

  /**
   * Получить все события
   */
  getEvents(): RecruiterStreamEvent[] {
    return [...this.events];
  }

  /**
   * Проверить, завершен ли streaming
   */
  isCompleted(): boolean {
    return this.isComplete;
  }
}

/**
 * Создает SSE-совместимый поток из RecruiterStreamingResponse
 */
export function createSSEStream(
  response: RecruiterStreamingResponse,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      const unsubscribe = response.subscribe((event) => {
        const data = JSON.stringify(event);
        const sseMessage = `data: ${data}\n\n`;
        controller.enqueue(encoder.encode(sseMessage));

        if (event.type === "complete" || event.type === "error") {
          controller.close();
        }
      });

      // Cleanup при закрытии
      return () => {
        unsubscribe();
      };
    },
  });
}

/**
 * Форматирует событие для SSE
 */
export function formatSSEEvent(event: RecruiterStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Парсит SSE событие
 */
export function parseSSEEvent(data: string): RecruiterStreamEvent | null {
  try {
    const jsonStr = data.replace(/^data: /, "").trim();
    if (!jsonStr || jsonStr === "[DONE]") return null;

    const parsed = JSON.parse(jsonStr);
    // Восстанавливаем Date объекты
    if (parsed.timestamp) {
      parsed.timestamp = new Date(parsed.timestamp);
    }
    if (parsed.action?.timestamp) {
      parsed.action.timestamp = new Date(parsed.action.timestamp);
    }
    if (parsed.action?.undoDeadline) {
      parsed.action.undoDeadline = new Date(parsed.action.undoDeadline);
    }
    return parsed as RecruiterStreamEvent;
  } catch {
    return null;
  }
}

/**
 * Хелпер для создания action chain с streaming
 */
export class ActionChainBuilder {
  private actions: ExecutedAction[] = [];
  private agentTrace: AgentTraceEntry[] = [];
  private streaming: RecruiterStreamingResponse;

  constructor(streaming: RecruiterStreamingResponse) {
    this.streaming = streaming;
  }

  /**
   * Добавить действие в цепочку
   */
  async addAction(
    type: string,
    params: Record<string, unknown>,
    executor: () => Promise<{
      result: "success" | "failed" | "pending_approval";
      explanation: string;
    }>,
  ): Promise<ExecutedAction> {
    const actionId = crypto.randomUUID();

    // Начинаем действие
    this.streaming.startAction(actionId, type, `Выполняю: ${type}`);

    // Добавляем в trace
    this.agentTrace.push({
      agent: type,
      decision: "executing",
      timestamp: new Date(),
    });

    try {
      // Обновляем прогресс
      this.streaming.updateActionProgress(actionId, 50, "Обработка...");

      // Выполняем действие
      const { result, explanation } = await executor();

      const action: ExecutedAction = {
        id: actionId,
        type,
        params,
        result,
        explanation,
        timestamp: new Date(),
        canUndo: result === "success",
        undoDeadline:
          result === "success"
            ? new Date(Date.now() + 5 * 60 * 1000) // 5 минут
            : undefined,
      };

      this.actions.push(action);

      // Обновляем trace
      this.agentTrace.push({
        agent: type,
        decision: `completed: ${result}`,
        timestamp: new Date(),
      });

      // Завершаем действие
      this.streaming.completeAction(action);

      return action;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      const action: ExecutedAction = {
        id: actionId,
        type,
        params,
        result: "failed",
        explanation: `Ошибка: ${errorMessage}`,
        timestamp: new Date(),
        canUndo: false,
      };

      this.actions.push(action);

      // Обновляем trace
      this.agentTrace.push({
        agent: type,
        decision: `failed: ${errorMessage}`,
        timestamp: new Date(),
      });

      // Завершаем действие с ошибкой
      this.streaming.completeAction(action);

      return action;
    }
  }

  /**
   * Получить все действия
   */
  getActions(): ExecutedAction[] {
    return [...this.actions];
  }

  /**
   * Получить trace агентов
   */
  getAgentTrace(): AgentTraceEntry[] {
    return [...this.agentTrace];
  }
}

/**
 * Создает streaming response с action chain
 */
export function createStreamingResponse(): {
  response: RecruiterStreamingResponse;
  chainBuilder: ActionChainBuilder;
} {
  const response = new RecruiterStreamingResponse();
  const chainBuilder = new ActionChainBuilder(response);
  return { response, chainBuilder };
}
