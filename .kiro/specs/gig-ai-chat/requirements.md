# Requirements Document

## Introduction

AI чат для gig заданий позволяет рекрутерам вести диалог с AI-помощником в контексте конкретного задания. Пользователь может задавать вопросы о кандидатах, получать аналитику, сравнения и рекомендации в естественной форме. Система анализирует данные всех откликов на gig и предоставляет интеллектуальные ответы.

## Glossary

- **Gig_AI_Chat**: AI-помощник для анализа кандидатов в контексте конкретного gig задания
- **Chat_Session**: Сессия диалога с историей сообщений, привязанная к конкретному gig
- **Gig_Context**: Полная информация о gig задании (требования, бюджет, сроки, настройки)
- **Candidates_Context**: Агрегированные данные всех откликов на gig (кандидаты, оценки, статусы)
- **Chat_Message**: Сообщение в диалоге (user или assistant)
- **Quick_Reply**: Предложенный вариант следующего вопроса
- **Analysis_Result**: Структурированный результат анализа от AI

## Requirements

### Requirement 1: Chat Session Management

**User Story:** As a recruiter, I want to have a persistent chat session for each gig, so that I can continue conversations and maintain context.

#### Acceptance Criteria

1. THE System SHALL create a new Chat_Session when user opens gig AI chat for the first time
2. THE System SHALL persist Chat_Session in database with reference to gig_id and user_id
3. WHEN user returns to gig AI chat, THE System SHALL restore previous Chat_Session with full history
4. THE System SHALL limit Chat_Session history to 50 messages to maintain performance
5. WHEN history exceeds 50 messages, THE System SHALL summarize older messages and keep recent ones
6. THE System SHALL allow user to clear chat history and start fresh

### Requirement 2: Gig Context Loading

**User Story:** As a recruiter, I want the AI to understand my gig requirements, so that it can provide relevant answers about candidates.

#### Acceptance Criteria

1. WHEN Chat_Session starts, THE System SHALL load full Gig_Context including title, description, requirements, budget, deadline
2. THE System SHALL include gig type and estimated duration in context
3. THE System SHALL include custom bot instructions if configured
4. THE System SHALL refresh Gig_Context when gig data is updated
5. THE AI SHALL reference gig requirements when answering questions about candidate fit

### Requirement 3: Candidates Context Loading

**User Story:** As a recruiter, I want the AI to have access to all candidate data, so that it can answer questions about them.

#### Acceptance Criteria

1. WHEN Chat_Session starts, THE System SHALL load all Candidates_Context for the gig
2. THE Candidates_Context SHALL include: candidateName, proposedPrice, proposedDeliveryDays, coverLetter, experience, skills, rating
3. THE Candidates_Context SHALL include screening results: screeningScore, screeningAnalysis (from gig_response_screenings table)
4. THE Candidates_Context SHALL include interview results: interviewScore, interviewAnalysis (from interview_scorings table)
5. THE Candidates_Context SHALL include ranking data: compositeScore, strengths, weaknesses, recommendation
6. THE Candidates_Context SHALL include HR status: hrSelectionStatus
7. THE System SHALL refresh Candidates_Context when new responses arrive or data changes

### Requirement 4: Natural Language Query Processing

**User Story:** As a recruiter, I want to ask questions in natural language, so that I can get insights without learning specific commands.

#### Acceptance Criteria

1. WHEN user asks "кто лучший кандидат?", THE AI SHALL identify and describe the top-ranked candidate
2. WHEN user asks "покажи худших кандидатов", THE AI SHALL list candidates with lowest scores and explain why
3. WHEN user asks "сравни кандидата X и Y", THE AI SHALL provide detailed comparison
4. WHEN user asks "кто укладывается в бюджет?", THE AI SHALL filter candidates by budget constraints
5. WHEN user asks "кто может сделать быстрее всех?", THE AI SHALL rank by delivery time
6. WHEN user asks "у кого лучшее портфолио?", THE AI SHALL analyze screening scores and portfolio data
7. WHEN user asks "кого ты рекомендуешь?", THE AI SHALL provide recommendation with reasoning
8. THE AI SHALL understand Russian and English queries

### Requirement 5: Candidate Analysis Queries

**User Story:** As a recruiter, I want to ask specific questions about candidates, so that I can make informed decisions.

#### Acceptance Criteria

1. WHEN user asks about specific candidate by name, THE AI SHALL provide full profile summary
2. THE AI SHALL answer questions about candidate's skills match with requirements
3. THE AI SHALL answer questions about candidate's price competitiveness
4. THE AI SHALL answer questions about candidate's experience relevance
5. THE AI SHALL answer questions about candidate's interview performance
6. THE AI SHALL highlight red flags or concerns about candidates when asked
7. THE AI SHALL provide strengths and weaknesses analysis when asked

### Requirement 6: Aggregated Analytics Queries

**User Story:** As a recruiter, I want to get aggregated insights about all candidates, so that I can understand the overall pool.

#### Acceptance Criteria

