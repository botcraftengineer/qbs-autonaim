#!/usr/bin/env bun

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "@qbs-autonaim/db";
import { file, gig, response, vacancy } from "@qbs-autonaim/db/schema";

interface CandidatePhoto {
  candidateId: string;
  candidateName: string;
  photoUrl: string;
  photoDescription: string;
}

/**
 * Скрипт для загрузки демо данных в базу данных
 */
async function loadDemoData() {
  console.log("🚀 Загрузка демо данных...");

  try {
    // Загружаем данные из JSON файлов
    const vacanciesPath = join(__dirname, "../data/vacancies.json");
    const responsesPath = join(__dirname, "../data/responses.json");
    const photosPath = join(__dirname, "../data/candidate-photos.json");
    const gigsPath = join(__dirname, "../data/gigs.json");
    const gigResponsesPath = join(__dirname, "../data/gig-responses.json");

    const vacanciesData = JSON.parse(readFileSync(vacanciesPath, "utf-8"));
    const responsesData = JSON.parse(readFileSync(responsesPath, "utf-8"));
    const photosData: CandidatePhoto[] = JSON.parse(
      readFileSync(photosPath, "utf-8"),
    );
    const gigsData = JSON.parse(readFileSync(gigsPath, "utf-8"));
    const gigResponsesData = JSON.parse(
      readFileSync(gigResponsesPath, "utf-8"),
    );

    console.log(`📋 Найдено ${vacanciesData.length} вакансий`);
    console.log(`👥 Найдено ${responsesData.length} откликов на вакансии`);
    console.log(`💼 Найдено ${gigsData.length} заданий (gigs)`);
    console.log(`🎯 Найдено ${gigResponsesData.length} откликов на задания`);
    console.log(`📸 Найдено ${photosData.length} фото кандидатов`);

    // Загружаем фото кандидатов
    console.log("\n📸 Загружаем фото кандидатов...");
    const photoMapping: Record<string, string> = {};

    for (const photo of photosData) {
      try {
        console.log(`📥 Загружаем фото для ${photo.candidateName}...`);

        // Создаем запись в таблице files для фото
        const [uploadedFile] = await db
          .insert(file)
          .values({
            key: `candidates/${photo.candidateId}_photo.jpg`,
            fileName: `${photo.candidateId}_photo.jpg`,
            mimeType: "image/jpeg",
            size: 150000, // Примерный размер
            path: `/uploads/candidates/${photo.candidateId}_photo.jpg`,
            metadata: {
              originalUrl: photo.photoUrl,
              description: photo.photoDescription,
              candidateId: photo.candidateId,
              type: "candidate_photo",
            },
          })
          .returning({ id: file.id });

        if (uploadedFile) {
          photoMapping[photo.candidateId] = uploadedFile.id;
          console.log(
            `✅ Фото загружено: ${photo.candidateName} (ID: ${uploadedFile.id})`,
          );
        }
      } catch (error) {
        console.error(
          `❌ Ошибка загрузки фото для ${photo.candidateName}:`,
          error,
        );
      }
    }

    // Загружаем вакансии
    console.log("\n📝 Загружаем вакансии...");
    const insertedVacancies = await db
      .insert(vacancy)
      .values(vacanciesData)
      .returning({ id: vacancy.id, title: vacancy.title });

    console.log("✅ Вакансии загружены:");
    for (const v of insertedVacancies) {
      console.log(`  - ${v.title} (ID: ${v.id})`);
    }

    // Загружаем задания (gigs)
    console.log("\n💼 Загружаем задания (gigs)...");
    const processedGigsData = gigsData.map((gigItem: any) => ({
      ...gigItem,
      deadline: gigItem.deadline ? new Date(gigItem.deadline) : null,
    }));

    const insertedGigs = await db
      .insert(gig)
      .values(processedGigsData)
      .returning({ id: gig.id, title: gig.title });

    console.log("✅ Задания загружены:");
    for (const g of insertedGigs) {
      console.log(`  - ${g.title} (ID: ${g.id})`);
    }

    // Создаем маппинг для демо данных вакансий
    const vacancyMapping: Record<string, string> = {};
    if (insertedVacancies.length >= 3) {
      vacancyMapping["01234567-89ab-cdef-0123-456789abcdef"] =
        insertedVacancies[0]?.id || ""; // Frontend вакансия
      vacancyMapping["fedcba98-7654-3210-fedc-ba9876543210"] =
        insertedVacancies[1]?.id || ""; // Python вакансия
      vacancyMapping["abcdef01-2345-6789-abcd-ef0123456789"] =
        insertedVacancies[2]?.id || ""; // DevOps вакансия
      vacancyMapping["11111111-2222-3333-4444-555555555555"] =
        insertedVacancies[3]?.id || ""; // Full Stack вакансия
      vacancyMapping["22222222-3333-4444-5555-666666666666"] =
        insertedVacancies[4]?.id || ""; // Mobile вакансия
      vacancyMapping["33333333-4444-5555-6666-777777777777"] =
        insertedVacancies[5]?.id || ""; // QA вакансия
      vacancyMapping["44444444-5555-6666-7777-888888888888"] =
        insertedVacancies[6]?.id || ""; // Data Science вакансия
      vacancyMapping["55555555-6666-7777-8888-999999999999"] =
        insertedVacancies[7]?.id || ""; // UI/UX вакансия
      vacancyMapping["66666666-7777-8888-9999-aaaaaaaaaaaa"] =
        insertedVacancies[8]?.id || ""; // Java вакансия
      vacancyMapping["77777777-8888-9999-aaaa-bbbbbbbbbbbb"] =
        insertedVacancies[9]?.id || ""; // Product Manager вакансия
    }

    // Создаем маппинг для демо данных заданий
    const gigMapping: Record<string, string> = {};
    if (insertedGigs.length >= 8) {
      gigMapping["gig_001_landing"] = insertedGigs[0]?.id || "";
      gigMapping["gig_002_mobile_design"] = insertedGigs[1]?.id || "";
      gigMapping["gig_003_copywriting"] = insertedGigs[2]?.id || "";
      gigMapping["gig_004_devops"] = insertedGigs[3]?.id || "";
      gigMapping["gig_005_data_analysis"] = insertedGigs[4]?.id || "";
      gigMapping["gig_006_video"] = insertedGigs[5]?.id || "";
      gigMapping["gig_007_translation"] = insertedGigs[6]?.id || "";
      gigMapping["gig_008_consulting"] = insertedGigs[7]?.id || "";
    }

    // Обновляем entityId и photoFileId в откликах на вакансии
    const updatedResponsesData = responsesData.map((resp: any) => ({
      ...resp,
      entityId: vacancyMapping[resp.entityId] || insertedVacancies[0]?.id || "",
      photoFileId: photoMapping[resp.candidateId] || null,
      // Преобразуем даты в объекты Date
      respondedAt: resp.respondedAt ? new Date(resp.respondedAt) : null,
      rankedAt: resp.rankedAt ? new Date(resp.rankedAt) : null,
    }));

    // Обновляем entityId и photoFileId в откликах на задания
    const updatedGigResponsesData = gigResponsesData.map((resp: any) => ({
      ...resp,
      entityId: gigMapping[resp.entityId] || insertedGigs[0]?.id || "",
      photoFileId: photoMapping[resp.candidateId] || null,
      // Преобразуем даты в объекты Date
      respondedAt: resp.respondedAt ? new Date(resp.respondedAt) : null,
      rankedAt: resp.rankedAt ? new Date(resp.rankedAt) : null,
    }));

    // Загружаем отклики на вакансии
    console.log("\n👥 Загружаем отклики на вакансии...");
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

    // Загружаем отклики на задания
    console.log("\n🎯 Загружаем отклики на задания...");
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

    console.log("\n🎉 Демо данные успешно загружены!");
    console.log(
      `📊 Итого: ${insertedVacancies.length} вакансий, ${insertedGigs.length} заданий, ${insertedResponses.length + insertedGigResponses.length} откликов, ${Object.keys(photoMapping).length} фото`,
    );
  } catch (error) {
    console.error("❌ Ошибка при загрузке демо данных:", error);
    process.exit(1);
  }
}

// Запускаем скрипт
loadDemoData();
