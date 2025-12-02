import { db } from "../client";
import { workspaceRepository } from "../repositories/workspace.repository";
import { integration, user, vacancy, workspace } from "../schema";

/**
 * Скрипт миграции существующих данных на архитектуру с workspaces
 *
 * Что делает:
 * 1. Создает workspace по умолчанию
 * 2. Добавляет всех пользователей в этот workspace как owners
 * 3. Привязывает все интеграции к workspace
 * 4. Привязывает все вакансии к workspace
 */

async function migrateToWorkspaces() {
  console.log("🚀 Начало миграции на workspaces...");

  try {
    // Проверяем, есть ли уже workspaces
    const existingWorkspaces = await db.select().from(workspace);

    if (existingWorkspaces.length > 0) {
      console.log("⚠️  Workspaces уже существуют. Пропускаем миграцию.");
      console.log(`Найдено workspaces: ${existingWorkspaces.length}`);
      return;
    }

    // Создаем workspace по умолчанию
    console.log("📦 Создание workspace по умолчанию...");
    const defaultWorkspace = await workspaceRepository.create({
      name: "Default Workspace",
      slug: "default",
      description: "Автоматически созданный workspace при миграции",
    });

    if (!defaultWorkspace) {
      throw new Error("Не удалось создать workspace");
    }

    console.log(`✅ Workspace создан: ${defaultWorkspace.id}`);

    // Получаем всех пользователей
    const users = await db.select().from(user);
    console.log(`👥 Найдено пользователей: ${users.length}`);

    // Добавляем всех пользователей в workspace как owners
    for (const u of users) {
      await workspaceRepository.addUser(defaultWorkspace.id, u.id, "owner");
      console.log(`✅ Пользователь ${u.email} добавлен в workspace`);
    }

    // Обновляем все интеграции
    const integrations = await db.select().from(integration);
    console.log(`🔗 Найдено интеграций: ${integrations.length}`);

    if (integrations.length > 0) {
      await db.update(integration).set({ workspaceId: defaultWorkspace.id });
      console.log(`✅ Все интеграции привязаны к workspace`);
    }

    // Обновляем все вакансии
    const vacancies = await db.select().from(vacancy);
    console.log(`💼 Найдено вакансий: ${vacancies.length}`);

    if (vacancies.length > 0) {
      await db.update(vacancy).set({ workspaceId: defaultWorkspace.id });
      console.log(`✅ Все вакансии привязаны к workspace`);
    }

    console.log("\n🎉 Миграция успешно завершена!");
    console.log(`\nСоздан workspace:`);
    console.log(`  ID: ${defaultWorkspace.id}`);
    console.log(`  Name: ${defaultWorkspace.name}`);
    console.log(`  Slug: ${defaultWorkspace.slug}`);
    console.log(`\nПользователей добавлено: ${users.length}`);
    console.log(`Интеграций обновлено: ${integrations.length}`);
    console.log(`Вакансий обновлено: ${vacancies.length}`);
  } catch (error) {
    console.error("❌ Ошибка при миграции:", error);
    throw error;
  }
}

// Запуск миграции
migrateToWorkspaces()
  .then(() => {
    console.log("\n✨ Готово!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Миграция провалилась:", error);
    process.exit(1);
  });
