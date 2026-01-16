import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "@qbs-autonaim/db";
import { response } from "@qbs-autonaim/db/schema";
import type { GigMapping, PhotoMapping, VacancyMapping } from "../types";

interface InsertedResponse {
  id: string;
  candidateName: string;
  status: string;
  photoFileId: string | null;
}

interface ResponseData {
  entityId: string;
  candidateId: string;
  respondedAt?: string | null;
  rankedAt?: string | null;
  [key: string]: unknown;
}

export async function loadVacancyResponses(
  vacancyMapping: VacancyMapping,
  photoMapping: PhotoMapping,
  fallbackVacancyId: string,
): Promise<InsertedResponse[]> {
  console.log("\n👥 Загружаем отклики на вакансии...");

  const responsesPath = join(__dirname, "../../data/responses.json");
  const responsesData: ResponseData[] = JSON.parse(
    readFileSync(responsesPath, "utf-8"),
  );

  console.log(`👥 Найдено ${responsesData.length} откликов на вакансии`);

  const updatedResponsesData = responsesData.map((resp) => ({
    ...resp,
    entityId: vacancyMapping[resp.entityId] || fallbackVacancyId,
    photoFileId: photoMapping[resp.candidateId] || null,
    respondedAt: resp.respondedAt ? new Date(resp.respondedAt) : null,
    rankedAt: resp.rankedAt ? new Date(resp.rankedAt) : null,
  }));

  const insertedResponses = await db
    .insert(response)
    .values(updatedResponsesData)
    .returning({
      id: response.id,
      candidateName: response.candidateName,
      status: response.status,
      photoFileId: response.photoFileId,
    });

  console.log("✅ Отклики на вакансии загружены:");
  for (const r of insertedResponses) {
    const hasPhoto = r.photoFileId ? "📸" : "👤";
    console.log(
      `  - ${hasPhoto} ${r.candidateName} (${r.status}) (ID: ${r.id})`,
    );
  }

  return insertedResponses;
}

export async function loadGigResponses(
  gigMapping: GigMapping,
  photoMapping: PhotoMapping,
  fallbackGigId: string,
): Promise<InsertedResponse[]> {
  console.log("\n🎯 Загружаем отклики на задания...");

  const gigResponsesPath = join(__dirname, "../../data/gig-responses.json");
  const gigResponsesData: ResponseData[] = JSON.parse(
    readFileSync(gigResponsesPath, "utf-8"),
  );

  console.log(`🎯 Найдено ${gigResponsesData.length} откликов на задания`);

  const updatedGigResponsesData = gigResponsesData.map((resp) => ({
    ...resp,
    entityId: gigMapping[resp.entityId] || fallbackGigId,
    photoFileId: photoMapping[resp.candidateId] || null,
    respondedAt: resp.respondedAt ? new Date(resp.respondedAt) : null,
    rankedAt: resp.rankedAt ? new Date(resp.rankedAt) : null,
  }));

  const insertedGigResponses = await db
    .insert(response)
    .values(updatedGigResponsesData)
    .returning({
      id: response.id,
      candidateName: response.candidateName,
      status: response.status,
      photoFileId: response.photoFileId,
    });

  console.log("✅ Отклики на задания загружены:");
  for (const r of insertedGigResponses) {
    const hasPhoto = r.photoFileId ? "📸" : "👤";
    console.log(
      `  - ${hasPhoto} ${r.candidateName} (${r.status}) (ID: ${r.id})`,
    );
  }

  return insertedGigResponses;
}
