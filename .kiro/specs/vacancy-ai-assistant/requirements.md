# Requirements Document: AI-помощник для создания вакансий

## Introduction

Система должна предоставить интерактивного AI-помощника для создания вакансий через чат-интерфейс. Пользователь описывает вакансию в свободной форме, а AI помогает структурировать информацию и заполнить все необходимые поля. Это аналог существующего помощника для создания разовых заданий (gig), но адаптированный для вакансий.

## Glossary

- **AI_Assistant**: AI-помощник, который ведёт диалог с пользователем и генерирует структурированную вакансию
- **Vacancy_Document**: Структура данных вакансии (title, description, requirements, customBotInstructions, customScreeningPrompt, customInterviewQuestions, customOrganizationalQuestions)
- **Chat_Interface**: React компонент для взаимодействия с AI-помощником
- **tRPC_Endpoint**: Серверный endpoint для обработки запросов генерации
- **Quick_Replies**: Кнопки с предложениями следующих шагов для пользователя
- **Conversation_History**: История диалога между пользователем и AI
- **Company_Settings**: Настройки компании для персонализации промптов

## Requirements

### Requirement 1: Chat-Based Vacancy Generation

**User Story:** Как рекрутер, я хочу создавать вакансии через диалог с AI-помощником, чтобы быстро структурировать информацию без заполнения длинных форм.

#### Acceptance Criteria

1. WHEN пользователь отправляет сообщение THEN система SHALL обработать его через AI и обновить Vacancy_Document
2. WHEN AI генерирует ответ THEN система SHALL вернуть обновлённый документ и Quick_Replies
3. WHEN пользователь кликает на Quick_Reply THEN система SHALL отправить этот текст как новое сообщение
4. THE система SHALL сохранять Conversation_History для контекста
5. THE система SHALL использовать Company_Settings для персонализации промптов

### Requirement 2: Incremental Document Building

**User Story:** Как рекрутер, я хочу видеть как документ вакансии заполняется постепенно, чтобы контролировать процесс и вносить корректировки.

#### Acceptance Criteria

1. WHEN AI обновляет title THEN система SHALL показать обновлённое название в документе
2. WHEN AI обновляет description THEN система SHALL показать обновлённое описание
3. WHEN AI обновляет requirements THEN система SHALL показать обновлённые требования
4. WHEN AI обновляет customBotInstructions THEN система SHALL показать обновлённые инструкции для бота
5. THE система SHALL сохранять предыдущие значения полей, если AI не обновляет их

### Requirement 3: Smart Context-Aware Suggestions

**User Story:** Как рекрутер, я хочу получать умные предложения следующих шагов, чтобы быстрее заполнить вакансию.

#### Acceptance Criteria

1. WHEN документ пустой THEN Quick_Replies SHALL предлагать начать с названия или описания
2. WHEN title заполнен но description пуст THEN Quick_Replies SHALL предлагать добавить описание
3. WHEN основная информация заполнена THEN Quick_Replies SHALL предлагать добавить требования или настройки бота
4. WHEN документ почти готов THEN Quick_Replies SHALL предлагать "Создать вакансию" или уточнения
5. THE Quick_Replies SHALL быть конкретными и релевантными текущему состоянию документа

### Requirement 4: Vacancy Requirements Extraction

**User Story:** Как рекрутер, я хочу чтобы AI автоматически извлекал структурированные требования из описания, чтобы не заполнять их вручную.

#### Acceptance Criteria

1. WHEN description содержит требования THEN AI SHALL извлечь mandatory_requirements
2. WHEN description содержит желаемые навыки THEN AI SHALL извлечь nice_to_have_skills
3. WHEN description содержит технологии THEN AI SHALL извлечь tech_stack
4. WHEN description содержит опыт работы THEN AI SHALL извлечь experience_years
5. THE система SHALL сохранять requirements в формате VacancyRequirements

### Requirement 5: Bot Configuration Assistance

**User Story:** Как рекрутер, я хочу чтобы AI помогал настроить бота для интервью, чтобы автоматизировать скрининг кандидатов.

#### Acceptance Criteria

1. WHEN пользователь просит настроить бота THEN AI SHALL предложить customBotInstructions
2. WHEN пользователь просит настроить скрининг THEN AI SHALL предложить customScreeningPrompt
3. WHEN пользователь просит добавить вопросы THEN AI SHALL предложить customInterviewQuestions
4. WHEN пользователь просит организационные вопросы THEN AI SHALL предложить customOrganizationalQuestions
5. THE AI SHALL учитывать специфику вакансии при генерации настроек бота

