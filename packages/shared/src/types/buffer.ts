/**
 * Типы сервиса буферизации сообщений
 *
 * Определяет интерфейсы и типы для системы буферизации сообщений,
 * используемой в интервью для агрегации ответов кандидатов.
 */

/**
 * Представляет одно буферизованное сообщение от кандидата
 */
export interface BufferedMessage {
  /** Уникальный идентификатор сообщения */
  id: string;

  /** Содержимое сообщения (текст или транскрипция) */
  content: string;

  /** Тип содержимого */
  contentType: "TEXT" | "VOICE";

  /** Unix timestamp получения сообщения */
  timestamp: number;

  /** Вопрос, который был задан (контекст для ответа) */
  questionContext?: string;
}

/**
 * Представляет значение буфера для конкретного шага интервью
 */
export interface BufferValue {
  /** Массив буферизованных сообщений в порядке получения */
  messages: BufferedMessage[];

  /** Unix timestamp создания буфера */
  createdAt: number;

  /** Unix timestamp последнего обновления буфера */
  lastUpdatedAt: number;

  /** Уникальный идентификатор flush операции (для идемпотентности) */
  flushId?: string;
}

/**
 * Интерфейс сервиса буферизации сообщений
 *
 * Управляет буферизацией сообщений кандидатов во время интервью.
 * Буферы изолированы по userId, conversationId и interviewStep.
 */
export interface MessageBufferService {
  /**
   * Добавить сообщение в буфер
   *
   * @param params - Параметры для добавления сообщения
   * @param params.userId - ID пользователя
   * @param params.conversationId - ID разговора
   * @param params.interviewStep - Текущий шаг интервью (номер вопроса)
   * @param params.message - Сообщение для буферизации
   * @returns Promise, который разрешается после добавления сообщения
   */
  addMessage(params: {
    userId: string;
    conversationId: string;
    interviewStep: number;
    message: BufferedMessage;
  }): Promise<void>;

  /**
   * Получить все сообщения из буфера
   *
   * @param params - Параметры для получения сообщений
   * @param params.userId - ID пользователя
   * @param params.conversationId - ID разговора
   * @param params.interviewStep - Текущий шаг интервью (номер вопроса)
   * @returns Promise с массивом буферизованных сообщений
   */
  getMessages(params: {
    userId: string;
    conversationId: string;
    interviewStep: number;
  }): Promise<BufferedMessage[]>;

  /**
   * Очистить буфер для конкретного шага интервью
   *
   * @param params - Параметры для очистки буфера
   * @param params.userId - ID пользователя
   * @param params.conversationId - ID разговора
   * @param params.interviewStep - Текущий шаг интервью (номер вопроса)
   * @returns Promise, который разрешается после очистки буфера
   */
  clearBuffer(params: {
    userId: string;
    conversationId: string;
    interviewStep: number;
  }): Promise<void>;

  /**
   * Проверить существование буфера для конкретного шага интервью
   *
   * @param params - Параметры для проверки существования буфера
   * @param params.userId - ID пользователя
   * @param params.conversationId - ID разговора
   * @param params.interviewStep - Текущий шаг интервью (номер вопроса)
   * @returns Promise с true если буфер существует, false в противном случае
   */
  hasBuffer(params: {
    userId: string;
    conversationId: string;
    interviewStep: number;
  }): Promise<boolean>;
}
