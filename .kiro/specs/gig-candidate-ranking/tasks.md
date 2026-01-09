# Implementation Plan: Gig Candidate Ranking

## Overview

Реализация системы ранжирования кандидатов для gig заданий. Включает расширение схемы БД, создание сервисов для расчета оценок, сравнительного анализа и формирования рекомендаций, а также API endpoints и UI компоненты.

## Tasks

- [ ] 1. Расширение схемы базы данных
  - [ ] 1.1 Добавить enum gigRecommendationEnum в packages/db/src/schema/gig/response.ts
    - Значения: HIGHLY_RECOMMENDED, RECOMMENDED, NEUTRAL, NOT_RECOMMENDED
    - _Requirements: 1.10_
  - [ ] 1.2 Добавить новые поля в таблицу gigResponse
    - compositeScore, priceScore, deliveryScore, skillsMatchScore, experienceScore (integer 0-100)
    - rankingPosition (integer)
    - rankingAnalysis (text)
    - strengths, weaknesses (jsonb array)
    - recommendation (enum)
    - rankedAt (timestamp)
    - _Requirements: 1.1-1.10_
  - [ ] 1.3 Добавить индексы для новых полей
    - Индекс на compositeScore для сортировки
    - Индекс на recommendation для фильтрации
    - Индекс на rankingPosition
    - _Requirements: 5.1, 5.2_
  - [ ] 1.4 Обновить Zod схемы и типы
    - Обновить CreateGigResponseSchema
    - Экспортировать новые типы
    - _Requirements: 1.1-1.10_

- [ ] 2. Checkpoint - Проверка схемы
  - Убедиться что схема компилируется без ошибок
  - Проверить типы TypeScript

- [ ] 3. Реализация ScoreCalculator
  - [ ] 3.1 Создать файл packages/api/src/services/gig/ranking/score-calculator.ts
    - Определить интерфейсы ScoreWeights, CandidateScores, ScoreCalculatorInput
    - Реализовать класс ScoreCalculator
    - _Requirements: 2.1-2.8_
  - [ ] 3.2 Реализовать calculatePriceScore
    - Формула на основе бюджета и сравнения с другими кандидатами
    - Обработка null значений
    - _Requirements: 2.3_
  - [ ] 3.3 Реализовать calculateDeliveryScore
    - Формула на основе дедлайна и сравнения с другими кандидатами
    - Обработка null значений
    - _Requirements: 2.4_
  - [ ] 3.4 Реализовать calculateSkillsMatchScore
    - Matching required_skills (70%) и nice_to_have_skills (30%)
    - _Requirements: 2.5_
  - [ ] 3.5 Реализовать calculateCompositeScore
    - Взвешенное среднее с перераспределением весов для отсутствующих компонентов
    - _Requirements: 2.7, 2.8_
  - [ ]* 3.6 Написать property test для calculateCompositeScore
    - **Property 2: Composite score is weighted average**
    - **Validates: Requirements 2.7, 2.8**
  - [ ]* 3.7 Написать property test для score bounds
    - **Property 1: Score fields are bounded**
    - **Validates: Requirements 1.1-1.5**
  - [ ]* 3.8 Написать property test для calculatePriceScore
    - **Property 3: Price score calculation**
    - **Validates: Requirements 2.3**
  - [ ]* 3.9 Написать property test для calculateSkillsMatchScore
    - **Property 12: Skills match score calculation**
    - **Validates: Requirements 2.5**

- [ ] 4. Checkpoint - Проверка ScoreCalculator
  - Убедиться что все тесты проходят
  - Проверить edge cases

- [ ] 5. Реализация ComparisonEngine
  - [ ] 5.1 Создать файл packages/api/src/services/gig/ranking/comparison-engine.ts
    - Определить интерфейсы CandidateComparison, ComparisonResult
    - Реализовать класс ComparisonEngine
    - _Requirements: 3.1-3.6_
  - [ ] 5.2 Реализовать calculatePercentileRank
    - Формула: (count of lower values) / (n - 1) * 100
    - _Requirements: 3.3_
  - [ ] 5.3 Реализовать identifyStrengths и identifyWeaknesses
    - Threshold 75% для strengths, 25% для weaknesses
    - Ограничение до 3 элементов
    - _Requirements: 3.4, 3.5, 4.6_
  - [ ] 5.4 Реализовать compareAllCandidates
    - Сравнение всех кандидатов по всем критериям
    - Определение лидеров по категориям
    - _Requirements: 3.1, 3.2_
  - [ ]* 5.5 Написать property test для calculatePercentileRank
    - **Property 5: Percentile calculation correctness**
    - **Validates: Requirements 3.3**
  - [ ]* 5.6 Написать property test для identifyStrengths/Weaknesses
    - **Property 6: Strengths and weaknesses identification**
    - **Validates: Requirements 3.4, 3.5, 4.6**
  - [ ]* 5.7 Написать property test для category leaders
    - **Property 14: Category leaders identification**
    - **Validates: Requirements 3.2**

- [ ] 6. Реализация RecommendationEngine
  - [ ] 6.1 Создать файл packages/api/src/services/gig/ranking/recommendation-engine.ts
    - Определить интерфейсы RecommendationResult
    - Реализовать класс RecommendationEngine
    - _Requirements: 4.1-4.6_
  - [ ] 6.2 Реализовать determineStatus
    - Пороговые значения: 80, 60, 40
    - _Requirements: 4.1-4.4_
  - [ ] 6.3 Реализовать generateRecommendation
    - Формирование статуса, анализа, top 3 strengths/weaknesses
    - _Requirements: 4.5, 4.6_
  - [ ]* 6.4 Написать property test для determineStatus
    - **Property 4: Recommendation status matches score thresholds**
    - **Validates: Requirements 4.1-4.4**

