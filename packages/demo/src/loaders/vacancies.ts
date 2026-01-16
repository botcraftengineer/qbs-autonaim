import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "@qbs-autonaim/db";
import { vacancy } from "@qbs-autonaim/db/schema";
import type { VacancyMapping } from "../types";

interface InsertedVacancy {
  id: string;
  title: string;
}

export async function loadVacancies(): Promise<{
  insertedVacancies: InsertedVacancy[];
  vacancyMapping: VacancyMapping;
}> {
  console.log("\n📝 Загружаем вакансии...");

  const vacanciesPath = join(__dirname, "../../data/vacancies.json");
  const vacanciesData = JSON.parse(readFileSync(vacanciesPath, "utf-8"));

  console.log(`📋 Найдено ${vacanciesData.length} вакансий`);

  const insertedVacancies = await db
    .insert(vacancy)
    .values(vacanciesData)
    .returning({ id: vacancy.id, title: vacancy.title });

  console.log("✅ Вакансии загружены:");
  for (const v of insertedVacancies) {
    console.log(`  - ${v.title} (ID: ${v.id})`);
  }

  // Создаем маппинг для демо данных вакансий
  const vacancyMapping: VacancyMapping = {};
  if (insertedVacancies.length >= 3) {
    vacancyMapping["01234567-89ab-cdef-0123-456789abcdef"] =
      insertedVacancies[0]?.id || "";
    vacancyMapping["fedcba98-7654-3210-fedc-ba9876543210"] =
      insertedVacancies[1]?.id || "";
    vacancyMapping["abcdef01-2345-6789-abcd-ef0123456789"] =
      insertedVacancies[2]?.id || "";
    vacancyMapping["11111111-2222-3333-4444-555555555555"] =
      insertedVacancies[3]?.id || "";
    vacancyMapping["22222222-3333-4444-5555-666666666666"] =
      insertedVacancies[4]?.id || "";
    vacancyMapping["33333333-4444-5555-6666-777777777777"] =
      insertedVacancies[5]?.id || "";
    vacancyMapping["44444444-5555-6666-7777-888888888888"] =
      insertedVacancies[6]?.id || "";
    vacancyMapping["55555555-6666-7777-8888-999999999999"] =
      insertedVacancies[7]?.id || "";
    vacancyMapping["66666666-7777-8888-9999-aaaaaaaaaaaa"] =
      insertedVacancies[8]?.id || "";
    vacancyMapping["77777777-8888-9999-aaaa-bbbbbbbbbbbb"] =
      insertedVacancies[9]?.id || "";
  }

  return { insertedVacancies, vacancyMapping };
}
