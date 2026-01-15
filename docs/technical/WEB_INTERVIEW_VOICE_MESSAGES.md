# Голосовые сообщения в веб-интервью

## Обзор

Добавлена полная поддержка голосовых сообщений в веб-интервью с автоматической транскрипцией, аналогично функционалу Telegram-интервью.

## Реализованные возможности

### 1. Запись и отправка голосовых сообщений

- **Компонент**: `apps/app/src/components/ai-chat/interview-chat.tsx`
- Кандидаты могут записывать голосовые сообщения прямо в браузере
- Поддержка форматов: WebM (Opus), WebM, MP4, OGG, WAV
- Максимальная длительность: 5 минут (300 секунд)
- Максимальный размер файла: 25 МБ

### 2. API для загрузки голосовых файлов

- **Endpoint**: `POST /api/interview/upload-voice`
- **Файл**: `apps/app/src/app/api/interview/upload-voice/route.ts`

**Параметры запроса:**
```typescript
{
  conversationId: string;  // UUID беседы
  audioFile: string;       // base64-encoded аудио
  fileName: string;        // Имя файла
  mimeType: string;        // MIME-тип (audio/webm, audio/mp4, и т.д.)
  duration?: number;       // Длительность в секундах
}
```

**Процесс обработки:**
1. Проверка существования и статуса беседы (только WEB, ACTIVE)
2. Декодирование base64 и проверка размера файла
3. Загрузка в S3 (префикс `voice/`)
4. Создание записи в таблице `files`
5. Создание сообщения в `conversation_messages` с типом VOICE
6. Отправка события `telegram/voice.transcribe` в Inngest для транскрибации

### 3. Автоматическая транскрибация

- **Сервис**: `packages/jobs/src/inngest/functions/telegram/transcribe-voice.ts`
- Использует OpenAI Whisper API через AI proxy
- Язык транскрибации: русский
- После транскрибации:
  - Обновляется поле `voice_transcription` в БД
  - Транскрипция используется AI для анализа ответа
  - Сообщение отображается в UI с аудиоплеером и текстом

### 4. Отображение голосовых сообщений

**В истории чата:**
- Аудиоплеер с кнопкой воспроизведения
- Отображение длительности
- Текст транскрипции под плеером (если доступен)
- Сообщение "Аудиозапись недоступна" если файл отсутствует

**В карточке интервью:**
- Компонент `VoicePlayer` для воспроизведения
- Транскрипция отображается как текст
- Временные метки и информация об отправителе

### 5. Обновленные API endpoints

#### `getChatHistory`
- **Файл**: `packages/api/src/routers/freelance-platforms/get-chat-history.ts`
- Теперь включает:
  - `fileUrl` - presigned URL для скачивания аудио (5 минут)
  - `voiceTranscription` - расшифрованный текст
  - `contentType` - тип сообщения (TEXT/VOICE)

#### `/api/interview/chat/stream`
- **Файл**: `apps/app/src/app/api/interview/chat/stream/route.ts`
- Обновлено для учета голосовых сообщений:
  - Загружает историю с файлами
  - Использует транскрипции в контексте для AI
  - Не дублирует сохранение голосовых (они уже сохранены через upload-voice)

## Схема базы данных

### Таблица `conversation_messages`

```sql
- id: UUID (primary key)
- conversation_id: UUID (foreign key)
- sender: ENUM (CANDIDATE, BOT, ADMIN)
- content_type: ENUM (TEXT, VOICE)
- channel: ENUM (TELEGRAM, HH, WEB)
- content: TEXT (транскрипция для VOICE)
- file_id: UUID (foreign key to files, nullable)
- voice_duration: VARCHAR(20) (формат "M:SS")
- voice_transcription: TEXT (nullable)
- created_at: TIMESTAMP
```

### Таблица `files`

```sql
- id: UUID (primary key)
- provider: ENUM (S3)
- key: TEXT (S3 ключ, префикс "voice/")
- file_name: VARCHAR(500)
- mime_type: VARCHAR(100)
- file_size: VARCHAR(50)
- metadata: JSONB
- created_at: TIMESTAMP
```

## Поток данных

```
1. Пользователь записывает голос в браузере
   ↓
2. InterviewChat.handleSendMessage() конвертирует в base64
   ↓
3. POST /api/interview/upload-voice
   ↓
4. Загрузка в S3 + создание записей в БД
   ↓
5. Inngest event: telegram/voice.transcribe
   ↓
6. transcribeVoiceFunction:
   - Скачивает файл из S3
   - Отправляет в OpenAI Whisper
   - Обновляет voice_transcription в БД
   ↓
7. UI обновляется через getChatHistory
   - Показывает аудиоплеер
   - Отображает транскрипцию
   ↓
8. AI использует транскрипцию для анализа ответа
```

## Компоненты UI

### `AIChatInput`
- **Файл**: `apps/app/src/components/ai-chat/ai-chat-input.tsx`
- Кнопка записи голоса (микрофон)
- Индикатор записи с таймером
- Превью записанного аудио
- Поддержка отмены записи

### `InterviewChat`
- **Файл**: `apps/app/src/components/ai-chat/interview-chat.tsx`
- Обработка отправки голосовых сообщений
- Конвертация в base64
- Получение длительности аудио
- Отображение голосовых в истории

### `VoicePlayer`
- **Файл**: `apps/app/src/components/response-detail/voice-player.tsx`
- Кнопка Play/Pause
- Прогресс воспроизведения
- Отображение времени (текущее/общее)

## Безопасность

1. **Проверка беседы**: Только WEB интервью со статусом ACTIVE
2. **Размер файла**: Максимум 25 МБ
3. **Формат файла**: Только аудио форматы
4. **Presigned URLs**: Временные ссылки на 5 минут для скачивания
5. **Публичный endpoint**: Защищен проверкой conversationId

## Производительность

- Асинхронная транскрибация через Inngest
- Presigned URLs для прямого доступа к S3
- Оптимизированная загрузка истории с join файлов
- Кэширование на уровне браузера для аудиофайлов

## Совместимость

- **Браузеры**: Chrome, Firefox, Safari, Edge (поддержка MediaRecorder API)
- **Мобильные**: iOS Safari, Chrome Mobile, Firefox Mobile
- **Форматы**: Автоматический выбор лучшего доступного формата

## Будущие улучшения

- [ ] Визуализация аудио волны
- [ ] Поддержка загрузки готовых аудиофайлов
- [ ] Сжатие аудио перед отправкой
- [ ] Офлайн режим с отложенной отправкой
- [ ] Индикатор статуса транскрибации в реальном времени
