# Implementation Plan: AI-Powered Gig Candidate Ranking

## Overview

Реализация AI-powered системы ранжирования кандидатов для gig заданий. Система использует LLM агенты для интеллектуальной оценки, сравнения и формирования рекомендаций, учитывая контекст и нюансы, которые не видны простым формулам.

## Architecture

- **packages/ai/src/agents/recruiter/ranking/** - AI агенты для оценки, сравнения и рекомендаций
  - CandidateEvaluatorAgent - оценивает одного кандидата по всем критериям
  - ComparisonAgent - сравнивает кандидатов и выявляет strengths/weaknesses
  - RecommendationAgent - формирует финальную рекомендацию
  - RankingOrchestrator - координирует работу всех агентов
- **packages/jobs/src/inngest/functions/response/** - Фоновая задача для автоматического пересчета при событиях
- **packages/api/src/services/gig/ranking/** - Тонкая обертка над AI агентами для использования в API
- **packages/api/src/routers/gig/responses/** - API endpoints для получения и триггера пересчета

## Tasks

- [x] 1. Расширение схемы базы данных
  - [x] 1.1 Добавить enum gigRecommendationEnum в packages/db/src/schema/gig/response.ts
    - Значения: HIGHLY_RECOMMENDED, RECOMMENDED, NEUTRAL, NOT_RECOMMENDED
    - _Requirements: 1.10_
  - [x] 1.2 Добавить новые поля в таблицу gigResponse
    - compositeScore, priceScore, deliveryScore, skillsMatchScore, experienceScore (integer 0-100)
    - rankingPosition (integer)
    - rankingAnalysis (text)
    - strengths, weaknesses (jsonb array)
    - recommendation (enum)
    - rankedAt (timestamp)
    - _Requirements: 1.1-1.10_
  - [x] 1.3 Добавить индексы для новых полей
    - Индекс на compositeScore для сортировки
    - Индекс на recommendation для фильтрации
    - Индекс на rankingPosition
    - _Requirements: 5.1, 5.2_
  - [x] 1.4 Обновить Zod схемы и типы
    - Обновить CreateGigResponseSchema
    - Экспортировать новые типы
    - _Requirements: 1.1-1.10_

- [x] 2. Checkpoint - Проверка схемы
  - Убедиться что схема компилируется без ошибок
  - Проверить типы TypeScript

- [x] 3. Реализация CandidateEvaluatorAgent
  - [x] 3.1 Создать файл packages/ai/src/agents/recruiter/ranking/candidate-evaluator-agent.ts
    - Наследуется от BaseToolLoopAgent
    - Определить Zod схемы для input/output
    - _Requirements: 2.1-2.8_
  - [x] 3.2 Создать промпты packages/ai/src/agents/recruiter/ranking/prompts.ts
    - System prompt для оценки кандидата
    - Инструкции по оценке price, delivery, skills, experience
    - Примеры reasoning для прозрачности
    - _Requirements: 2.1-2.8_
  - [x] 3.3 Реализовать метод execute()
    - Input: candidate data, gig requirements, existing scores (screening/interview)
    - Output: price_score, delivery_score, skills_match_score, experience_score, composite_score, reasoning
    - Валидация scores в диапазоне 0-100
    - _Requirements: 2.1-2.8_
  - [x] 3.4 Реализовать контекстную оценку цены
    - AI анализирует: price vs budget, market rates, experience level, value proposition
    - _Requirements: 2.2_
  - [x] 3.5 Реализовать контекстную оценку сроков
    - AI анализирует: days vs deadline, complexity, workload signals, realism
    - _Requirements: 2.3_
  - [x] 3.6 Реализовать оценку навыков
    - AI анализирует: required_skills (70%), nice_to_have (30%), skill depth
    - _Requirements: 2.4_
  - [x] 3.7 Реализовать оценку опыта
    - AI анализирует: portfolio relevance, similar projects, years, quality
    - _Requirements: 2.5_
  - [ ]* 3.8 Написать unit tests для CandidateEvaluatorAgent
    - Тесты с mock AI responses
    - Проверка валидации scores
    - Edge cases: missing data, extreme values

- [x] 4. Checkpoint - Проверка CandidateEvaluatorAgent
  - Убедиться что агент корректно оценивает кандидатов
  - Проверить reasoning качество
  - Протестировать edge cases

- [x] 5. Реализация ComparisonAgent
  - [x] 5.1 Создать файл packages/ai/src/agents/recruiter/ranking/comparison-agent.ts
    - Наследуется от BaseToolLoopAgent
    - Определить Zod схемы для input/output
    - _Requirements: 3.1-3.7_
  - [x] 5.2 Обновить промпты packages/ai/src/agents/recruiter/ranking/prompts.ts
    - System prompt для сравнения кандидатов
    - Инструкции по выявлению strengths/weaknesses
    - Примеры контекстного анализа
    - _Requirements: 3.1-3.7_
  - [x] 5.3 Реализовать метод execute()
    - Input: all candidates with scores, gig requirements
    - Output: для каждого кандидата - strengths[], weaknesses[], comparative_analysis
    - Идентификация category leaders
    - _Requirements: 3.1-3.7_
  - [x] 5.4 Реализовать выявление strengths
    - AI определяет до 3 ключевых преимуществ на основе сравнения
    - Учитывает: лидерство в категориях, уникальные преимущества, выдающиеся качества
    - _Requirements: 3.4_
  - [x] 5.5 Реализовать выявление weaknesses
    - AI определяет до 3 ключевых недостатков на основе сравнения
    - Учитывает: отставание в категориях, критичные пробелы, факторы риска
    - _Requirements: 3.5_
  - [x] 5.6 Реализовать контекстный анализ
    - AI генерирует текст: почему эта позиция, как сравнивается с другими, что выделяет
    - _Requirements: 3.6, 3.7_
  - [ ]* 5.7 Написать unit tests для ComparisonAgent
    - Тесты с mock AI responses
    - Проверка идентификации strengths/weaknesses
    - Edge cases: один кандидат, все одинаковые

- [x] 6. Checkpoint - Проверка ComparisonAgent
  - Убедиться что агент корректно сравнивает кандидатов
  - Проверить качество strengths/weaknesses
  - Протестировать edge cases

- [x] 7. Реализация RecommendationAgent
  - [x] 7.1 Создать файл packages/ai/src/agents/recruiter/ranking/recommendation-agent.ts
    - Наследуется от BaseToolLoopAgent
    - Определить Zod схемы для input/output
    - _Requirements: 4.1-4.6_
  - [x] 7.2 Обновить промпты packages/ai/src/agents/recruiter/ranking/prompts.ts
    - System prompt для формирования рекомендаций
    - Инструкции по определению статуса с учетом качественных факторов
    - Примеры actionable insights
    - _Requirements: 4.1-4.6_
  - [x] 7.3 Реализовать метод execute()
    - Input: candidate with scores, strengths, weaknesses, comparison context
    - Output: recommendation status, ranking_analysis, actionable_insights
    - _Requirements: 4.1-4.6_
  - [x] 7.4 Реализовать определение статуса
    - AI использует composite_score как primary signal (>=80, >=60, >=40, <40)
    - AI может корректировать на основе qualitative factors
    - _Requirements: 4.2, 4.3_
  - [x] 7.5 Реализовать генерацию ranking_analysis
    - AI объясняет: reasoning рекомендации, ключевые факторы, риски и возможности, сравнение с другими
    - Включает strengths/weaknesses в нарратив
    - _Requirements: 4.4, 4.5_
  - [x] 7.6 Реализовать actionable insights
    - AI генерирует практические советы: "Verify availability", "Good culture fit potential"
    - _Requirements: 4.6_
  - [ ]* 7.7 Написать unit tests для RecommendationAgent
    - Тесты с mock AI responses
    - Проверка корректности статусов
    - Edge cases: граничные scores, conflicting signals

- [x] 8. Checkpoint - Проверка RecommendationAgent
  - Убедиться что агент корректно формирует рекомендации
  - Проверить качество ranking_analysis
  - Протестировать edge cases

- [x] 9. Реализация RankingOrchestrator
  - [x] 9.1 Создать файл packages/ai/src/agents/recruiter/ranking/ranking-orchestrator.ts
    - Координирует CandidateEvaluatorAgent, ComparisonAgent, RecommendationAgent
    - Определить интерфейсы RankedCandidate, RankingResult
    - _Requirements: 5.1-5.7, 6.1-6.4_
  - [x] 9.2 Реализовать метод rankCandidates()
    - Шаг 1: Оценка каждого кандидата через CandidateEvaluatorAgent
    - Шаг 2: Сравнение всех кандидатов через ComparisonAgent
    - Шаг 3: Формирование рекомендаций через RecommendationAgent
    - Шаг 4: Сортировка по composite_score и присвоение ranking_position
    - _Requirements: 5.1, 6.4_
  - [x] 9.3 Реализовать обработку edge cases
    - Один кандидат: пропуск сравнения
    - Отсутствие данных: адаптация оценки
    - Одинаковые scores: tiebreaker по createdAt
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 9.4 Реализовать фильтрацию rejected кандидатов
    - Исключение hrSelectionStatus = REJECTED из активного ранжирования
    - _Requirements: 8.5_
  - [x] 9.5 Добавить экспорт в packages/ai/src/agents/recruiter/ranking/index.ts
    - Экспортировать все агенты и оркестратор
  - [ ]* 9.6 Написать integration tests для RankingOrchestrator
    - Тесты полного flow с mock агентами
    - Проверка корректности ranking_position
    - Edge cases: различные комбинации данных

- [x] 10. Checkpoint - Проверка RankingOrchestrator
  - Убедиться что оркестратор корректно координирует агентов
  - Проверить полный flow ранжирования
  - Протестировать на реальных данных

- [x] 11. Реализация RankingService (API wrapper)
  - [x] 11.1 Создать файл packages/api/src/services/gig/ranking/ranking-service.ts
    - Тонкая обертка над RankingOrchestrator из packages/ai
    - Методы: calculateRankings(), getRankedCandidates(), saveRankings()
    - _Requirements: 5.1-5.7, 6.1-6.4_
  - [x] 11.2 Реализовать calculateRankings()
    - Загружает кандидатов из БД
    - Вызывает RankingOrchestrator.rankCandidates()
    - Возвращает результаты для сохранения
    - _Requirements: 5.1, 6.4_
  - [x] 11.3 Реализовать getRankedCandidates()
    - Читает уже рассчитанные данные из БД
    - Фильтрация по minScore и recommendation
    - Пагинация
    - _Requirements: 5.2, 5.3, 5.7_
  - [x] 11.4 Реализовать saveRankings()
    - Сохраняет scores, ranking_position, strengths, weaknesses, recommendation, ranking_analysis в БД
    - Обновляет rankedAt timestamp
    - _Requirements: 6.3, 6.4_

- [x] 12. Реализация API endpoints
  - [x] 12.1 Создать packages/api/src/routers/gig/responses/ranked.ts
    - Input: gigId, workspaceId, minScore?, recommendation?, limit, offset
    - Output: RankingResult с полными данными кандидатов
    - _Requirements: 5.1-5.7_
  - [x] 12.2 Создать packages/api/src/routers/gig/responses/recalculate-ranking.ts
    - Input: gigId, workspaceId
    - Mutation для триггера фоновой задачи пересчета (отправляет событие в Inngest)
    - _Requirements: 6.3_
  - [x] 12.3 Обновить packages/api/src/routers/gig/responses/index.ts
    - Добавить ranked и recalculateRanking в роутер
    - _Requirements: 5.1-5.7, 6.3_
  - [ ]* 12.4 Написать integration tests для API endpoints

- [x] 13. Checkpoint - Проверка API
  - Убедиться что все тесты проходят
  - Проверить API через tRPC playground

- [x] 14. Реализация фоновой задачи пересчета
  - [x] 14.1 Создать packages/jobs/src/inngest/functions/response/recalculate-ranking.ts
    - Inngest функция для пересчета рейтинга
    - Использует RankingService из packages/api
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 14.2 Добавить триггер при создании отклика
    - Обновить packages/api/src/routers/gig/responses/create.ts
    - Отправить событие в Inngest после создания
    - _Requirements: 6.1_
  - [x] 14.3 Добавить триггер при обновлении screening
    - Обновить соответствующий роутер для screening
    - Отправить событие в Inngest после обновления
    - _Requirements: 6.2_
  - [x] 14.4 Добавить триггер при обновлении interview
    - Обновить соответствующий роутер для interview
    - Отправить событие в Inngest после обновления
    - _Requirements: 6.2_
  - [x] 14.5 Зарегистрировать функцию в packages/jobs/src/inngest/functions/index.ts
    - Экспортировать новую функцию
    - _Requirements: 6.1-6.3_

- [x] 15. Реализация UI компонентов
  - [x] 15.1 Создать apps/app/src/components/gig/ranked-candidate-card.tsx
    - Отображение позиции, compositeScore с прогресс-баром
    - Badge рекомендации с цветовой кодировкой
    - Breakdown отдельных scores
    - Strengths/weaknesses badges
    - _Requirements: 7.1-7.6_
  - [x] 15.2 Создать apps/app/src/components/gig/ranking-list.tsx
    - Список ранжированных кандидатов
    - Подсветка top 3
    - Quick actions: Accept, Reject, Message, Details
    - _Requirements: 7.7, 7.8_
  - [x] 15.3 Создать apps/app/src/components/gig/candidate-comparison.tsx
    - Side-by-side сравнение 2-3 кандидатов
    - Визуализация различий по критериям
    - _Requirements: 7.9_
  - [x] 15.4 Создать страницу apps/app/src/app/orgs/[orgSlug]/workspaces/[workspaceSlug]/gigs/[gigId]/ranking/page.tsx
    - Интеграция всех компонентов
    - Фильтры и пагинация
    - Кнопка пересчета рейтинга
    - _Requirements: 7.1-7.9_

- [x] 16. Final Checkpoint
  - Убедиться что все тесты проходят
  - Проверить полный user flow в UI
  - Проверить производительность на большом количестве кандидатов
  - Проверить качество AI outputs на реальных данных

## Notes

- Задачи помеченные `*` являются опциональными (тесты) и могут быть пропущены для быстрого MVP
- Каждая задача ссылается на конкретные требования для трассируемости
- Checkpoints обеспечивают инкрементальную валидацию после каждого агента
- AI агенты используют BaseToolLoopAgent из packages/ai для consistency
- Все AI промпты централизованы в prompts.ts для легкого обновления
- RankingOrchestrator координирует последовательное выполнение агентов
- Фоновая задача в Inngest обеспечивает автоматический пересчет при событиях
