# Requirements Document

## Introduction

Система буферизации сообщений с debounce-механизмом для интервью-бота. Бот должен агрегировать все сообщения кандидата по одному вопросу и отправлять единственный запрос в LLM только после того, как кандидат завершит свой ответ.

## Glossary

- **Message_Buffer**: Хранилище для агрегации входящих сообщений кандидата
- **Debounce_Timer**: Механизм задержки через Inngest для определения завершения ответа
- **Flush_Operation**: Процесс отправки буферизованных сообщений в LLM и очистки буфера
- **Typing_Event**: Событие Telegram о том, что пользователь печатает
- **Voice_Event**: Событие Telegram о записи голосового сообщения
- **Interview_Step**: Текущий этап интервью (вопрос)
- **Inngest**: Платформа для управления событиями и фоновыми задачами
- **PostgreSQL_Metadata**: JSON поле в таблице conversations для хранения буфера

## Requirements

### Requirement 1: Буферизация входящих сообщений

**User Story:** Как система, я хочу агрегировать все входящие сообщения кандидата по одному вопросу, чтобы отправить единственный запрос в LLM после завершения ответа.

#### Acceptance Criteria

1. WHEN кандидат отправляет текстовое сообщение THEN система SHALL добавить сообщение в Message_Buffer
2. WHEN кандидат отправляет голосовое сообщение THEN система SHALL добавить транскрипцию в Message_Buffer
3. WHEN кандидат отправляет video_note THEN система SHALL добавить транскрипцию в Message_Buffer
4. THE Message_Buffer SHALL хранить сообщения с ключом userId + interviewStep
5. THE Message_Buffer SHALL персистироваться в PostgreSQL_Metadata поле conversation

### Requirement 2: Debounce-механизм через Inngest

**User Story:** Как система, я хочу использовать Inngest для определения момента завершения ответа кандидата, чтобы избежать in-memory таймеров и обеспечить надежность.

#### Acceptance Criteria

1. WHEN новое сообщение поступает THEN система SHALL публиковать событие в Inngest
2. WHEN событие публикуется THEN Inngest SHALL сбросить текущий Debounce_Timer
3. WHEN в течение N секунд нет новых сообщений THEN Inngest SHALL запустить Flush_Operation
4. THE Debounce_Timer SHALL быть конфигурируемым параметром
5. THE система SHALL NOT использовать setTimeout или in-memory таймеры

### Requirement 3: Обработка Telegram typing и voice событий

**User Story:** Как система, я хочу корректно обрабатывать события typing и recording, чтобы не отправлять запрос в LLM пока кандидат еще формулирует ответ.

#### Acceptance Criteria

1. WHEN получено typing событие THEN система SHALL продлить Debounce_Timer
2. WHEN получено typing событие THEN система SHALL NOT запускать Flush_Operation
3. WHEN получено recording событие THEN система SHALL продлить Debounce_Timer
4. WHEN получено recording событие THEN система SHALL NOT запускать Flush_Operation
5. WHEN получено voice/video_note сообщение THEN система SHALL считать его атомарным ответом и запустить Debounce_Timer

### Requirement 4: Flush операция

**User Story:** Как система, я хочу отправить агрегированные сообщения в LLM одним запросом, чтобы получить единственный ответ на полный ответ кандидата.

#### Acceptance Criteria

1. THE Flush_Operation SHALL быть реализована как Inngest function
2. WHEN Flush_Operation выполняется THEN система SHALL отправить один запрос в ai-sdk
3. WHEN Flush_Operation выполняется THEN система SHALL передать все сообщения из Message_Buffer
4. WHEN ai-sdk возвращает успешный ответ THEN система SHALL очистить Message_Buffer
5. THE Flush_Operation SHALL быть идемпотентной

### Requirement 5: Идемпотентность и надежность

**User Story:** Как система, я хочу обеспечить идемпотентность операций, чтобы избежать дублирования запросов в LLM при повторных попытках.

#### Acceptance Criteria

1. THE Flush_Operation SHALL использовать уникальный идентификатор для каждого flush
2. WHEN Flush_Operation вызывается повторно с тем же идентификатором THEN система SHALL NOT отправлять дублирующий запрос в LLM
3. WHEN Flush_Operation завершается с ошибкой THEN система SHALL сохранить Message_Buffer для повторной попытки
4. THE система SHALL логировать все попытки flush для отладки
5. WHEN Message_Buffer очищается THEN система SHALL подтвердить успешную доставку ответа кандидату

