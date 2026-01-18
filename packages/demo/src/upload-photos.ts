#!/usr/bin/env bun

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "@qbs-autonaim/db";
import { file } from "@qbs-autonaim/db/schema";
import { uploadBufferToS3 } from "@qbs-autonaim/lib/s3";
import axios from "axios";

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
        // Загружаем изображение с retry логикой через axios
        let imageData: Buffer | null = null;
        let lastError: Error | null = null;
        const maxRetries = 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const response = await axios.get(photo.photoUrl, {
              responseType: "arraybuffer",
              timeout: 10000, // 10 секунд таймаут
              headers: {
                "User-Agent": "Mozilla/5.0 (compatible; QBS-AutoNaim/1.0)",
              },
            });

            imageData = Buffer.from(response.data);
            break; // Успешно загрузили
          } catch (error) {
            lastError = error as Error;
            const errorMessage =
              axios.isAxiosError(error) && error.response
                ? `HTTP ${error.response.status}: ${error.response.statusText}`
                : (error as Error).message;

            console.log(
              `⚠️  Попытка ${attempt}/${maxRetries} не удалась: ${errorMessage}`,
            );

            if (attempt < maxRetries) {
              // Экспоненциальная задержка: 1s, 2s, 4s
              const delay = 2 ** (attempt - 1) * 1000;
              console.log(`⏳ Ожидание ${delay}ms перед следующей попыткой...`);
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          }
        }

        if (!imageData) {
          throw lastError || new Error("Failed to fetch image after retries");
        }

        // Определяем тип файла из URL (по умолчанию JPG)
        const fileExtension = photo.photoUrl.includes(".png") ? "png" : "jpg";
        const mimeType = fileExtension === "png" ? "image/png" : "image/jpeg";

        // Генерируем ключ для S3
        const s3Key = `candidates/${photo.candidateId}_photo.${fileExtension}`;

        // Загружаем файл в S3
        console.log(`☁️  Загружаем в S3: ${s3Key}`);
        const s3Result = await uploadBufferToS3(s3Key, imageData, mimeType);

        // Создаем запись в таблице files
        const [uploadedFile] = await db
          .insert(file)
          .values({
            provider: "S3",
            key: s3Result.key,
            fileName: `${photo.candidateId}_photo.${fileExtension}`,
            mimeType: mimeType,
            fileSize: imageData.length.toString(),
            metadata: {
              originalUrl: photo.photoUrl,
              description: photo.photoDescription,
              candidateId: photo.candidateId,
              bucket: s3Result.bucket,
              etag: s3Result.etag,
            },
          })
          .returning();

        if (!uploadedFile) {
          throw new Error("Failed to insert file record");
        }

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
