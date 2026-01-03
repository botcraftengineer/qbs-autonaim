# Resume Parser Service

Сервис для парсинга резюме из различных форматов документов с использованием Unstructured API и AI-структурирования.

## Возможности

- **Универсальный парсинг**: Поддержка PDF, DOCX, DOC, TXT, RTF, ODT через Unstructured API
- **AI-структурирование**: Автоматическое извлечение структурированных данных (имя, контакты, опыт, образование, навыки)
- **Валидация**: Проверка формата, размера файла и качества извлечённого текста
- **Обработка ошибок**: Понятные сообщения об ошибках на русском языке

## Архитектура

```
ResumeParserService
  ├── UnstructuredParser (извлечение текста через API)
  └── AI Agent (структурирование данных)
```

## Настройка

### 1. Запуск Unstructured через Docker

```bash
# Запустить все сервисы включая unstructured
docker-compose up -d unstructured

# Проверить статус
docker ps | grep unstructured
```

### 2. Переменные окружения

Добавьте в `.env`:

```env
# URL Unstructured API сервиса
UNSTRUCTURED_API_URL='http://localhost:8001'

# API ключ (опционально для локального Docker)
UNSTRUCTURED_API_KEY=''
```

### 3. Проверка работоспособности

```bash
# Проверить доступность API
curl http://localhost:8001/general/v0/general
```

## Использование

### Базовый пример

```typescript
import { ResumeParserService } from "@qbs-autonaim/api";
import { openai } from "@ai-sdk/openai";

const parser = new ResumeParserService({
  model: openai("gpt-4o-mini"),
  unstructuredApiUrl: process.env.UNSTRUCTURED_API_URL,
  unstructuredApiKey: process.env.UNSTRUCTURED_API_KEY,
});

// Валидация формата
const validation = parser.validateFormat("resume.pdf");
if (!validation.isValid) {
  console.error(validation.error);
  return;
}

// Парсинг резюме
const result = await parser.parse({
  type: validation.fileType!,
  content: fileBuffer,
  filename: "resume.pdf",
});

console.log("Имя:", result.structured.personalInfo.name);
console.log("Email:", result.structured.personalInfo.email);
console.log("Опыт работы:", result.structured.experience.length);
console.log("Confidence:", result.confidence);
```

### С Langfuse мониторингом

```typescript
import { Langfuse } from "langfuse";

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
});

const parser = new ResumeParserService({
  model: openai("gpt-4o-mini"),
  langfuse,
});
```

### Кастомная конфигурация

```typescript
const parser = new ResumeParserService({
  model: openai("gpt-4o-mini"),
  config: {
    maxFileSizeBytes: 5 * 1024 * 1024, // 5MB
    minTextLength: 100,
    aiTimeoutMs: 60000, // 60 секунд
  },
});
```

## Поддерживаемые форматы

| Формат | Расширение | Описание |
|--------|-----------|----------|
| PDF | `.pdf` | Portable Document Format |
| DOCX | `.docx` | Microsoft Word (2007+) |
| DOC | `.doc` | Microsoft Word (старые версии) |
| TXT | `.txt` | Простой текст |
| RTF | `.rtf` | Rich Text Format |
| ODT | `.odt` | OpenDocument Text |

## Структура данных

### ParsedResume

```typescript
interface ParsedResume {
  rawText: string;              // Извлечённый текст
  structured: StructuredResume; // Структурированные данные
  confidence: number;           // Уверенность (0-1)
}
```

### StructuredResume

```typescript
interface StructuredResume {
  personalInfo: {
    name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
  };
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  languages: Language[];
  summary: string | null;
}
```

## Обработка ошибок

```typescript
import { ResumeParserError } from "@qbs-autonaim/api";

try {
  const result = await parser.parse(input);
} catch (error) {
  if (error instanceof ResumeParserError) {
    console.error("Код:", error.code);
    console.error("Сообщение:", error.userMessage);
    console.error("Детали:", error.details);
    
    switch (error.code) {
      case "UNSUPPORTED_FORMAT":
        // Неподдерживаемый формат
        break;
      case "FILE_TOO_LARGE":
        // Файл слишком большой
        break;
      case "CORRUPTED_FILE":
        // Повреждённый файл
        break;
      case "EMPTY_CONTENT":
        // Пустой документ
        break;
      case "PARSE_FAILED":
        // Ошибка парсинга (сервис недоступен)
        break;
      case "AI_STRUCTURING_FAILED":
        // Ошибка AI структурирования
        break;
    }
  }
}
```

## Миграция с mammoth/pdf-parse

### Было (старый подход)

```typescript
import mammoth from "mammoth";
import pdfParse from "pdf-parse";

// Для DOCX
const docxResult = await mammoth.extractRawText({ buffer: content });
const text = docxResult.value;

// Для PDF
const pdfData = await pdfParse(content);
const text = pdfData.text;
```

### Стало (новый подход)

```typescript
import { UnstructuredParser } from "@qbs-autonaim/api";

const parser = new UnstructuredParser({
  apiUrl: process.env.UNSTRUCTURED_API_URL!,
});

// Универсально для всех форматов
const text = await parser.extractText(content, filename);
```

## Преимущества Unstructured

1. **Универсальность**: Один API для всех форматов документов
2. **Качество**: Лучшее извлечение текста и структуры
3. **OCR**: Поддержка отсканированных документов (при настройке)
4. **Масштабируемость**: Отдельный сервис, легко масштабировать
5. **Обновления**: Не нужно обновлять зависимости в проекте

## Troubleshooting

### Сервис недоступен

```
Error: Сервис обработки документов недоступен
```

**Решение**: Проверьте, что Docker контейнер запущен:

```bash
docker-compose up -d unstructured
docker logs unstructured
```

### Таймаут обработки

```
Error: Превышено время ожидания обработки документа
```

**Решение**: Увеличьте таймаут в конфигурации:

```typescript
const parser = new ResumeParserService({
  model: openai("gpt-4o-mini"),
  config: {
    aiTimeoutMs: 60000, // 60 секунд
  },
});
```

### Пустой текст

```
Error: Документ не содержит текста
```

**Решение**: Возможно, это отсканированный документ. Для OCR нужна дополнительная настройка Unstructured с Tesseract.

## Дополнительные ресурсы

- [Unstructured Documentation](https://unstructured-io.github.io/unstructured/)
- [Unstructured API Reference](https://unstructured-io.github.io/unstructured/api.html)
- [Docker Hub - Unstructured](https://quay.io/repository/unstructured-io/unstructured-api)
