import { and, eq, isNull, or } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { file, vacancyResponse } from "@qbs-autonaim/db/schema";
import { uploadFile } from "@qbs-autonaim/lib";
import type { SaveResponseData } from "../../parsers/types";
import {
  createLogger,
  RESPONSE_STATUS,
  type ResponseStatus,
  type Result,
  tryCatch,
} from "../base";

const logger = createLogger("ResponseRepository");

/**
 * Checks if response exists by resume ID
 */
export async function checkResponseExists(
  resumeId: string,
): Promise<Result<boolean>> {
  return tryCatch(async () => {
    const existingResponse = await db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.resumeId, resumeId),
    });
    return !!existingResponse;
  }, "Failed to check response existence");
}

/**
 * Gets response by ID
 */
export async function getResponseById(responseId: string) {
  return tryCatch(async () => {
    const result = await db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.id, responseId),
    });
    return result ?? null;
  }, "Failed to get response");
}

/**
 * Gets response by resume ID
 */
export async function getResponseByResumeId(resumeId: string) {
  return tryCatch(async () => {
    const result = await db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.resumeId, resumeId),
    });
    return result ?? null;
  }, "Failed to get response by resume ID");
}

/**
 * Checks if response has detailed info (experience or contacts)
 */
export async function hasDetailedInfo(
  vacancyId: string,
  resumeId: string,
): Promise<Result<boolean>> {
  return tryCatch(async () => {
    const response = await db.query.vacancyResponse.findFirst({
      where: and(
        eq(vacancyResponse.vacancyId, vacancyId),
        eq(vacancyResponse.resumeId, resumeId),
      ),
    });

    if (!response) return false;
    return !!(response.experience || response.contacts);
  }, "Failed to check detailed info");
}

/**
 * Gets all responses without detailed info
 */
export async function getResponsesWithoutDetails() {
  return tryCatch(async () => {
    return await db.query.vacancyResponse.findMany({
      where: or(
        isNull(vacancyResponse.experience),
        eq(vacancyResponse.experience, ""),
      ),
    });
  }, "Failed to get responses without details");
}

/**
 * Saves basic response info (without detailed resume info)
 * @returns true if response was saved, false if already existed
 */
export async function saveBasicResponse(
  vacancyId: string,
  resumeId: string,
  resumeUrl: string,
  candidateName: string,
  respondedAt?: Date,
): Promise<Result<boolean>> {
  return tryCatch(async () => {
    const result = await db
      .insert(vacancyResponse)
      .values({
        vacancyId,
        resumeId,
        resumeUrl,
        candidateName,
        status: RESPONSE_STATUS.NEW,
        experience: "",
        contacts: null,
        phone: null,
        respondedAt,
      })
      .onConflictDoNothing({
        target: [vacancyResponse.vacancyId, vacancyResponse.resumeId],
      });

    const isNew = (result.rowCount ?? 0) > 0;

    if (isNew) {
      logger.info(`Basic info saved: ${candidateName}`);
    } else {
      logger.info(`Skip: ${candidateName} (already in database)`);
    }

    return isNew;
  }, `Failed to save basic response for ${candidateName}`);
}

/**
 * Updates response with detailed info
 */
export async function updateResponseDetails(
  response: SaveResponseData,
): Promise<Result<void>> {
  return tryCatch(async () => {
    logger.info(
      `Updating response details for ${response.candidateName}, photoFileId: ${response.photoFileId}`,
    );

    await db
      .update(vacancyResponse)
      .set({
        experience: response.experience,
        contacts: response.contacts,
        phone: response.phone,
        telegramUsername: response.telegramUsername,
        resumePdfFileId: response.resumePdfFileId,
        photoFileId: response.photoFileId,
      })
      .where(eq(vacancyResponse.resumeId, response.resumeId));

    logger.info(
      `Detailed info updated: ${response.candidateName}, photoFileId saved: ${response.photoFileId}`,
    );
  }, `Failed to update details for ${response.candidateName}`);
}

/**
 * Updates response status
 */
