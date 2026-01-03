import { sql } from "drizzle-orm";
import {
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

import { workspace } from "../workspace/workspace";

// Enums for widget configuration
export const widgetToneEnum = pgEnum("widget_tone", ["formal", "friendly"]);

export const honestyLevelEnum = pgEnum("honesty_level", [
  "direct",
  "diplomatic",
  "encouraging",
]);

// Widget Configuration Table
export const widgetConfig = pgTable("widget_configs", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

  // Workspace к которому принадлежит конфигурация (уникальный)
  workspaceId: text("workspace_id")
    .notNull()
    .unique()
    .references(() => workspace.id, { onDelete: "cascade" }),

  // === Branding ===
  logo: text("logo"),
  primaryColor: varchar("primary_color", { length: 7 }).default("#3B82F6"),
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#1E40AF"),
  backgroundColor: varchar("background_color", { length: 7 }).default(
    "#FFFFFF",
  ),
  textColor: varchar("text_color", { length: 7 }).default("#1F2937"),
  fontFamily: varchar("font_family", { length: 100 }).default("Inter"),
  assistantName: varchar("assistant_name", { length: 100 }).default(
    "AI Assistant",
  ),
  assistantAvatar: text("assistant_avatar"),
  welcomeMessage: text("welcome_message"),
  completionMessage: text("completion_message"),

  // === Behavior ===
  passThreshold: integer("pass_threshold").default(60),
  mandatoryQuestions: jsonb("mandatory_questions")
    .$type<string[]>()
    .default([]),
  tone: widgetToneEnum("tone").default("friendly"),
  honestyLevel: honestyLevelEnum("honesty_level").default("diplomatic"),
  maxDialogueTurns: integer("max_dialogue_turns").default(10),
  sessionTimeoutMinutes: integer("session_timeout_minutes").default(30),

  // === Legal ===
  consentText: text("consent_text"),
  disclaimerText: text("disclaimer_text"),
  privacyPolicyUrl: text("privacy_policy_url"),
  dataRetentionDays: integer("data_retention_days").default(90),

  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Zod schemas
export const CreateWidgetConfigSchema = createInsertSchema(widgetConfig, {
  workspaceId: z.string().min(1),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  secondaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  textColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  fontFamily: z.string().max(100).optional(),
  assistantName: z.string().max(100).optional(),
  passThreshold: z.number().int().min(0).max(100).optional(),
  mandatoryQuestions: z.array(z.string()).optional(),
  tone: z.enum(["formal", "friendly"]).optional(),
  honestyLevel: z.enum(["direct", "diplomatic", "encouraging"]).optional(),
  maxDialogueTurns: z.number().int().min(1).max(50).optional(),
  sessionTimeoutMinutes: z.number().int().min(5).max(120).optional(),
  dataRetentionDays: z.number().int().min(1).max(365).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateWidgetConfigSchema = CreateWidgetConfigSchema.partial().omit(
  {
    workspaceId: true,
  },
);

// Type exports
export type WidgetConfig = typeof widgetConfig.$inferSelect;
export type NewWidgetConfig = typeof widgetConfig.$inferInsert;
export type WidgetTone = (typeof widgetToneEnum.enumValues)[number];
export type HonestyLevel = (typeof honestyLevelEnum.enumValues)[number];
