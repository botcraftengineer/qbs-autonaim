/**
 * Простой скрипт для тестирования API создания тестовых данных
 */

async function testAPI() {
  const baseURL = "http://localhost:3000";
  const email = `test-${Date.now()}@example.com`;
  const password = "TestPassword123";

  console.log("🧪 Тестируем API создания пользователя...");
  console.log(`Email: ${email}`);

  try {
    // Создаем пользователя
    console.log("\n1️⃣ Создаем пользователя через API...");
    const createResponse = await fetch(`${baseURL}/api/test/setup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        name: "Test User",
        orgName: "Test Org",
        workspaceName: "Test Workspace",
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      console.error("❌ Ошибка создания:", error);
      return;
    }

    const data = await createResponse.json();
    console.log("✅ Пользователь создан!");
    console.log("📊 Данные:", JSON.stringify(data, null, 2));

    // Удаляем пользователя
    console.log("\n2️⃣ Удаляем пользователя...");
    const deleteResponse = await fetch(`${baseURL}/api/test/setup`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!deleteResponse.ok) {
      const error = await deleteResponse.json();
      console.error("❌ Ошибка удаления:", error);
      return;
    }

    console.log("✅ Пользователь удален!");
    console.log("\n🎉 Все тесты прошли успешно!");
  } catch (error) {
    console.error("❌ Ошибка:", error);
  }
}

testAPI();