1. WHEN user asks "сколько кандидатов откликнулось?", THE AI SHALL provide count with breakdown by status
2. WHEN user asks "какой средний бюджет?", THE AI SHALL calculate and present price statistics
3. WHEN user asks "какие навыки чаще всего?", THE AI SHALL analyze skills distribution
4. WHEN user asks "сколько прошли интервью?", THE AI SHALL provide interview completion stats
5. THE AI SHALL provide summary of candidate pool quality when asked
6. THE AI SHALL identify gaps in candidate pool (missing skills, all over budget, etc.)

### Requirement 7: Action Suggestions

**User Story:** As a recruiter, I want the AI to suggest next actions, so that I can efficiently process candidates.

#### Acceptance Criteria

1. WHEN AI identifies strong candidate, IT SHALL suggest "Пригласить на интервью" or "Отправить оффер"
2. WHEN AI identifies weak candidate, IT SHALL suggest "Отклонить" with reasoning
3. WHEN user asks for recommendations, THE AI SHALL provide actionable next steps
4. THE AI SHALL suggest Quick_Replies based on conversation context
5. Quick_Replies SHALL include common follow-up questions relevant to current topic

### Requirement 8: Chat UI Component

**User Story:** As a recruiter, I want a convenient chat interface, so that I can easily interact with the AI.

#### Acceptance Criteria

1. THE UI SHALL display chat in a slide-over panel or dedicated section on gig page
2. THE UI SHALL show message history with clear distinction between user and AI messages
3. THE UI SHALL display typing indicator while AI is generating response
4. THE UI SHALL support markdown formatting in AI responses
5. THE UI SHALL display Quick_Replies as clickable buttons below AI response
6. THE UI SHALL auto-scroll to latest message
7. THE UI SHALL support keyboard shortcuts (Enter to send, Shift+Enter for newline)
8. THE UI SHALL be responsive and work on mobile devices

### Requirement 9: Streaming Response

**User Story:** As a recruiter, I want to see AI response as it's being generated, so that I don't wait for complete response.

#### Acceptance Criteria

1. THE System SHALL stream AI response tokens to client in real-time
2. THE UI SHALL display partial response as tokens arrive
3. WHEN streaming completes, THE System SHALL save full response to Chat_Session
4. IF streaming fails, THE System SHALL show error and allow retry
5. THE System SHALL support cancellation of ongoing generation

### Requirement 10: tRPC API Endpoints

**User Story:** As a frontend developer, I want well-defined API endpoints, so that I can integrate the chat feature.

#### Acceptance Criteria

1. THE API SHALL provide `gig.aiChat.sendMessage` mutation for sending user messages
2. THE API SHALL provide `gig.aiChat.getHistory` query for loading chat history
3. THE API SHALL provide `gig.aiChat.clearHistory` mutation for clearing chat
4. THE API SHALL validate that user has access to the gig before processing
5. THE API SHALL use protectedProcedure for all endpoints
6. THE API SHALL return structured response with message, quickReplies, and metadata

### Requirement 11: Error Handling

**User Story:** As a recruiter, I want clear error messages, so that I understand what went wrong.

#### Acceptance Criteria

1. WHEN AI fails to generate response, THE System SHALL show user-friendly error message
2. WHEN gig has no candidates, THE AI SHALL inform user and suggest adding candidates
3. WHEN user asks about non-existent candidate, THE AI SHALL clarify and list available candidates
4. WHEN rate limit is exceeded, THE System SHALL inform user and suggest waiting
5. THE System SHALL log all errors to monitoring system (Langfuse)

### Requirement 12: Performance and Limits

**User Story:** As a system administrator, I want the chat to be performant and cost-effective, so that it scales well.

#### Acceptance Criteria

1. THE System SHALL limit context window to prevent excessive token usage
2. WHEN gig has more than 50 candidates, THE System SHALL summarize candidate data
3. THE System SHALL cache Gig_Context and Candidates_Context for 5 minutes
4. THE System SHALL implement rate limiting: max 20 messages per minute per user
5. THE System SHALL track token usage per workspace for billing purposes

### Requirement 13: Langfuse Integration

**User Story:** As a developer, I want to track AI interactions, so that I can monitor quality and debug issues.

#### Acceptance Criteria

1. THE System SHALL create Langfuse trace for each chat message
2. THE trace SHALL include: workspaceId, gigId, userId, messageType
3. THE trace SHALL track token usage and latency
4. THE System SHALL use generationName "gig-ai-chat"
5. THE System SHALL log errors with full context for debugging

### Requirement 14: Authorization and Access Control

**User Story:** As a system administrator, I want proper access control, so that users only access their own data.

#### Acceptance Criteria

1. THE System SHALL verify user belongs to workspace that owns the gig
2. THE System SHALL verify gig exists and is accessible
3. WHEN unauthorized access attempted, THE System SHALL return 403 error
4. THE System SHALL not expose candidate data from other gigs in responses
5. THE System SHALL audit all chat interactions for compliance
