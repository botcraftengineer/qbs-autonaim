# Requirements Document

## Introduction

Система преквалификации кандидатов — это white-label AI-сервис, который позволяет компаниям встраивать AI-ассистента на свои карьерные страницы для автоматической оценки соответствия кандидатов вакансиям до момента отклика. Кандидат загружает резюме, общается с AI, получает честную оценку и при достаточном соответствии автоматически направляется в отклик компании.

## Glossary

- **Candidate**: Пользователь, который загружает резюме и проходит преквалификацию через AI-ассистента
- **Company**: Организация-клиент, использующая сервис для преквалификации кандидатов (tenant)
- **AI_Assistant**: Интеллектуальный агент, проводящий диалог с кандидатом и оценивающий соответствие
- **Vacancy**: Вакансия компании с описанием требований и условий
- **Resume_Parser**: Компонент для извлечения структурированных данных из резюме (PDF/DOCX/LinkedIn)
- **Fit_Score**: Числовая оценка соответствия кандидата вакансии (0-100%)
- **Fit_Decision**: Итоговое решение по кандидату (strong_fit | potential_fit | not_fit)
- **AI_Summary**: Структурированный отчёт AI о кандидате для компании
- **Prequalification_Session**: Сессия взаимодействия кандидата с AI-ассистентом
- **Tenant**: Изолированное пространство данных компании в multi-tenant архитектуре
- **Widget**: Встраиваемый компонент (iframe/JS SDK) для размещения на сайте компании

## Requirements

### Requirement 1: Загрузка и парсинг резюме

**User Story:** As a Candidate, I want to upload my resume in various formats, so that the AI can analyze my experience and skills.

#### Acceptance Criteria

1. WHEN a Candidate uploads a PDF file, THE Resume_Parser SHALL extract text content and structure it into experience, skills, and education sections
2. WHEN a Candidate uploads a DOCX file, THE Resume_Parser SHALL extract text content and structure it into experience, skills, and education sections
3. WHEN a Candidate provides a LinkedIn profile URL, THE Resume_Parser SHALL fetch and parse public profile data
4. IF a Candidate uploads an unsupported file format, THEN THE System SHALL display an error message listing supported formats
5. IF a Candidate uploads a corrupted or unreadable file, THEN THE System SHALL display an error message and allow retry
6. WHEN resume parsing completes successfully, THE System SHALL store the structured data and initiate the AI dialogue

### Requirement 2: AI-диалог с кандидатом

**User Story:** As a Candidate, I want to have a conversation with the AI assistant, so that I can provide additional context about my experience and learn about my fit for the position.

#### Acceptance Criteria

1. WHEN a Prequalification_Session starts, THE AI_Assistant SHALL generate contextual questions based on the Vacancy requirements and parsed resume
2. WHEN the AI_Assistant asks a question, THE Candidate SHALL be able to respond with free-form text
3. WHILE the dialogue is in progress, THE AI_Assistant SHALL adapt follow-up questions based on Candidate responses
4. WHEN the AI_Assistant has gathered sufficient information, THE System SHALL proceed to fit evaluation
5. THE AI_Assistant SHALL respect the Company's configured tone setting (formal or friendly)
6. THE AI_Assistant SHALL include any mandatory questions configured by the Company

### Requirement 3: Оценка соответствия кандидата

**User Story:** As a Company, I want the AI to evaluate candidates against our requirements, so that I receive only qualified applicants.

#### Acceptance Criteria

1. WHEN evaluation begins, THE AI_Assistant SHALL assess the Candidate across hard skills, soft skills, culture fit, and salary expectations
2. WHEN evaluation completes, THE System SHALL calculate a Fit_Score as a percentage (0-100)
3. WHEN evaluation completes, THE System SHALL determine a Fit_Decision (strong_fit, potential_fit, or not_fit)
4. THE System SHALL compare the Fit_Score against the Company's configured threshold to determine pass/fail
5. WHEN evaluation completes, THE System SHALL generate an AI_Summary containing strengths, risks, and recommendation

### Requirement 4: Результат для кандидата

**User Story:** As a Candidate, I want to receive honest feedback about my fit, so that I understand my standing and can improve.

#### Acceptance Criteria

1. WHEN evaluation completes, THE System SHALL display the Fit_Decision to the Candidate
2. WHEN evaluation completes, THE System SHALL provide an explanation of the assessment to the Candidate
3. IF the Fit_Decision is strong_fit or potential_fit, THEN THE System SHALL offer the Candidate an option to proceed with the application
4. IF the Fit_Decision is not_fit, THEN THE System SHALL provide constructive feedback and suggest areas for improvement
5. THE System SHALL respect the Company's configured honesty level when displaying feedback

