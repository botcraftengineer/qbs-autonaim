/**
 * Пример использования AI скрининга через DeepSeek
 */

import { batchScreenResumes, screenResumeWithAI } from "../services/ai-service";
import type { ResumeScreeningData } from "../types/screening";

/**
 * Пример 1: Скрининг одного резюме
 */
async function exampleSingleScreening() {
  console.log("🔍 Пример 1: Скрининг одного резюме через DeepSeek");

  const vacancyId = "senior-nodejs-dev-001";

  const resumeData: ResumeScreeningData = {
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
    about: "Опытный backend разработчик с фокусом на масштабируемые системы",
  };

  const result = await screenResumeWithAI(vacancyId, resumeData);

  if (result) {
    console.log("\n✅ Результат скрининга:");
    console.log(`   Соответствие: ${result.match_percentage}%`);
    console.log(`   Рекомендация: ${result.recommendation}`);
    console.log(`   Сильные стороны: ${result.strengths.join(", ")}`);
    console.log(`   Слабые стороны: ${result.weaknesses.join(", ")}`);
    console.log(`   Резюме: ${result.summary}`);
  } else {
    console.log("❌ Не удалось выполнить скрининг");
  }
}

/**
 * Пример 2: Пакетный скрининг нескольких резюме
 */
async function exampleBatchScreening() {
  console.log("\n🔄 Пример 2: Пакетный скрининг резюме");

  const vacancyId = "senior-nodejs-dev-001";

  const resumes: ResumeScreeningData[] = [
    {
      experience: "Senior Developer, 6 лет опыта с Node.js и TypeScript",
      skills: "Node.js, TypeScript, PostgreSQL, Docker",
    },
    {
      experience: "Junior Developer, 1 год опыта с JavaScript",
      skills: "JavaScript, HTML, CSS",
    },
    {
      experience: "Middle Developer, 3 года опыта с Python и Django",
      skills: "Python, Django, PostgreSQL",
    },
  ];

  const results = await batchScreenResumes(vacancyId, resumes);

  console.log("\n📊 Результаты пакетного скрининга:");
  results.forEach((result, index) => {
    if (result) {
      console.log(`\n   Кандидат ${index + 1}:`);
      console.log(`   - Соответствие: ${result.match_percentage}%`);
      console.log(`   - Рекомендация: ${result.recommendation}`);
    } else {
      console.log(`\n   Кандидат ${index + 1}: Ошибка скрининга`);
    }
  });
}

/**
 * Пример 3: Интеграция с парсером HH.ru
 */
async function exampleWithHHParser() {
  console.log("\n🌐 Пример 3: Интеграция с парсером HH.ru");

  // Предположим, что мы получили данные из HH.ru парсера
  const hhResumeData = {
    experience: "Опыт работы из HH.ru...",
    education: "Образование из HH.ru...",
    about: "О себе из HH.ru...",
    languages: "Английский - B2",
    courses: "Курсы по Node.js",
  };

  const vacancyId = "senior-nodejs-dev-001";

  console.log("📥 Данные резюме получены из HH.ru");
  console.log("🤖 Запуск AI скрининга...");

  const result = await screenResumeWithAI(vacancyId, hhResumeData);

  if (result) {
    console.log("\n✅ Скрининг завершен");
    console.log(`   Рекомендация: ${result.recommendation}`);

    // Принятие решения на основе результата
    switch (result.recommendation) {
      case "invite":
        console.log("   ✉️ Действие: Отправить приглашение на собеседование");
        break;
      case "reject":
        console.log("   ❌ Действие: Отклонить кандидата");
        break;
      case "need_info":
        console.log("   ❓ Действие: Запросить дополнительную информацию");
        break;
    }
  }
}

/**
 * Запуск всех примеров
 */
async function runExamples() {
  try {
    await exampleSingleScreening();
    await exampleBatchScreening();
    await exampleWithHHParser();

    console.log("\n✅ Все примеры выполнены");
  } catch (error) {
    console.error("❌ Ошибка:", error);
  }
}

// Раскомментируйте для запуска
// runExamples();

export { exampleSingleScreening, exampleBatchScreening, exampleWithHHParser };