### Requirement 6: Конфигурация и мониторинг

**User Story:** Как администратор, я хочу настраивать параметры debounce и мониторить работу системы, чтобы оптимизировать пользовательский опыт.

#### Acceptance Criteria

1. THE Debounce_Timer SHALL быть конфигурируемым через переменные окружения
2. THE система SHALL логировать время ожидания для каждого буфера
3. THE система SHALL отслеживать количество сообщений в буфере
4. THE система SHALL отслеживать успешность Flush_Operation
5. THE система SHALL предоставлять метрики для мониторинга (количество flush, средний размер буфера, ошибки)

### Requirement 7: Интеграция с существующей системой

**User Story:** Как разработчик, я хочу интегрировать систему буферизации с существующим кодом интервью-бота, чтобы минимизировать изменения в текущей логике.

#### Acceptance Criteria

1. THE система SHALL интегрироваться с существующим Telegram bot handler
2. THE система SHALL использовать существующую структуру userId и interviewStep
3. THE система SHALL сохранять совместимость с текущим форматом сообщений
4. WHEN интеграция завершена THEN существующие тесты SHALL продолжать проходить
5. THE система SHALL предоставлять API для получения статуса буфера

### Requirement 8: Обработка edge cases

**User Story:** Как система, я хочу корректно обрабатывать граничные случаи, чтобы обеспечить стабильную работу в любых условиях.

#### Acceptance Criteria

1. WHEN кандидат отправляет пустое сообщение THEN система SHALL игнорировать его
2. WHEN кандидат отправляет сообщение во время Flush_Operation THEN система SHALL создать новый буфер
3. WHEN PostgreSQL недоступен THEN система SHALL логировать ошибку и использовать fallback механизм
4. WHEN Inngest недоступен THEN система SHALL логировать ошибку и уведомить администратора
5. WHEN буфер превышает максимальный размер THEN система SHALL принудительно запустить Flush_Operation

### Requirement 9: Безопасность ключей идентификации

**User Story:** Как система, я хочу использовать детерминированные и безопасные от коллизий ключи для идентификации буферов и операций, чтобы избежать ошибок при обработке данных с специальными символами.

#### Acceptance Criteria

1. THE Debounce_Timer ключ SHALL быть детерминированным для одинаковых входных параметров
2. THE Debounce_Timer ключ SHALL быть уникальным для разных комбинаций userId, conversationId и interviewStep
3. WHEN userId, conversationId или interviewStep содержат разделитель (например, '-') THEN система SHALL NOT создавать коллизии ключей
4. THE система SHALL использовать безопасный метод кодирования для генерации ключей (JSON.stringify массива, base64, или encodeURIComponent)
5. THE flushId SHALL использовать тот же безопасный метод генерации для обеспечения консистентности
6. THE система SHALL гарантировать, что ключи остаются валидными для всех возможных значений входных параметров

### Requirement 10: Надежность HTTP-запросов к Inngest

**User Story:** Как система, я хочу обеспечить надежную обработку HTTP-запросов к Inngest API, чтобы избежать зависаний, тихих сбоев и неопределенных состояний при сетевых проблемах.

#### Acceptance Criteria

1. WHEN система отправляет HTTP-запрос к Inngest THEN запрос SHALL иметь таймаут не более 10 секунд
2. WHEN HTTP-запрос к Inngest превышает таймаут THEN система SHALL прервать запрос и логировать ошибку
3. WHEN HTTP-запрос к Inngest возвращает ответ THEN система SHALL проверить статус ответа (response.ok или response.status)
4. WHEN HTTP-ответ от Inngest имеет статус ошибки (4xx или 5xx) THEN система SHALL логировать детальную информацию об ошибке
5. WHEN происходит сетевая ошибка при запросе к Inngest THEN система SHALL перехватить исключение и логировать его
6. THE система SHALL NOT игнорировать сбои HTTP-запросов к Inngest молча
7. WHEN HTTP-запрос к Inngest завершается с ошибкой THEN сообщение SHALL оставаться в буфере для повторной обработки
