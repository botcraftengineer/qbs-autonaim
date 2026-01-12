import { db } from "../client";
import { customDomain, PRESET_DOMAIN_IDS } from "../schema";

/**
 * Seed для предустановленных доменов
 * Запускается при инициализации БД или вручную
 */
export async function seedPresetDomains() {
  console.log("🌱 Seeding preset domains...");

  const presetDomains = [
    {
      id: PRESET_DOMAIN_IDS.HRBOT_PRO,
      domain: "hrbot.pro",
      type: "interview" as const,
      cnameTarget: "cname.hrbot.pro",
      isVerified: true,
      isPrimary: false,
      isPreset: true,
      workspaceId: null,
      sslStatus: "active" as const,
    },
  ];

  for (const preset of presetDomains) {
    try {
      await db
        .insert(customDomain)
        .values(preset)
        .onConflictDoNothing({ target: customDomain.id });

      console.log(`✅ Preset domain seeded: ${preset.domain}`);
    } catch (error) {
      console.error(`❌ Failed to seed preset domain ${preset.domain}:`, error);
    }
  }

  console.log("✨ Preset domains seeding completed");
}

// Запуск напрямую через bun
if (import.meta.main) {
  seedPresetDomains()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Failed to seed preset domains:", error);
      process.exit(1);
    });
}
