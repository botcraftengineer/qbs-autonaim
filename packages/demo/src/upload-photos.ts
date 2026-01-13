#!/usr/bin/env bun

import { db } from "@qbs-autonaim/db";
import { file } from "@qbs-autonaim/db/schema";
import { readFileSync } from "fs";
import { join } from "path";

interface CandidatePhoto {
  candidateId: string;
  candidateName: string;
  photoUrl: string;
  photoDescription: string;
}

/**
 * Скрипт для загрузки фото кандидатов в систему файлов
 */
async function uploadCandidatePhotos() {
  console.log("📸 Загрузка фото кандидатов...");

  try {
    const photosPath = join(__dirname, "../data/candidate-photos.json");
    const photosData: CandidatePhoto[] = JSON.parse(
      readFileSync(photosPath, "utf-8"),
    );

    console.log(`👥 Найдено ${photosData.length} фото кандидатов`);

    const uploadedFiles = [];

    for (const photo of photosData) {
      console.log(`📥 Загружаем фото для ${photo.candidateName}...`);

      try {
        // Загружаем изображение
        const response = await fetch(photo.photoUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const imageBuffer = await response.arrayBuffer();
        const imageData = new Uint8Array(imageBuffer);

        // Определяем тип файла из URL
        const fileExtension =
          photo.photoUrl.includes(".jpg") || photo.photoUrl.includes("jpeg")
            ? "jpg"
            : "png";
        const mimeType = fileExtension === "jpg" ? "image/jpeg" : "image/png";

        // Создаем запись в таблице files
        const [uploadedFile] = await db
          .insert(file)
          .values({
            originalName: `${photo.candidateId}_photo.${fileExtension}`,
            mimeType: mimeType,
            size: imageData.length,
            // В реальной системе здесь будет путь к файлу в S3 или локальном хранилище
            path: `/uploads/candidates/${photo.candidateId}_photo.${fileExtension}`,
            // Для демо сохраняем оригинальный URL
            metadata: {
              originalUrl: photo.photoUrl,
              description: photo.photoDescription,
              candidateId: photo.candidateId,
            },
          })
          .returning();

        uploadedFiles.push({
          candidateId: photo.candidateId,
          candidateName: photo.candidateName,
          fileId: uploadedFile.id,
          originalUrl: photo.photoUrl,
        });

        console.log(
          `✅ Фото загружено: ${photo.candidateName} (ID: ${uploadedFile.id})`,
        );
      } catch (error) {
        console.error(
          `❌ Ошибка загрузки фото для ${photo.candidateName}:`,
          error,
        );
      }
    }

    console.log("\n📋 Результаты загрузки:");
    console.log("Используйте эти ID для обновления откликов:");

    for (const file of uploadedFiles) {
      console.log(
        `${file.candidateId}: "${file.fileId}" // ${file.candidateName}`,
      );
    }

    console.log(
      `\n🎉 Загружено ${uploadedFiles.length} из ${photosData.length} фото`,
    );

    return uploadedFiles;
  } catch (error) {
    console.error("❌ Ошибка при загрузке фото:", error);
    process.exit(1);
  }
}

// Запускаем скрипт
uploadCandidatePhotos();
