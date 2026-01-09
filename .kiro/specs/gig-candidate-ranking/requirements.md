# Requirements Document

## Introduction

Функционал "Финальный список кандидатов" для gig заданий позволяет получить отсортированный список лучших кандидатов с полной аналитикой и рекомендациями. Система анализирует всех кандидатов, сравнивает их между собой по множеству критериев и формирует итоговый рейтинг с обоснованием.

## Glossary

- **Ranking_System**: AI-powered система ранжирования кандидатов, использующая LLM для интеллектуальной оценки и сравнения
- **Candidate_Evaluator_Agent**: AI агент, оценивающий одного кандидата по всем критериям с учетом контекста
- **Comparison_Agent**: AI агент, сравнивающий кандидатов между собой и выявляющий относительные преимущества
- **Recommendation_Agent**: AI агент, формирующий финальную рекомендацию на основе оценок и сравнения
- **Ranking_Orchestrator**: Координатор, управляющий процессом ранжирования через AI агентов
- **Gig_Response**: Отклик кандидата на gig задание
- **Screening_Score**: Оценка скрининга портфолио (0-100), уже рассчитанная ранее
- **Interview_Score**: Оценка интервью (0-100), уже рассчитанная ранее
- **Price_Score**: AI-оценка соотношения цена/качество (0-100) с учетом бюджета и рынка
- **Delivery_Score**: AI-оценка по срокам выполнения (0-100) с учетом дедлайна и реалистичности
- **Experience_Score**: AI-оценка релевантного опыта (0-100) на основе портфолио и требований
- **Skills_Match_Score**: AI-оценка соответствия навыков (0-100) с учетом required и nice-to-have
- **Composite_Score**: Итоговая оценка кандидата (0-100), рассчитанная AI с учетом всех факторов

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

### Requirement 2: AI-оценка кандидата

**User Story:** As a recruiter, I want the AI to intelligently evaluate each candidate considering context and nuances, so that I get more accurate assessments than simple formulas.

#### Acceptance Criteria

1. THE Candidate_Evaluator_Agent SHALL analyze candidate data and gig requirements to produce contextual scores
2. WHEN evaluating price, THE Agent SHALL consider: proposed price vs budget, market rates, candidate's experience level, and value proposition
3. WHEN evaluating delivery time, THE Agent SHALL consider: proposed days vs deadline, project complexity, candidate's workload signals, and realism of estimate
4. WHEN evaluating skills match, THE Agent SHALL analyze: required_skills coverage (70% weight), nice_to_have_skills coverage (30% weight), skill depth from portfolio/experience
5. WHEN evaluating experience, THE Agent SHALL analyze: portfolio relevance, similar project experience, years of experience, and quality indicators
6. THE Agent SHALL incorporate existing screening_score and interview_score (if available) into evaluation
7. THE Agent SHALL calculate composite_score (0-100) considering all factors with intelligent weighting based on data availability and quality
8. THE Agent SHALL provide reasoning for each score to ensure transparency

### Requirement 3: AI-сравнение кандидатов

**User Story:** As a recruiter, I want the AI to compare candidates intelligently, so that I understand not just numbers but meaningful differences.

#### Acceptance Criteria

1. THE Comparison_Agent SHALL analyze all candidates for a gig and identify relative strengths/weaknesses
2. THE Agent SHALL identify category leaders (best price, fastest delivery, strongest skills match, most experienced, highest screening, best interview)
3. THE Agent SHALL determine each candidate's competitive position within the pool
4. THE Agent SHALL identify up to 3 key strengths per candidate based on: top performance in categories, unique advantages, standout qualities
5. THE Agent SHALL identify up to 3 key weaknesses per candidate based on: bottom performance in categories, concerning gaps, risk factors
6. THE Agent SHALL generate ranking_analysis text explaining: why this ranking position, how candidate compares to others, what makes them stand out or fall behind
7. THE Agent SHALL consider context: "slightly higher price but significantly better experience" vs "cheapest but concerning lack of portfolio"

### Requirement 4: AI-рекомендации

**User Story:** As a recruiter, I want the AI to provide nuanced recommendations beyond just scores, so that I can make better hiring decisions.

#### Acceptance Criteria

1. THE Recommendation_Agent SHALL determine recommendation status considering: composite_score, qualitative factors, red flags, and hiring context
2. THE Agent SHALL use composite_score as primary signal: >=80 suggests HIGHLY_RECOMMENDED, >=60 suggests RECOMMENDED, >=40 suggests NEUTRAL, <40 suggests NOT_RECOMMENDED
3. THE Agent MAY adjust recommendation based on qualitative factors: communication quality, portfolio red flags, unrealistic estimates, professionalism signals
4. THE Agent SHALL generate ranking_analysis explaining: final recommendation reasoning, key decision factors, risks and opportunities, comparison to other candidates
5. THE Agent SHALL incorporate strengths/weaknesses from Comparison_Agent into final recommendation narrative
6. THE Agent SHALL provide actionable insights: "Strong candidate but verify availability" or "Lower score but good culture fit potential"

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
