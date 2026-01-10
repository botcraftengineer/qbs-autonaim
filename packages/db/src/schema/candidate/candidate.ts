import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { organization } from "../organization/organization";
import type { StoredProfileData } from "../types";

/**
 * Источник появления кандидата в базе
 */
export const candidateSourceEnum = pgEnum("candidate_source", [
  "APPLICANT", // Откликнулся сам
  "SOURCING", // Найден рекрутером (холодный поиск/парсинг)
  "IMPORT", // Массовый импорт
  "MANUAL", // Ручное создание
  "REFERRAL", // Рекомендация
]);

/**
 * Статус обработки данных парсером
 */
export const parsingStatusEnum = pgEnum("parsing_status", [
  "PENDING",
  "COMPLETED",
  "FAILED",
]);

/**
 * Глобальный профиль кандидата (Talent Pool).
 * Позволяет накапливать базу талантов организации независимо от конкретных вакансий.
 * Сюда линкуются отклики (VacancyResponse) и гиги (GigResponse).
 */
export const candidate = pgTable(
  "candidates",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Привязка к организации (владелец базы талантов)
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    // Основная информация (ФИО для РФ рынка)
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    middleName: varchar("middle_name", { length: 100 }), // Отчество
    fullName: varchar("full_name", { length: 500 }).notNull(), // Храним и полное для удобства поиска

    headline: varchar("headline", { length: 255 }), // "Профессия" (напр. "Java Разработчик")

    // Личные данные (критично для РФ)
    birthDate: timestamp("birth_date", { withTimezone: true, mode: "date" }),
    gender: varchar("gender", { length: 20 }), // "male", "female"
    citizenship: varchar("citizenship", { length: 100 }), // Гражданство (важно для оформления)
    location: varchar("location", { length: 200 }), // Город проживания

    // Контактные данные
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    telegramUsername: varchar("telegram_username", { length: 100 }),
    telegramChatId: varchar("telegram_chat_id", { length: 100 }),
    preferredContactMethod: varchar("preferred_contact_method", {
      length: 20,
    }).default("telegram"),

    // Ссылки на внешние ресурсы
    hhUrl: text("hh_url"), // Ссылка на hh.ru (Main source in RF)
    habrUrl: text("habr_profile_url"), // Хабр Карьера
    vkUrl: text("vk_profile_url"), // ВКонтакте
    githubUrl: text("github_url"),
    resumeUrl: text("resume_url"), // Файл резюме
    portfolioUrl: text("portfolio_url"),

    // Распаршенные/обогащенные данные
    profileData: jsonb("profile_data").$type<StoredProfileData>(),
    skills: jsonb("skills").$type<string[]>(),
    experienceYears: integer("experience_years"),

    // Зарплатные ожидания
    salaryExpectationsAmount: integer("salary_expectations_amount"),
    workFormat: varchar("work_format", { length: 50 }), // remote, office, hybrid

    // Детали по опыту
    englishLevel: varchar("english_level", { length: 20 }), // A1-C2
    readyForRelocation: boolean("ready_for_relocation").default(false),

    // Статус в базе (например, "BLACKLISTED", "HIRED", "PASSIVE")
    status: varchar("status", { length: 50 }).default("ACTIVE"),

    // Заметки рекрутера (общие по кандидату)
    notes: text("notes"),

    // --- Sourcing & Origin ---
    // Каким образом попал в базу
    source: candidateSourceEnum("source").default("APPLICANT").notNull(),
    // Конкретный источник (hh.ru, linkedin, unknown)
    originalSource: varchar("original_source", { length: 50 }),

    // Статус парсинга (если добавляем через AI-парсером)
    parsingStatus: parsingStatusEnum("parsing_status")
      .default("COMPLETED")
      .notNull(),

    // Теги для быстрого поиска и сегментации (напр. ["senior", "reserve", "msk"])
    tags: jsonb("tags").$type<string[]>(),

    // --- Search & Privacy ---
    // Видим ли в глобальном поиске для клиентов (если false - только для внутренних рекрутеров)
    isSearchable: boolean("is_searchable").default(true),

    // Метаданные
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    orgIdx: index("candidate_org_idx").on(table.organizationId),
    emailIdx: index("candidate_email_idx").on(table.email),
    phoneIdx: index("candidate_phone_idx").on(table.phone),
    telegramIdx: index("candidate_telegram_idx").on(table.telegramUsername),
    // Индекс для поиска по навыкам (если используется GIN для JSONB, но пока btree)
    // skillsIdx: index("candidate_skills_idx").on(table.skills),
  }),
);

export const CreateCandidateSchema = createInsertSchema(candidate, {
  fullName: z.string().min(1).max(500),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  middleName: z.string().max(100).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  birthDate: z.coerce.date().optional(),
  citizenship: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  salaryExpectationsAmount: z.number().int().optional(),
  telegramUsername: z.string().max(100).optional(),
  hhUrl: z.string().url().optional().or(z.literal("")),
  vkUrl: z.string().url().optional().or(z.literal("")),
  habrUrl: z.string().url().optional().or(z.literal("")),
  profileData: z.any(),
  skills: z.array(z.string()).optional(),
  experienceYears: z.number().int().min(0).optional(),
  source: z
    .enum(["APPLICANT", "SOURCING", "IMPORT", "MANUAL", "REFERRAL"])
    .optional(),
  originalSource: z.string().max(50).optional(),
  tags: z.array(z.string()).optional(),
  isSearchable: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Candidate = typeof candidate.$inferSelect;
export type NewCandidate = typeof candidate.$inferInsert;
