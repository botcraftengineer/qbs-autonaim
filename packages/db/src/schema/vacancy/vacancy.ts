import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const vacancy = pgTable("vacancies", {
  id: varchar("id", { length: 50 }).primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  url: text("url"),
  views: integer("views").default(0),
  responses: integer("responses").default(0),
  newResponses: integer("new_responses").default(0),
  resumesInProgress: integer("resumes_in_progress").default(0),
  suitableResumes: integer("suitable_resumes").default(0),
  region: varchar("region", { length: 200 }),
  description: text("description"),
  screeningPrompt: text("screening_prompt"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
});

export const CreateVacancySchema = createInsertSchema(vacancy, {
  id: z.string().max(50),
  title: z.string().max(500),
  url: z.string().optional(),
}).omit({
  createdAt: true,
  updatedAt: true,
});
