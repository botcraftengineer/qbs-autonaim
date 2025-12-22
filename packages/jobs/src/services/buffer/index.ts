/**
 * Экспорты сервиса буферизации сообщений
 * 
 * Предоставляет интерфейсы, типы и singleton instance
 * для работы с буферизацией сообщений в интервью.
 */

// Экспорт типов из shared пакета
export type {
  BufferedMessage,
  BufferValue,
  MessageBufferService,
} from "@qbs-autonaim/shared";

// Экспорт класса реализации
export { PostgresMessageBufferService } from "./postgres-buffer-service";

// Создание и экспорт singleton instance
import { PostgresMessageBufferService } from "./postgres-buffer-service";

/**
 * Singleton instance PostgresMessageBufferService
 * 
 * Используется во всем приложении для обеспечения
 * единой точки доступа к сервису буферизации.
 */
export const messageBufferService = new PostgresMessageBufferService();