### Requirement 5: Результат для компании

**User Story:** As a Company recruiter, I want to receive structured candidate data with AI assessment, so that I can make informed hiring decisions quickly.

#### Acceptance Criteria

1. WHEN a Candidate passes prequalification, THE System SHALL create a structured candidate record containing parsed CV, AI_Summary, Fit_Score, strengths, risks, and recommendation
2. WHEN a candidate record is created, THE System SHALL deliver it via the Company's configured delivery method (webhook, API, ATS integration, or hh.ru)
3. THE System SHALL store all candidate records in the Company's isolated Tenant space
4. WHEN a Company requests candidate data, THE System SHALL return only candidates belonging to that Tenant

### Requirement 6: Настройка виджета и брендинга

**User Story:** As a Company administrator, I want to customize the widget appearance and AI behavior, so that it matches our brand and hiring process.

#### Acceptance Criteria

1. WHEN a Company configures branding, THE System SHALL apply custom logo, colors, texts, and AI assistant name to the Widget
2. WHEN a Company configures AI behavior, THE System SHALL apply the configured pass threshold, mandatory questions, tone, and honesty level
3. WHEN a Company configures legal settings, THE System SHALL display the configured consent text and disclaimers to Candidates
4. THE Widget SHALL be embeddable via iframe or JS SDK on the Company's website
5. WHERE a Company has configured a custom domain, THE Widget SHALL be accessible via that domain with valid SSL

### Requirement 7: Multi-tenant изоляция

**User Story:** As a platform operator, I want complete data isolation between companies, so that each tenant's data remains secure and private.

#### Acceptance Criteria

1. THE System SHALL isolate all Company data within separate Tenant boundaries
2. WHEN any data operation occurs, THE System SHALL verify Tenant ownership before allowing access
3. THE System SHALL maintain separate audit logs per Tenant
4. WHEN a Company requests data deletion, THE System SHALL remove all associated Candidate data from that Tenant

### Requirement 8: Согласие и compliance

**User Story:** As a Candidate, I want to provide informed consent for data processing, so that my privacy rights are respected.

#### Acceptance Criteria

1. WHEN a Prequalification_Session starts, THE System SHALL display consent text and require Candidate acceptance before proceeding
2. THE System SHALL encrypt all Candidate personal data at rest and in transit
3. WHEN a Candidate requests data deletion, THE System SHALL remove all their personal data within the legally required timeframe
4. THE System SHALL log all AI decisions and data access for audit purposes

### Requirement 9: Аналитика и отчётность

**User Story:** As a Company administrator, I want to view analytics and reports on prequalification performance, so that I can optimize my hiring process.

#### Acceptance Criteria

1. WHEN a Company accesses the analytics dashboard, THE System SHALL display total candidates, pass rate, average Fit_Score, and conversion metrics
2. WHEN a Company requests vacancy-level analytics, THE System SHALL show per-vacancy statistics including candidate volume, fit distribution, and time-to-qualify
3. WHEN a Company requests time-based reports, THE System SHALL provide data aggregated by day, week, or month
4. THE System SHALL track funnel metrics: widget views, sessions started, resumes uploaded, dialogues completed, candidates passed
5. WHEN a Company exports analytics data, THE System SHALL generate CSV or JSON format reports
6. THE System SHALL provide comparison metrics against previous periods (week-over-week, month-over-month)

### Requirement 10: Custom Domain через Yandex Cloud DNS

**User Story:** As a Company administrator, I want to use my own domain for the widget, so that candidates see our brand without any reference to hh.qbs.ru.

#### Acceptance Criteria

1. WHEN a Company configures a custom domain, THE System SHALL provide CNAME record instructions for Yandex Cloud DNS
2. WHEN a Company adds a CNAME record pointing to tenant.hh.qbs.ru, THE System SHALL automatically detect and verify the DNS configuration
3. WHEN DNS verification succeeds, THE System SHALL provision an SSL certificate for the custom domain
4. IF DNS verification fails, THEN THE System SHALL display the specific error and provide troubleshooting guidance
5. WHILE a custom domain is active, THE Widget SHALL be accessible via both the custom domain and the default tenant URL
6. WHEN SSL certificate is about to expire, THE System SHALL automatically renew it
7. THE System SHALL validate that the custom domain is not already in use by another Tenant