- [ ] 7. Checkpoint - Проверка engines
  - Убедиться что все тесты проходят
  - Проверить интеграцию между компонентами

- [ ] 8. Реализация RankingService
  - [ ] 8.1 Создать файл packages/api/src/services/gig/ranking/ranking-service.ts
    - Определить интерфейсы RankedCandidate, RankingResult
    - Реализовать класс RankingService
    - _Requirements: 5.1-5.7, 6.1-6.4_
  - [ ] 8.2 Реализовать calculateRankings
    - Оркестрация ScoreCalculator, ComparisonEngine, RecommendationEngine
    - Сортировка по compositeScore
    - Присвоение rankingPosition
    - _Requirements: 5.1, 6.4_
  - [ ] 8.3 Реализовать getRankedCandidates
    - Фильтрация по minScore и recommendation
    - Пагинация
    - Исключение rejected кандидатов
    - _Requirements: 5.2, 5.3, 5.7, 8.5_
  - [ ] 8.4 Реализовать recalculateRankings
    - Пересчет всех оценок и позиций
    - Сохранение в БД
    - _Requirements: 6.3, 6.4_
  - [ ] 8.5 Реализовать tiebreaker логику
    - При одинаковых scores использовать createdAt
    - _Requirements: 8.3_
  - [ ] 8.6 Реализовать обработку edge cases
    - Один кандидат
    - Отсутствие данных по критериям
    - _Requirements: 8.1, 8.2, 8.4_
  - [ ]* 8.7 Написать property test для ranking position
    - **Property 9: Ranking position uniqueness and ordering**
    - **Validates: Requirements 1.6, 6.4**
  - [ ]* 8.8 Написать property test для tiebreaker
    - **Property 10: Tiebreaker by creation date**
    - **Validates: Requirements 8.3**
  - [ ]* 8.9 Написать property test для rejected exclusion
    - **Property 11: Rejected candidates excluded from ranking**
    - **Validates: Requirements 8.5**
  - [ ]* 8.10 Написать property test для weight redistribution
    - **Property 13: Missing data weight redistribution**
    - **Validates: Requirements 8.4**

- [ ] 9. Checkpoint - Проверка RankingService
  - Убедиться что все тесты проходят
  - Проверить полный flow расчета рейтинга

- [ ] 10. Реализация API endpoints
  - [ ] 10.1 Создать packages/api/src/routers/gig/responses/ranked.ts
    - Input: gigId, workspaceId, minScore?, recommendation?, limit, offset
    - Output: RankingResult с полными данными кандидатов
    - _Requirements: 5.1-5.7_
  - [ ] 10.2 Создать packages/api/src/routers/gig/responses/recalculate-ranking.ts
    - Input: gigId, workspaceId
    - Mutation для пересчета рейтинга
    - _Requirements: 6.3_
  - [ ] 10.3 Обновить packages/api/src/routers/gig/responses/index.ts
    - Добавить ranked и recalculateRanking в роутер
    - _Requirements: 5.1-5.7, 6.3_
  - [ ]* 10.4 Написать property test для API sorting/filtering
    - **Property 7: API returns sorted and filtered results**
    - **Validates: Requirements 5.1, 5.2, 5.3**
  - [ ]* 10.5 Написать property test для pagination
    - **Property 8: Pagination correctness**
    - **Validates: Requirements 5.7**

- [ ] 11. Checkpoint - Проверка API
  - Убедиться что все тесты проходят
  - Проверить API через tRPC playground

- [ ] 12. Реализация UI компонентов
  - [ ] 12.1 Создать apps/app/src/components/gig/ranked-candidate-card.tsx
    - Отображение позиции, compositeScore с прогресс-баром
    - Badge рекомендации с цветовой кодировкой
    - Breakdown отдельных scores
    - Strengths/weaknesses badges
    - _Requirements: 7.1-7.6_
  - [ ] 12.2 Создать apps/app/src/components/gig/ranking-list.tsx
    - Список ранжированных кандидатов
    - Подсветка top 3
    - Quick actions: Accept, Reject, Message, Details
    - _Requirements: 7.7, 7.8_
  - [ ] 12.3 Создать apps/app/src/components/gig/candidate-comparison.tsx
    - Side-by-side сравнение 2-3 кандидатов
    - Визуализация различий по критериям
    - _Requirements: 7.9_
  - [ ] 12.4 Создать страницу apps/app/src/app/orgs/[orgSlug]/workspaces/[workspaceSlug]/gigs/[gigId]/ranking/page.tsx
    - Интеграция всех компонентов
    - Фильтры и пагинация
    - Кнопка пересчета рейтинга
    - _Requirements: 7.1-7.9_

- [ ] 13. Интеграция автоматического пересчета
  - [ ] 13.1 Добавить триггер пересчета при создании отклика
    - Обновить packages/api/src/routers/gig/responses/create.ts
    - _Requirements: 6.1_
  - [ ] 13.2 Добавить триггер пересчета при обновлении screening/interview
    - Создать event handler или использовать database trigger
    - _Requirements: 6.2_

- [ ] 14. Final Checkpoint
  - Убедиться что все тесты проходят
  - Проверить полный user flow в UI
  - Проверить производительность на большом количестве кандидатов

## Notes

- Задачи помеченные `*` являются опциональными (тесты) и могут быть пропущены для быстрого MVP
- Каждая задача ссылается на конкретные требования для трассируемости
- Checkpoints обеспечивают инкрементальную валидацию
- Property tests валидируют универсальные свойства корректности
- Unit tests валидируют конкретные примеры и edge cases
