import { tasks } from "@trigger.dev/sdk/v3";
import type { generateScreeningPromptTask } from "../trigger/generate-screening-prompt";

/**
 * Запускает задание для генерации промпта скрининга резюме
 */
export async function triggerScreeningPromptGeneration(
  vacancyId: string,
  description: string
): Promise<void> {
  try {
    // В v4 используем tasks.trigger с типом задания и payload
    const handle = await tasks.trigger<typeof generateScreeningPromptTask>(
      "generate-screening-prompt",
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
