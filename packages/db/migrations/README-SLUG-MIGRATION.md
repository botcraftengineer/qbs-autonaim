# Миграция: Добавление slug в interview_links

## Описание
Эта миграция добавляет поле `slug` в таблицу `interview_links` для создания дружелюбных URL вместо UUID.

## Применение миграции

```bash
# Подключитесь к вашей базе данных и выполните:
psql -U your_user -d your_database -f add-slug-to-interview-links.sql
```

## Что делает миграция

1. Добавляет колонку `slug VARCHAR(100)` в таблицу `interview_links`
2. Генерирует уникальные slug для всех существующих записей в формате: `прилагательное-существительное-число` (например: `quick-fox-42`)
3. Делает колонку `slug` обязательной и уникальной
4. Создает индекс для быстрого поиска по slug

## Формат slug

Slug генерируется в формате: `{adjective}-{noun}-{number}`

Примеры:
- `quick-fox-42`
- `bright-eagle-17`
- `clever-wolf-89`

## Откат миграции (если нужно)

```sql
DROP INDEX IF EXISTS interview_link_slug_idx;
ALTER TABLE interview_links DROP CONSTRAINT IF EXISTS interview_links_slug_unique;
ALTER TABLE interview_links DROP COLUMN IF EXISTS slug;
```
