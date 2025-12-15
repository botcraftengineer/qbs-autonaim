import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { workspace } from "../workspace/workspace";
import { vacancy } from "../vacancy/vacancy";

export const funnelCandidate = pgTable(
  "funnel_candidates",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),

    vacancyId: varchar("vacancy_id", { length: 50 })
      .notNull()
      .references(() => vacancy.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 255 }).notNull(),
    position: varchar("position", { length: 255 }).notNull(),
    avatar: text("avatar"),
    initials: varchar("initials", { length: 10 }).notNull(),
    experience: varchar("experience", { length: 100 }).notNull(),
    location: varchar("location", { length: 255 }).notNull(),
    skills: jsonb("skills").$type<string[]>().notNull(),
    matchScore: integer("match_score").notNull(),
    availability: varchar("availability", { length: 20 }).notNull(),
    salaryExpectation: varchar("salary_expectation", { length: 100 }).notNull(),
    stage: varchar("stage", { length: 20 }).notNull().default("NEW"),
    vacancyName: varchar("vacancy_name", { length: 500 }).notNull(),

    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    linkedin: text("linkedin"),
    github: text("github"),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    workspaceIdx: index("funnel_candidate_workspace_idx").on(table.workspaceId),
    vacancyIdx: index("funnel_candidate_vacancy_idx").on(table.vacancyId),
    stageIdx: index("funnel_candidate_stage_idx").on(table.stage),
  })
);