### Requirement 6: Create Vacancy Action

**User Story:** Как рекрутер, я хочу сохранить созданную вакансию в базу данных одним кликом, чтобы начать её использовать.

#### Acceptance Criteria

1. WHEN title заполнен THEN система SHALL показать кнопку "Создать вакансию"
2. WHEN пользователь кликает кнопку THEN система SHALL сохранить вакансию в БД
3. WHEN вакансия сохранена THEN система SHALL перенаправить на страницу вакансии
4. WHEN сохранение не удалось THEN система SHALL показать ошибку
5. THE кнопка SHALL быть disabled во время сохранения

### Requirement 7: Company Context Integration

**User Story:** Как рекрутер, я хочу чтобы AI учитывал контекст моей компании, чтобы генерировать более релевантные вакансии.

#### Acceptance Criteria

1. WHEN Company_Settings существуют THEN AI SHALL использовать их в промпте
2. WHEN botName задан THEN AI SHALL представляться этим именем
3. WHEN botRole задан THEN AI SHALL использовать эту роль в диалоге
4. WHEN company description задано THEN AI SHALL учитывать специфику компании
5. THE AI SHALL адаптировать стиль общения под настройки компании

### Requirement 8: Error Handling and Validation

**User Story:** Как рекрутер, я хочу получать понятные сообщения об ошибках, чтобы понимать что пошло не так и как это исправить.

#### Acceptance Criteria

1. WHEN AI не может распарсить ответ THEN система SHALL показать ошибку парсинга
2. WHEN network error происходит THEN система SHALL предложить повторить запрос
3. WHEN validation fails THEN система SHALL показать конкретные ошибки валидации
4. WHEN title превышает 500 символов THEN система SHALL показать ошибку длины
5. THE система SHALL логировать все ошибки в Langfuse

### Requirement 9: Conversation History Management

**User Story:** Как рекрутер, я хочу чтобы AI помнил контекст диалога, чтобы не повторять информацию.

#### Acceptance Criteria

1. WHEN пользователь отправляет сообщение THEN система SHALL добавить его в Conversation_History
2. WHEN AI отвечает THEN система SHALL добавить ответ в Conversation_History
3. WHEN история превышает 20 сообщений THEN система SHALL обрезать старые сообщения
4. THE система SHALL передавать историю в AI для контекста
5. THE система SHALL сохранять историю в состоянии компонента

### Requirement 10: Langfuse Integration

**User Story:** Как разработчик, я хочу логировать все генерации в Langfuse, чтобы отслеживать качество и производительность AI.

#### Acceptance Criteria

1. WHEN начинается генерация THEN система SHALL создать trace в Langfuse
2. WHEN генерация завершается THEN система SHALL обновить trace с результатом
3. WHEN происходит ошибка THEN система SHALL логировать ошибку в trace
4. THE система SHALL включать metadata (workspaceId, userId) в trace
5. THE система SHALL использовать generationName "vacancy-chat-generation"

### Requirement 11: UI/UX Requirements

**User Story:** Как рекрутер, я хочу чтобы интерфейс был интуитивным и отзывчивым, чтобы комфортно работать с AI-помощником.

#### Acceptance Criteria

1. WHEN генерация идёт THEN система SHALL показать индикатор загрузки
2. WHEN сообщение отправлено THEN input SHALL очиститься
3. WHEN Quick_Reply кликнут THEN он SHALL визуально отреагировать
4. WHEN документ обновляется THEN изменения SHALL быть плавными без мерцания
5. THE интерфейс SHALL быть адаптивным для мобильных устройств

### Requirement 12: Authorization and Access Control

**User Story:** Как администратор, я хочу чтобы только авторизованные пользователи могли создавать вакансии, чтобы защитить данные.

#### Acceptance Criteria

1. WHEN неавторизованный пользователь пытается создать вакансию THEN система SHALL вернуть ошибку 401
2. WHEN пользователь без доступа к workspace пытается создать вакансию THEN система SHALL вернуть ошибку 403
3. THE система SHALL проверять workspaceId перед генерацией
4. THE система SHALL проверять userId перед сохранением
5. THE система SHALL использовать protectedProcedure для tRPC endpoint
