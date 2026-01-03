/**
 * Resume Parser Service
 *
 * Сервис для парсинга резюме из различных форматов (PDF, DOCX).
 * Извлекает текст и структурирует данные с помощью AI.
 */

import { AgentFactory, type ResumeStructurerOutput } from "@qbs-autonaim/ai";
import type { ParsedResume, StructuredResume } from "@qbs-autonaim/db";
import type { LanguageModel } from "ai";
import type { Langfuse } from "langfuse";
import {
  DEFAULT_PARSER_CONFIG,
  type FormatValidationResult,
  type ResumeFileType,
  type ResumeInput,
  type ResumeParserConfig,
  ResumeParserError,
} from "./types";
import { UnstructuredParser } from "./unstructured-parser";

// Re-export types for convenience
export * from "./types";
export { UnstructuredParser } from "./unstructured-parser";

/**
 * Поддерживаемые расширения файлов
 */
const SUPPORTED_EXTENSIONS: Record<string, ResumeFileType> = {
  ".pdf": "pdf",
  ".docx": "docx",
  ".doc": "doc",
  ".txt": "txt",
  ".rtf": "rtf",
  ".odt": "odt",
};

/**
 * Сервис для парсинга резюме
 */
export class ResumeParserService {
  private readonly parser: UnstructuredParser;
  private readonly config: ResumeParserConfig;
  private readonly model: LanguageModel;
  private readonly langfuse?: Langfuse;

  constructor(options: {
    model: LanguageModel;
    langfuse?: Langfuse;
    config?: Partial<ResumeParserConfig>;
    unstructuredApiUrl?: string;
    unstructuredApiKey?: string;
  }) {
    const apiUrl =
      options.unstructuredApiUrl ||
      process.env.UNSTRUCTURED_API_URL ||
      "http://localhost:8001";
    const apiKey =
      options.unstructuredApiKey || process.env.UNSTRUCTURED_API_KEY;

    this.parser = new UnstructuredParser({
      apiUrl,
      apiKey,
      timeout: options.config?.aiTimeoutMs || DEFAULT_PARSER_CONFIG.aiTimeoutMs,
    });

    this.config = { ...DEFAULT_PARSER_CONFIG, ...options.config };
    this.model = options.model;
    this.langfuse = options.langfuse;
  }

  /**
   * Валидирует формат файла по имени
   *
   * @param filename - Имя файла с расширением
   * @returns Результат валидации с определённым типом файла
   */
  validateFormat(filename: string): FormatValidationResult {
    const supportedFormats = Object.values(SUPPORTED_EXTENSIONS);

    // Извлекаем расширение
    const lastDotIndex = filename.lastIndexOf(".");
    if (lastDotIndex === -1) {
      return {
        isValid: false,
        error: "Файл не имеет расширения",
        supportedFormats,
      };
    }

    const extension = filename.slice(lastDotIndex).toLowerCase();
    const fileType = SUPPORTED_EXTENSIONS[extension];

    if (!fileType) {
      return {
        isValid: false,
        error: `Неподдерживаемый формат файла: ${extension}. Поддерживаемые форматы: PDF, DOCX`,
        supportedFormats,
      };
    }

    return {
      isValid: true,
      fileType,
      supportedFormats,
    };
  }

