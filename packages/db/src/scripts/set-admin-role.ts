import { eq } from "drizzle-orm";
import { db } from "../client";
import { user } from "../schema";

const userEmail = process.argv[2];

if (!userEmail) {
  console.error("❌ Укажите email пользователя");
  console.log("Использование: bun run set-admin <email>");
  process.exit(1);
}

async function setAdminRole(emailAddress: string) {
  try {
    const result = await db
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.email, emailAddress))
      .returning({ id: user.id, email: user.email, role: user.role });

    if (result.length === 0) {
      console.error(`❌ Пользователь с email ${emailAddress} не найден`);
      process.exit(1);
    }

    console.log("✅ Роль администратора успешно установлена:");
    console.log(`   Email: ${result[0]?.email}`);
    console.log(`   Role: ${result[0]?.role}`);
  } catch (error) {
    console.error("❌ Ошибка при установке роли:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

setAdminRole(userEmail);
