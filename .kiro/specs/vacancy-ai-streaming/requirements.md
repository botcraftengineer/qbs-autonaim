# Requirements Document: Streaming AI Generation для вакансий

## Introduction

Система должна генерировать вакансии с использованием AI в режиме streaming, чтобы пользователь видел документ, появляющийся постепенно (как на https://chat-sdk.dev/). Это улучшает UX и создаёт ощущение "живой" генерации.

## Glossary

- **Streaming**: Передача данных по частям в реальном времени, а не одним блоком
- **AI_Client**: Модуль для работы с AI моделями (OpenAI/DeepSeek)
- **tRPC_Router**: Серверный роут для обработки запросов от клиента
- **Vacancy_Document**: Структура данных вакансии (title, description, requirements, responsibilities, conditions)
- **Chat_Container**: React компонент, управляющий чатом и документом
- **ReadableStream**: Web API для чтения потоковых данных

## Requirements

### Requirement 1: Streaming API Endpoint

**User Story:** Как разработчик, я хочу иметь API endpoint с поддержкой streaming, чтобы передавать данные AI генерации по частям на клиент.

#### Acceptance Criteria

1. WHEN клиент отправляет запрос на генерацию THEN система SHALL создать ReadableStream для передачи данных
2. WHEN AI генерирует текст THEN система SHALL отправлять chunks данных в stream немедленно
3. WHEN генерация завершается THEN система SHALL закрыть stream корректно
4. WHEN происходит ошибка THEN система SHALL отправить информацию об ошибке в stream и закрыть его
5. THE API_Endpoint SHALL проверять авторизацию пользователя перед началом streaming

### Requirement 2: Client-Side Streaming Consumer

**User Story:** Как пользователь, я хочу видеть документ, появляющийся постепенно, чтобы понимать что генерация идёт и видеть промежуточные результаты.

#### Acceptance Criteria

1. WHEN начинается генерация THEN Chat_Container SHALL показать индикатор загрузки
2. WHEN приходят chunks данных THEN Chat_Container SHALL обновлять Vacancy_Document инкрементально
3. WHEN stream завершается THEN Chat_Container SHALL скрыть индикатор загрузки
4. WHEN происходит ошибка THEN Chat_Container SHALL показать сообщение об ошибке в чате
5. THE Chat_Container SHALL использовать fetch с ReadableStream вместо tRPC mutation

### Requirement 3: Incremental Document Updates

**User Story:** Как пользователь, я хочу видеть каждое поле документа, заполняющееся постепенно, чтобы следить за прогрессом генерации.

#### Acceptance Criteria

1. WHEN приходит chunk с частичным title THEN система SHALL обновить только поле title
2. WHEN приходит chunk с частичным description THEN система SHALL обновить только поле description
3. WHEN приходят chunks для разных полей THEN система SHALL обновлять их независимо
4. THE система SHALL сохранять предыдущие значения полей при обновлении других полей
5. THE обновления SHALL происходить плавно без мерцания UI

### Requirement 4: Error Handling and Fallback

**User Story:** Как пользователь, я хочу получить понятное сообщение об ошибке, если streaming не работает, и возможность повторить запрос.

#### Acceptance Criteria

1. WHEN streaming недоступен THEN система SHALL показать сообщение об ошибке
2. WHEN происходит network error THEN система SHALL предложить повторить запрос
3. WHEN AI возвращает невалидный JSON THEN система SHALL показать ошибку парсинга
4. THE система SHALL логировать все ошибки streaming в Langfuse
5. IF streaming fails THEN система SHALL предложить fallback на обычный режим

### Requirement 5: Create Vacancy Button

**User Story:** Как пользователь, я хочу сохранить сгенерированную вакансию в базу данных одним кликом, чтобы начать её использовать.

#### Acceptance Criteria

1. WHEN документ заполнен (хотя бы title) THEN система SHALL показать кнопку "Создать вакансию"
2. WHEN пользователь кликает кнопку THEN система SHALL сохранить вакансию в БД
3. WHEN вакансия сохранена THEN система SHALL перенаправить на страницу вакансии
4. WHEN сохранение не удалось THEN система SHALL показать ошибку
5. THE кнопка SHALL быть disabled во время сохранения

### Requirement 6: Langfuse Integration

**User Story:** Как разработчик, я хочу логировать все streaming генерации в Langfuse, чтобы отслеживать качество и производительность AI.

#### Acceptance Criteria

1. WHEN начинается streaming THEN система SHALL создать trace в Langfuse
2. WHEN stream завершается THEN система SHALL обновить trace с полным результатом
3. WHEN происходит ошибка THEN система SHALL логировать ошибку в trace
4. THE система SHALL включать metadata (workspaceId, userId) в trace
5. THE система SHALL использовать generationName "vacancy-chat-streaming"

### Requirement 7: Performance and UX

**User Story:** Как пользователь, я хочу чтобы streaming работал быстро и плавно, без задержек и зависаний интерфейса.

#### Acceptance Criteria

1. WHEN приходят chunks THEN UI SHALL обновляться не чаще 60 FPS
2. THE система SHALL использовать debounce для обновлений UI если chunks приходят слишком часто
3. THE система SHALL не блокировать UI thread во время парсинга chunks
4. WHEN генерация длится >5 секунд THEN система SHALL показать прогресс-бар
5. THE система SHALL поддерживать отмену генерации (abort controller)
