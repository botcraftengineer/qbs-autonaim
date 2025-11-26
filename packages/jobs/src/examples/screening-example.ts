/**
 * Пример использования системы генерации промптов для скрининга резюме
 */

import { getScreeningPrompt } from "../services/screening-prompt-service";
import { saveVacancyToDb } from "../services/vacancy-service";

/**
 * Пример 1: Создание вакансии с автоматической генерацией промпта
 */
async function exampleCreateVacancy() {
  console.log("📝 Пример 1: Создание вакансии");

  await saveVacancyToDb({
    id: "senior-nodejs-dev-001",
    title: "Senior Node.js Developer",
    url: "https://hh.ru/vacancy/123456",
    description: `
Мы ищем опытного Senior Node.js разработчика в нашу команду.

Требования:
- Опыт работы с Node.js от 5 лет
- Глубокое знание TypeScript
- Опыт работы с PostgreSQL, Redis
- Знание Docker, Kubernetes
- Опыт проектирования REST API и GraphQL
- Понимание микросервисной архитектуры

Будет плюсом:
- Опыт работы с AWS или другими облачными платформами
- Знание React или Vue.js
- Опыт менторства junior разработчиков

Обязанности:
- Разработка и поддержка backend сервисов
- Проектирование архитектуры новых функций
- Code review и менторство команды
- Оптимизация производительности приложений
    `,
    views: "150",
    responses: "25",
    newResponses: "5",
    resumesInProgress: "3",
    suitableResumes: "2",
    region: "Москва",
  });

  console.log("✅ Вакансия создана, промпт генерируется асинхронно");
}

/**
 * Пример 2: Получение и использование промпта для скрининга
 */
async function exampleGetAndUsePrompt() {
  console.log("\n📋 Пример 2: Получение промпта");

  const vacancyId = "senior-nodejs-dev-001";
  const prompt = await getScreeningPrompt(vacancyId);

  if (!prompt) {
    console.log("⚠️ Промпт еще не сгенерирован, попробуйте позже");
    return;
  }

  console.log("✅ Промпт получен:");
  console.log(prompt.substring(0, 200) + "...");
}

/**
 * Пример 3: Скрининг резюме с использованием промпта
 */
async function exampleScreenResume() {
  console.log("\n🔍 Пример 3: Скрининг резюме");

  const vacancyId = "senior-nodejs-dev-001";
  const prompt = await getScreeningPrompt(vacancyId);

  if (!prompt) {
    console.log("⚠️ Промпт не найден");
    return;
  }

  // Пример данных резюме
  const resumeData = {
    experience: `
Senior Backend Developer в Tech Company (2020-2024)
- Разработка микросервисов на Node.js и TypeScript
- Проектирование REST API и GraphQL endpoints
- Работа с PostgreSQL, Redis, MongoDB
- Деплой в AWS (ECS, Lambda, RDS)
- Менторство 2 junior разработчиков

Middle Backend Developer в StartUp Inc (2018-2020)
- Разработка монолитного приложения на Node.js
- Миграция с JavaScript на TypeScript
- Оптимизация производительности БД
    `,
    education: `
Московский Государственный Университет
Факультет ВМК, Прикладная математика и информатика
2014-2018
    `,
    skills:
      "Node.js, TypeScript, PostgreSQL, Redis, Docker, Kubernetes, AWS, GraphQL, REST API",
    about:
      "Опытный backend разработчик с фокусом на масштабируемые системы и чистый код",
  };

  // Формируем полный промпт для AI
  const fullPrompt = `${prompt}

РЕЗЮМЕ КАНДИДАТА:

ОПЫТ РАБОТЫ:
${resumeData.experience}

ОБРАЗОВАНИЕ:
${resumeData.education}

НАВЫКИ:
${resumeData.skills}

О СЕБЕ:
${resumeData.about}
`;

  console.log("📤 Промпт готов для отправки в AI");
  console.log("Длина промпта:", fullPrompt.length, "символов");

  // Здесь можно отправить в OpenAI, Claude и т.д.
  // const response = await openai.chat.completions.create({
  //   model: "gpt-4",
  //   messages: [{ role: "user", content: fullPrompt }],
  // });

  console.log("\n💡 Ожидаемый формат ответа от AI:");
  console.log(
    JSON.stringify(
      {
        match_percentage: 85,
        recommendation: "invite",
        strengths: [
          "Релевантный опыт работы с Node.js и TypeScript",
          "Опыт работы с требуемым стеком (PostgreSQL, Redis, Docker)",
          "Опыт менторства",
          "Знание AWS",
        ],
        weaknesses: [
          "Нет явного упоминания опыта с Kubernetes в production",
          "Общий опыт 6 лет, требуется 5+ (подходит)",
        ],
        summary:
          "Кандидат отлично подходит для позиции. Имеет весь необходимый опыт и навыки. Рекомендуется пригласить на собеседование.",
      },
      null,
      2
    )
  );
}

/**
 * Запуск всех примеров
 */
async function runExamples() {
  try {
    await exampleCreateVacancy();

    // Ждем немного, чтобы промпт успел сгенерироваться
    console.log(
      "\n⏳ Ожидание генерации промпта (в реальности это происходит асинхронно)..."
    );
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await exampleGetAndUsePrompt();
    await exampleScreenResume();

    console.log("\n✅ Все примеры выполнены");
  } catch (error) {
    console.error("❌ Ошибка:", error);
  }
}

// Раскомментируйте для запуска примеров
// runExamples();

export { exampleCreateVacancy, exampleGetAndUsePrompt, exampleScreenResume };
