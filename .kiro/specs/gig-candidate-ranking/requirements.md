# Requirements Document

## Introduction

Функционал "Финальный список кандидатов" для gig заданий позволяет получить отсортированный список лучших кандидатов с полной аналитикой и рекомендациями. Система анализирует всех кандидатов, сравнивает их между собой по множеству критериев и формирует итоговый рейтинг с обоснованием.

## Glossary

- **Ranking_System**: Система ранжирования кандидатов, которая вычисляет комплексную оценку на основе множества факторов
- **Candidate_Score**: Комплексная оценка кандидата (0-100), учитывающая все факторы
- **Comparison_Matrix**: Матрица попарного сравнения кандидатов по ключевым критериям
- **Recommendation_Engine**: Компонент, формирующий рекомендации по выбору кандидата
- **Gig_Response**: Отклик кандидата на gig задание
- **Screening_Score**: Оценка скрининга портфолио (0-100)
- **Interview_Score**: Оценка интервью (0-100)
- **Price_Score**: Оценка соотношения цена/качество (0-100)
- **Delivery_Score**: Оценка по срокам выполнения (0-100)
- **Experience_Score**: Оценка релевантного опыта (0-100)

## Requirements

### Requirement 1: Расширение модели данных кандидата

**User Story:** As a recruiter, I want to have comprehensive candidate data stored, so that I can make informed decisions when comparing candidates.

#### Acceptance Criteria

1. THE Gig_Response_Schema SHALL include a composite_score field (integer 0-100) for storing the calculated overall candidate score
2. THE Gig_Response_Schema SHALL include a price_score field (integer 0-100) for storing price competitiveness evaluation
3. THE Gig_Response_Schema SHALL include a delivery_score field (integer 0-100) for storing delivery time evaluation
4. THE Gig_Response_Schema SHALL include an experience_score field (integer 0-100) for storing experience relevance evaluation
5. THE Gig_Response_Schema SHALL include a skills_match_score field (integer 0-100) for storing skills matching evaluation
6. THE Gig_Response_Schema SHALL include a ranking_position field (integer) for storing the candidate's position in the final ranking
7. THE Gig_Response_Schema SHALL include a ranking_analysis field (text) for storing AI-generated comparison analysis
8. THE Gig_Response_Schema SHALL include a strengths field (jsonb array of strings) for storing identified candidate strengths
9. THE Gig_Response_Schema SHALL include a weaknesses field (jsonb array of strings) for storing identified candidate weaknesses
10. THE Gig_Response_Schema SHALL include a recommendation field (enum: HIGHLY_RECOMMENDED, RECOMMENDED, NEUTRAL, NOT_RECOMMENDED) for storing the final recommendation

### Requirement 2: Вычисление комплексной оценки кандидата

**User Story:** As a recruiter, I want the system to calculate a comprehensive score for each candidate, so that I can quickly identify the best candidates.

#### Acceptance Criteria

1. WHEN a candidate has screening results, THE Ranking_System SHALL include the screening_score in the composite calculation with configurable weight
2. WHEN a candidate has interview results, THE Ranking_System SHALL include the interview_score in the composite calculation with configurable weight
3. WHEN a candidate has proposed a price, THE Ranking_System SHALL calculate price_score based on comparison with gig budget and other candidates' prices
4. WHEN a candidate has proposed delivery days, THE Ranking_System SHALL calculate delivery_score based on comparison with gig deadline and other candidates' delivery times
5. WHEN a candidate has listed skills, THE Ranking_System SHALL calculate skills_match_score based on matching with gig required_skills
6. WHEN a candidate has experience information, THE Ranking_System SHALL calculate experience_score based on relevance to gig requirements
7. THE Ranking_System SHALL calculate composite_score as weighted average of all available scores
8. IF any score component is missing, THEN THE Ranking_System SHALL use available scores and adjust weights proportionally

### Requirement 3: Сравнительный анализ кандидатов

**User Story:** As a recruiter, I want to see how candidates compare to each other, so that I can understand relative strengths and weaknesses.

#### Acceptance Criteria

