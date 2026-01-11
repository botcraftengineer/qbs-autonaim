import { z } from "zod/v4";

export const gigTypeOptions = [
  { value: "DEVELOPMENT", label: "Разработка", emoji: "💻" },
  { value: "DESIGN", label: "Дизайн", emoji: "🎨" },
  { value: "COPYWRITING", label: "Копирайтинг", emoji: "✍️" },
  { value: "MARKETING", label: "Маркетинг", emoji: "📈" },
  { value: "TRANSLATION", label: "Перевод", emoji: "🌍" },
  { value: "VIDEO", label: "Видео", emoji: "🎬" },
  { value: "AUDIO", label: "Аудио", emoji: "🎵" },
  { value: "DATA_ENTRY", label: "Ввод данных", emoji: "📊" },
  { value: "RESEARCH", label: "Исследования", emoji: "🔬" },
  { value: "CONSULTING", label: "Консалтинг", emoji: "💼" },
  { value: "OTHER", label: "Другое", emoji: "📦" },
] as const;

export type GigType = (typeof gigTypeOptions)[number]["value"];

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  quickReplies?: string[];
}

export interface GigDraft {
  title: string;
  description: string;
  type: GigType;
  deliverables: string;
  requiredSkills: string;
  budgetMin: number | undefined;
  budgetMax: number | undefined;

  estimatedDuration: string;
}

// Remove the unused optionalPositiveInt schema

export const formSchema = z.object({
  title: z.string().min(1, "Укажите название задания").max(500),
  description: z.string(),
  type: z.enum([
    "DEVELOPMENT",
    "DESIGN",
    "COPYWRITING",
    "MARKETING",
    "TRANSLATION",
    "VIDEO",
    "AUDIO",
    "DATA_ENTRY",
    "RESEARCH",
    "CONSULTING",
    "OTHER",
  ]),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),

  deadline: z.string(),
  estimatedDuration: z.string().max(100),
  deliverables: z.string(),
  requiredSkills: z.string(),
});

export type FormValues = z.infer<typeof formSchema>;

export const typeKeywords: Record<GigType, string[]> = {
  DEVELOPMENT: [
    "разработ",
    "программ",
    "код",
    "сайт",
    "приложен",
    "backend",
    "frontend",
    "api",
  ],
  DESIGN: ["дизайн", "макет", "figma", "ui", "ux", "логотип", "баннер"],
  COPYWRITING: ["текст", "статья", "копирайт", "контент", "описани"],
  MARKETING: ["маркетинг", "реклам", "продвижен", "smm", "таргет"],
  TRANSLATION: ["перевод", "локализац"],
  VIDEO: ["видео", "монтаж", "ролик", "анимац"],
  AUDIO: ["аудио", "звук", "музык", "подкаст"],
  DATA_ENTRY: ["данн", "ввод", "excel", "таблиц"],
  RESEARCH: ["исследован", "анализ", "аудит"],
  CONSULTING: ["консульт", "совет", "стратег"],
  OTHER: [],
};

export const generateId = () => Math.random().toString(36).substring(2, 9);
