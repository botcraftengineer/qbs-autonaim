# Руководство по переносу данных между серверами

## Два способа переноса данных

### Способ 1: pg_dump (Рекомендуется для больших БД)

Самый быстрый и надёжный способ. Использует стандартные утилиты PostgreSQL.

**Требования:**
- Установленные `pg_dump` и `psql` (входят в PostgreSQL)

**Использование:**

```bash
cd packages/db

# Установить переменные окружения
SOURCE_DB_URL="postgres://user:pass@old-server.com:5432/dbname"
TARGET_DB_URL="postgres://user:pass@new-server.com:5432/dbname"

# Запустить миграцию
bun run migrate-server-dump
```

**Что происходит:**
1. Создаётся дамп данных со старого сервера (только данные, без схемы)
2. Дамп восстанавливается на новом сервере
3. Временный файл удаляется

**Преимущества:**
- ✅ Очень быстро (использует нативные инструменты PostgreSQL)
- ✅ Надёжно для больших объёмов данных
- ✅ Поддерживает все типы данных PostgreSQL

**Недостатки:**
- ⚠️ Требует установки PostgreSQL клиента
- ⚠️ Создаёт временный файл на диске

---

### Способ 2: Прямой перенос через Drizzle

Переносит данные напрямую между серверами без промежуточных файлов.

**Использование:**

```bash
cd packages/db

# Установить переменные окружения
SOURCE_DB_URL="postgres://user:pass@old-server.com:5432/dbname"
TARGET_DB_URL="postgres://user:pass@new-server.com:5432/dbname"

# Запустить миграцию
bun run migrate-server
```

**Что происходит:**
1. Подключается к обоим серверам одновременно
2. Читает данные из каждой таблицы на старом сервере
3. Вставляет данные на новый сервер пакетами по 100 записей
4. Использует `ON CONFLICT DO NOTHING` для безопасности

**Преимущества:**
- ✅ Не требует дополнительных утилит
- ✅ Не создаёт временные файлы
- ✅ Показывает прогресс для каждой таблицы

**Недостатки:**
- ⚠️ Медленнее для больших объёмов данных
- ⚠️ Требует стабильного соединения с обоими серверами

---

## Подготовка к миграции

### 1. Создать схему на новом сервере

```bash
cd packages/db

# Применить схему на новом сервере
TARGET_DB_URL="postgres://..." bun run push
```

### 2. Проверить подключение к обоим серверам

```bash
# Проверка старого сервера
psql "postgres://user:pass@old-server.com:5432/dbname" -c "SELECT version();"

# Проверка нового сервера
psql "postgres://user:pass@new-server.com:5432/dbname" -c "SELECT version();"
```

### 3. Сделать бэкап (рекомендуется!)

```bash
pg_dump "postgres://user:pass@old-server.com:5432/dbname" > backup.sql
```

---

## Проверка после миграции

```sql
-- Подключиться к новому серверу
psql "postgres://user:pass@new-server.com:5432/dbname"

-- Проверить количество записей в основных таблицах
SELECT 'workspaces' as table_name, COUNT(*) FROM workspaces
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'vacancies', COUNT(*) FROM vacancies
UNION ALL
SELECT 'vacancy_responses', COUNT(*) FROM vacancy_responses
UNION ALL
SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL
SELECT 'messages', COUNT(*) FROM messages;
```

---

## Частичная миграция (только определённые таблицы)

Если нужно перенести только определённые таблицы:

```bash
# Используя pg_dump
pg_dump "SOURCE_URL" \
  --data-only \
  --table=workspaces \
  --table=users \
  --table=vacancies \
  > partial_dump.sql

psql "TARGET_URL" < partial_dump.sql
```

---

## Откат изменений

Если что-то пошло не так:

```bash
# Восстановить из бэкапа
psql "TARGET_URL" < backup.sql
```

---

## Troubleshooting

### Ошибка: "pg_dump: command not found"

Установите PostgreSQL клиент:

**macOS:**
```bash
brew install postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-client
```

**Windows:**
Скачайте с https://www.postgresql.org/download/windows/

### Ошибка: "duplicate key value violates unique constraint"

Это нормально при повторном запуске. Скрипты используют `ON CONFLICT DO NOTHING`.

### Медленная миграция

Используйте `migrate-server-dump` вместо `migrate-server` для больших БД.

---

## Пример полной миграции

```bash
# 1. Создать бэкап
pg_dump "postgres://old-server/db" > backup.sql

# 2. Применить схему на новом сервере
cd packages/db
POSTGRES_URL="postgres://new-server/db" bun run push

# 3. Перенести данные
SOURCE_DB_URL="postgres://old-server/db" \
TARGET_DB_URL="postgres://new-server/db" \
bun run migrate-server-dump

# 4. Проверить данные
psql "postgres://new-server/db" -c "SELECT COUNT(*) FROM users;"

# 5. Обновить .env
# Заменить POSTGRES_URL на новый сервер
```
