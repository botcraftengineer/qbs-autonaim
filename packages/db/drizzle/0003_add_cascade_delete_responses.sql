-- Добавляем cascade delete для responses при удалении gig
-- Это предотвратит "сиротские" записи в таблице responses

ALTER TABLE "responses"
ADD CONSTRAINT "responses_entity_id_gig_fk"
FOREIGN KEY ("entity_id") REFERENCES "gigs"("id")
ON DELETE CASCADE
ON UPDATE NO ACTION;

-- Также добавляем индекс для оптимизации запросов по entity_id
CREATE INDEX IF NOT EXISTS "responses_entity_type_entity_id_idx"
ON "responses"("entity_type", "entity_id");