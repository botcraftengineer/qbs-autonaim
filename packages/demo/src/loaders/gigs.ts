import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "@qbs-autonaim/db";
import { gig } from "@qbs-autonaim/db/schema";
import type { GigMapping } from "../types";

interface InsertedGig {
  id: string;
  title: string;
}

export async function loadGigs(): Promise<{
  insertedGigs: InsertedGig[];
  gigMapping: GigMapping;
}> {
  console.log("\n💼 Загружаем задания (gigs)...");

  const gigsPath = join(__dirname, "../../data/gigs.json");
  const gigsData = JSON.parse(readFileSync(gigsPath, "utf-8"));

  console.log(`💼 Найдено ${gigsData.length} заданий (gigs)`);

  const processedGigsData = gigsData.map(
    (gigItem: { deadline?: string | null; [key: string]: unknown }) => ({
      ...gigItem,
      deadline: gigItem.deadline ? new Date(gigItem.deadline) : null,
    }),
  );

  const insertedGigs = await db
    .insert(gig)
    .values(processedGigsData)
    .returning({ id: gig.id, title: gig.title });

  console.log("✅ Задания загружены:");
  for (const g of insertedGigs) {
    console.log(`  - ${g.title} (ID: ${g.id})`);
  }

  // Создаем маппинг для демо данных заданий
  const gigMapping: GigMapping = {};
  if (insertedGigs.length >= 8) {
    gigMapping.gig_001_landing = insertedGigs[0]?.id || "";
    gigMapping.gig_002_mobile_design = insertedGigs[1]?.id || "";
    gigMapping.gig_003_copywriting = insertedGigs[2]?.id || "";
    gigMapping.gig_004_devops = insertedGigs[3]?.id || "";
    gigMapping.gig_005_data_analysis = insertedGigs[4]?.id || "";
    gigMapping.gig_006_video = insertedGigs[5]?.id || "";
    gigMapping.gig_007_translation = insertedGigs[6]?.id || "";
    gigMapping.gig_008_consulting = insertedGigs[7]?.id || "";
  }

  return { insertedGigs, gigMapping };
}
