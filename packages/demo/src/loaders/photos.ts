import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "@qbs-autonaim/db";
import { file } from "@qbs-autonaim/db/schema";
import type { CandidatePhoto, PhotoMapping } from "../types";

export async function loadPhotos(): Promise<PhotoMapping> {
  console.log("\n📸 Загружаем фото кандидатов...");

  const photosPath = join(__dirname, "../../data/candidate-photos.json");
  const photosData: CandidatePhoto[] = JSON.parse(
    readFileSync(photosPath, "utf-8"),
  );

  console.log(`📸 Найдено ${photosData.length} фото кандидатов`);

  const photoMapping: PhotoMapping = {};

  for (const photo of photosData) {
    try {
      console.log(`📥 Загружаем фото для ${photo.candidateName}...`);

      const [uploadedFile] = await db
        .insert(file)
        .values({
          key: `candidates/${photo.candidateId}_photo.jpg`,
          fileName: `${photo.candidateId}_photo.jpg`,
          mimeType: "image/jpeg",
          fileSize: "150000",
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

  return photoMapping;
}
