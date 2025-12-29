-- Добавляем колонку slug в таблицу interview_links
ALTER TABLE interview_links ADD COLUMN IF NOT EXISTS slug VARCHAR(100);

-- Создаем временную функцию для генерации slug
CREATE OR REPLACE FUNCTION generate_interview_slug() RETURNS VARCHAR(100) AS $$
DECLARE
    adjectives TEXT[] := ARRAY['quick', 'bright', 'clever', 'smart', 'swift', 'bold', 'calm', 'cool',
                                'eager', 'fair', 'gentle', 'happy', 'jolly', 'kind', 'lively', 'merry',
                                'nice', 'proud', 'quiet', 'sharp', 'wise', 'witty', 'brave', 'fresh'];
    nouns TEXT[] := ARRAY['fox', 'wolf', 'bear', 'lion', 'tiger', 'eagle', 'hawk', 'owl',
                          'deer', 'horse', 'panda', 'koala', 'otter', 'seal', 'whale', 'shark',
                          'dragon', 'phoenix', 'falcon', 'raven', 'lynx', 'jaguar', 'leopard', 'cheetah'];
    adjective TEXT;
    noun TEXT;
    number INT;
    slug TEXT;
    exists_count INT;
BEGIN
    LOOP
        adjective := adjectives[1 + floor(random() * array_length(adjectives, 1))::int];
        noun := nouns[1 + floor(random() * array_length(nouns, 1))::int];
        number := floor(random() * 100)::int;
        slug := adjective || '-' || noun || '-' || number;
        
        SELECT COUNT(*) INTO exists_count FROM interview_links WHERE interview_links.slug = slug;
        
        IF exists_count = 0 THEN
            RETURN slug;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Заполняем slug для существующих записей
UPDATE interview_links 
SET slug = generate_interview_slug() 
WHERE slug IS NULL;

-- Удаляем временную функцию
DROP FUNCTION generate_interview_slug();

-- Делаем slug обязательным и уникальным
ALTER TABLE interview_links ALTER COLUMN slug SET NOT NULL;
ALTER TABLE interview_links ADD CONSTRAINT interview_links_slug_unique UNIQUE (slug);

-- Создаем индекс для slug
CREATE INDEX IF NOT EXISTS interview_link_slug_idx ON interview_links(slug);