  /**
   * Парсит резюме из файла
   *
   * @param input - Входные данные с типом и содержимым файла
   * @returns Распарсенное резюме со структурированными данными
   * @throws ResumeParserError при ошибках парсинга
   */
  async parse(input: ResumeInput): Promise<ParsedResume> {
    // Проверяем размер файла
    if (input.content.length > this.config.maxFileSizeBytes) {
      throw new ResumeParserError(
        "FILE_TOO_LARGE",
        `Максимальный размер файла: ${Math.round(this.config.maxFileSizeBytes / 1024 / 1024)} МБ`,
        {
          actualSize: input.content.length,
          maxSize: this.config.maxFileSizeBytes,
        },
      );
    }

    // Извлекаем текст в зависимости от типа файла
    let rawText: string;
    try {
      rawText = await this.extractText(input);
    } catch (error) {
      if (error instanceof ResumeParserError) {
        throw error;
      }
      throw new ResumeParserError(
        "PARSE_FAILED",
        "Не удалось извлечь текст из файла",
        {
          originalError: error instanceof Error ? error.message : String(error),
        },
      );
    }

    // Проверяем минимальную длину текста
    if (rawText.length < this.config.minTextLength) {
      throw new ResumeParserError(
        "EMPTY_CONTENT",
        "Файл содержит слишком мало текста для анализа",
        { textLength: rawText.length, minLength: this.config.minTextLength },
      );
    }

    // Структурируем данные с помощью AI
    let structured: StructuredResume;
    let confidence: number;

    try {
      const result = await this.structureWithAI(rawText);
      structured = result.structured;
      confidence = result.confidence;
    } catch (error) {
      if (error instanceof ResumeParserError) {
        throw error;
      }
      throw new ResumeParserError(
        "AI_STRUCTURING_FAILED",
        "Не удалось структурировать данные резюме",
        {
          originalError: error instanceof Error ? error.message : String(error),
        },
      );
    }

    return {
      rawText,
      structured,
      confidence,
    };
  }

  /**
   * Извлекает текст из файла через Unstructured API
   */
  private async extractText(input: ResumeInput): Promise<string> {
    return this.parser.extractText(input.content, input.filename);
  }

  /**
   * Структурирует текст резюме с помощью AI
   */
  private async structureWithAI(
    rawText: string,
  ): Promise<{ structured: StructuredResume; confidence: number }> {
    const factory = new AgentFactory({
      model: this.model,
      langfuse: this.langfuse,
    });

    const agent = factory.createResumeStructurer();
    const result = await agent.execute({ rawText }, {});

    if (!result.success || !result.data) {
      throw new ResumeParserError(
        "AI_STRUCTURING_FAILED",
        result.error || "AI не смог структурировать резюме",
      );
    }

    // Преобразуем выход агента в StructuredResume
    const structured = this.mapAgentOutputToStructuredResume(result.data);

    // Рассчитываем confidence на основе заполненности полей
    const confidence = this.calculateConfidence(structured);

    return { structured, confidence };
  }

  /**
   * Преобразует выход AI агента в StructuredResume
   */
  private mapAgentOutputToStructuredResume(
    output: ResumeStructurerOutput,
  ): StructuredResume {
    return {
      personalInfo: {
        name: output.personalInfo.name,
        email: output.personalInfo.email,
        phone: output.personalInfo.phone,
        location: output.personalInfo.location,
      },
      experience: output.experience.map((exp) => ({
        company: exp.company,
        position: exp.position,
        startDate: exp.startDate,
        endDate: exp.endDate,
        description: exp.description,
        isCurrent: exp.isCurrent,
      })),
      education: output.education.map((edu) => ({
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field,
        startDate: edu.startDate,
        endDate: edu.endDate,
      })),
      skills: output.skills,
      languages: output.languages.map((lang) => ({
        language: lang.language,
        level: lang.level,
      })),
      summary: output.summary,
    };
  }

  /**
   * Рассчитывает confidence на основе заполненности полей
   */
  private calculateConfidence(structured: StructuredResume): number {
    let score = 0;
    const maxScore = 10;

    // Личная информация (до 3 баллов)
    if (structured.personalInfo.name) score += 1;
    if (structured.personalInfo.email) score += 1;
    if (structured.personalInfo.phone) score += 0.5;
    if (structured.personalInfo.location) score += 0.5;

    // Опыт работы (до 3 баллов)
    if (structured.experience.length > 0) {
      score += Math.min(structured.experience.length, 3);
    }

    // Образование (до 1.5 баллов)
    if (structured.education.length > 0) {
      score += Math.min(structured.education.length * 0.5, 1.5);
    }

    // Навыки (до 1.5 баллов)
    if (structured.skills.length > 0) {
      score += Math.min(structured.skills.length * 0.15, 1.5);
    }

    // Языки (до 0.5 баллов)
    if (structured.languages.length > 0) {
      score += 0.5;
    }

    return Math.min(score / maxScore, 1);
  }
}
