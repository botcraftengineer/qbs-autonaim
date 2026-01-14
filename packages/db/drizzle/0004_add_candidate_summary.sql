-- Добавляем поле candidate_summary для краткого резюме кандидата в шортлисте
-- Это поле будет содержать краткий анализ кандидата (до 500 символов)

ALTER TABLE "responses"
ADD COLUMN "candidate_summary" text;

-- Добавляем комментарий к полю
COMMENT ON COLUMN "responses"."candidate_summary" IS 'Краткое резюме кандидата для отображения в шортлисте (до 500 символов)';