1. WHEN ranking candidates, THE Comparison_Matrix SHALL compare each candidate against all other candidates for the same gig
2. THE Comparison_Matrix SHALL identify the best candidate for each criterion (price, delivery, skills, experience, screening, interview)
3. THE Comparison_Matrix SHALL calculate percentile ranking for each candidate within the candidate pool
4. WHEN a candidate is in top 25% for a criterion, THE System SHALL mark it as a strength
5. WHEN a candidate is in bottom 25% for a criterion, THE System SHALL mark it as a weakness
6. THE System SHALL generate a textual analysis explaining why each candidate received their ranking position

### Requirement 4: Формирование рекомендаций

**User Story:** As a recruiter, I want to receive clear recommendations, so that I can make faster hiring decisions.

#### Acceptance Criteria

1. WHEN composite_score >= 80, THE Recommendation_Engine SHALL assign HIGHLY_RECOMMENDED status
2. WHEN composite_score >= 60 AND composite_score < 80, THE Recommendation_Engine SHALL assign RECOMMENDED status
3. WHEN composite_score >= 40 AND composite_score < 60, THE Recommendation_Engine SHALL assign NEUTRAL status
4. WHEN composite_score < 40, THE Recommendation_Engine SHALL assign NOT_RECOMMENDED status
5. THE Recommendation_Engine SHALL generate ranking_analysis text explaining the recommendation
6. THE Recommendation_Engine SHALL highlight top 3 strengths and top 3 weaknesses for each candidate

### Requirement 5: API для получения ранжированного списка

**User Story:** As a frontend developer, I want an API endpoint to get ranked candidates, so that I can display the final list in the UI.

#### Acceptance Criteria

1. WHEN requesting ranked candidates, THE API SHALL return candidates sorted by composite_score descending
2. THE API SHALL support filtering by recommendation status (HIGHLY_RECOMMENDED, RECOMMENDED, etc.)
3. THE API SHALL support filtering by minimum composite_score threshold
4. THE API SHALL return all score components (price_score, delivery_score, skills_match_score, experience_score)
5. THE API SHALL return strengths and weaknesses arrays for each candidate
6. THE API SHALL return ranking_position and ranking_analysis for each candidate
7. THE API SHALL support pagination for large candidate pools

### Requirement 6: Пересчет рейтинга

**User Story:** As a recruiter, I want to trigger ranking recalculation, so that I can get updated rankings when new candidates apply or data changes.

#### Acceptance Criteria

1. WHEN a new candidate applies to a gig, THE System SHALL automatically recalculate rankings for all candidates
2. WHEN a candidate's screening or interview results are updated, THE System SHALL automatically recalculate rankings
3. THE API SHALL provide an endpoint to manually trigger ranking recalculation for a gig
4. WHEN recalculating rankings, THE System SHALL update ranking_position for all candidates
5. THE System SHALL preserve previous ranking data in history for comparison

### Requirement 7: UI для отображения финального списка

**User Story:** As a recruiter, I want a dedicated view for the final candidate list, so that I can easily review and select the best candidates.

#### Acceptance Criteria

1. WHEN viewing the final list, THE UI SHALL display candidates in a ranked order with position numbers
2. THE UI SHALL show composite_score prominently with a visual progress indicator
3. THE UI SHALL display recommendation badge (HIGHLY_RECOMMENDED, RECOMMENDED, etc.) with appropriate colors
4. THE UI SHALL show a breakdown of individual scores (price, delivery, skills, experience, screening, interview)
5. THE UI SHALL display strengths as positive badges and weaknesses as warning badges
6. THE UI SHALL provide expandable ranking_analysis section for each candidate
7. THE UI SHALL support quick actions: Accept, Reject, Send Message, View Details
8. THE UI SHALL highlight the top 3 candidates visually
9. THE UI SHALL provide comparison view to see 2-3 candidates side by side

### Requirement 8: Обработка граничных случаев

**User Story:** As a system, I want to handle edge cases gracefully, so that the ranking system works reliably.

#### Acceptance Criteria

1. WHEN a gig has only one candidate, THE System SHALL still calculate scores but skip comparative analysis
2. WHEN a gig has no candidates with complete data, THE System SHALL rank based on available data only
3. WHEN all candidates have identical scores, THE System SHALL use creation date as tiebreaker (earlier is better)
4. IF price or delivery data is missing for all candidates, THEN THE System SHALL exclude that criterion from ranking
5. WHEN a candidate is rejected (hrSelectionStatus = REJECTED), THE System SHALL exclude them from active ranking but preserve their data
