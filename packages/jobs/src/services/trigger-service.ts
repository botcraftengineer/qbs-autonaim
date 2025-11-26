import { tasks } from "@trigger.dev/sdk";
import type { extractVacancyRequirementsTask } from "../trigger/extract-vacancy-requirements";

/**
 * Запускает задание для извлечения требований вакансии через AI
 */
export async function triggerVacancyRequirementsExtraction(
  vacancyId: string,
  description: string
): Promise<void> {
  try {
    // В v4 используем tasks.trigger с типом задания и payload
    const handle = await tasks.trigger<typeof extractVacancyRequirementsTask>(
      "extract-vacancy-requirements",
      {
        vacancyId,
        description,
      }
    );

    console.log(`✅ Задание запущено: ${handle.id}`);
  } catch (error) {
    console.error(
      `❌ Ошибка запуска задания генерации промпта для ${vacancyId}:`,
      error
    );
    // Не пробрасываем ошибку, чтобы не блокировать основной процесс
  }
}