export async function updateResponseStatus(
  responseId: string,
  status: ResponseStatus,
): Promise<Result<void>> {
  return tryCatch(async () => {
    await db
      .update(vacancyResponse)
      .set({ status })
      .where(eq(vacancyResponse.id, responseId));

    logger.info(`Status updated to ${status}`, { responseId });
  }, `Failed to update response status ${responseId}`);
}

/**
 * Uploads resume PDF to S3 and saves record to DB
 */
export async function uploadResumePdf(
  pdfBuffer: Buffer,
  resumeId: string,
): Promise<Result<string | null>> {
  return tryCatch(async () => {
    const fileName = `resume_${resumeId}.pdf`;
    const key = await uploadFile(
      pdfBuffer,
      fileName,
      "application/pdf",
      "resumes",
    );

    const [fileRecord] = await db
      .insert(file)
      .values({
        provider: "S3",
        key,
        fileName,
        mimeType: "application/pdf",
        fileSize: pdfBuffer.length.toString(),
      })
      .returning();

    logger.info(`PDF resume uploaded to S3: ${key}`);
    return fileRecord?.id ?? null;
  }, "Failed to upload PDF to S3");
}

/**
 * Uploads candidate photo to S3 and saves record to DB
 */
export async function uploadCandidatePhoto(
  photoBuffer: Buffer,
  resumeId: string,
  mimeType: string,
): Promise<Result<string | null>> {
  return tryCatch(async () => {
    logger.info(
      `Starting photo upload for resume ${resumeId}, size: ${photoBuffer.length} bytes, type: ${mimeType}`,
    );

    const ALLOWED_MIME_TYPES: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    // Validate buffer size
    if (photoBuffer.length > MAX_FILE_SIZE) {
      logger.warn(
        `Photo upload rejected: file size ${photoBuffer.length} exceeds limit ${MAX_FILE_SIZE}`,
      );
      throw new Error("Invalid file");
    }

    // Normalize and validate MIME type
    const normalizedMimeType = mimeType.toLowerCase().trim();
    const extension = ALLOWED_MIME_TYPES[normalizedMimeType];

    if (!extension) {
      logger.warn(`Photo upload rejected: invalid MIME type ${mimeType}`);
      throw new Error("Invalid file type");
    }

    logger.info(`Photo validation passed, uploading to S3...`);

    // Sanitize resumeId (allow only alphanumerics, hyphen, underscore)
    const sanitizedResumeId = resumeId.replace(/[^a-zA-Z0-9_-]/g, "");
    if (!sanitizedResumeId) {
      logger.warn(`Photo upload rejected: invalid resumeId ${resumeId}`);
      throw new Error("Invalid identifier");
    }

    const fileName = `photo_${sanitizedResumeId}.${extension}`;

    logger.info(`Uploading file to S3: ${fileName}`);
    const key = await uploadFile(
      photoBuffer,
      fileName,
      normalizedMimeType,
      "candidate-photos",
    );
    logger.info(`File uploaded to S3 with key: ${key}`);

    logger.info(`Saving file record to database...`);
    const [fileRecord] = await db
      .insert(file)
      .values({
        provider: "S3",
        key,
        fileName,
        mimeType: normalizedMimeType,
        fileSize: photoBuffer.length.toString(),
      })
      .returning();

    logger.info(
      `Candidate photo uploaded to S3: ${key}, file ID: ${fileRecord?.id}`,
    );
    return fileRecord?.id ?? null;
  }, "Failed to upload photo");
}

/**
 * Saves or updates full response data
 */
export async function saveResponseToDb(
  response: SaveResponseData,
): Promise<Result<void>> {
  return tryCatch(async () => {
    const result = await db
      .insert(vacancyResponse)
      .values({
        vacancyId: response.vacancyId,
        resumeId: response.resumeId,
        resumeUrl: response.resumeUrl,
        candidateName: response.candidateName,
        status: RESPONSE_STATUS.NEW,
        experience: response.experience,
        contacts: response.contacts,
        phone: response.phone,
      })
      .onConflictDoNothing({
        target: [vacancyResponse.vacancyId, vacancyResponse.resumeId],
      });

    if ((result.rowCount ?? 0) === 0) {
      logger.info("Response already exists, skipped insert");
    } else {
      logger.info("Response saved successfully");
    }
  }, "Failed to save response");
}
