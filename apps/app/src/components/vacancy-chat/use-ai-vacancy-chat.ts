"use client";

import { useCallback, useRef, useState } from "react";
import type {
  ChatError,
  ChatStatus,
  ConversationMessage,
  QuickReply,
  VacancyDocument,
} from "./types";

interface UseAIVacancyChatOptions {
  workspaceId: string;
  initialDocument?: VacancyDocument;
  apiEndpoint?: string;
  timeout?: number;
  botSettings?: {
    id?: string;
    companyName: string;
    companyDescription?: string;
    companyWebsite?: string;
    botName: string;
    botRole: string;
  } | null;
}

interface UseAIVacancyChatReturn {
  document: VacancyDocument;
  messages: ConversationMessage[];
  status: ChatStatus;
  error: ChatError | null;
  sendMessage: (content: string) => Promise<void>;
  selectQuickReply: (value: string) => void;
  selectMultipleReplies: (values: string[]) => Promise<void>;
  clearChat: () => void;
  retry: () => Promise<void>;
}

function createWelcomeMessage(
  botSettings?: {
    id?: string;
    companyName: string;
    companyDescription?: string;
    companyWebsite?: string;
    botName: string;
    botRole: string;
  } | null,
): ConversationMessage {
  const hasSettings = !!botSettings?.companyName;

  if (!hasSettings) {
    const companyTemplates = [
      {
        id: "company-startup",
        label: "🚀 IT-стартап",
        value:
          "Компания: TechStart (стартап), занимается разработкой мобильных приложений. Сайт: techstart.ru, Бот: Алексей, роль: HR-менеджер",
      },
      {
        id: "company-product",
        label: "🏢 Продуктовая IT-компания",
        value:
          "Компания: SoftPro, занимается разработкой SaaS-продуктов. Сайт: softpro.com, Бот: Мария, роль: Специалист по подбору персонала",
      },
      {
        id: "company-agency",
        label: "🎯 Digital-агентство",
        value:
          "Компания: DigitalWave, занимается веб-разработкой и маркетингом. Сайт: digitalwave.ru, Бот: Дмитрий, роль: Руководитель отдела подбора",
      },
      {
        id: "company-corporate",
        label: "🏛 Крупная корпорация",
        value:
          "Компания: MegaCorp, занимается enterprise-решениями. Сайт: megacorp.ru, Бот: Анна, роль: Корпоративный рекрутер",
      },
      {
        id: "company-freelance",
        label: "👤 Фрилансер/Индивидуальный проект",
        value:
          "Фрилансер: Иван Петров, занимается разработкой. Специализация: React, Node.js. Бот: Иван, роль: Фрилансер",
      },
      {
        id: "company-consulting",
        label: "💼 Консалтинговая компания",
        value:
          "Компания: ConsultPro, занимается IT-консалтингом. Сайт: consultpro.ru, Бот: Сергей, роль: Партнёр по подбору талантов",
      },
    ];

    return {
      id: "welcome",
      role: "assistant",
      content: `Привет! 👋 Я — ваш AI-ассистент по подбору персонала.

Прежде чем мы начнём создавать вакансию, мне нужно узнать немного о вашей компании. Это поможет сделать описание вакансии более точным и привлекательным для кандидатов.

**Что мне нужно знать:**
• Название компании
• Чем занимается компания
• Сайт (если есть)
• Имя для бота-рекрутера
• Роль бота (например: "HR-менеджер", "Рекрутер", "Специалист по подбору")

**Способы настройки:**
1. **Опишите свободно** — расскажите о компании своими словами
2. **Выберите шаблон** — для быстрой настройки

Или выберите быстрый вариант ниже:`,
      quickReplies: [
        {
          id: "company-startup",
          label: "🚀 IT-стартап",
          value:
            "Компания: TechStart (стартап), занимается разработкой мобильных приложений. Сайт: techstart.ru, Бот: Алексей, роль: HR-менеджер",
        },
        {
          id: "company-product",
          label: "🏢 Продуктовая IT-компания",
          value:
            "Компания: SoftPro, занимается разработкой SaaS-продуктов. Сайт: softpro.com, Бот: Мария, роль: Специалист по подбору персонала",
        },
        {
          id: "company-agency",
          label: "🎯 Digital-агентство",
          value:
            "Компания: DigitalWave, занимается веб-разработкой и маркетингом. Сайт: digitalwave.ru, Бот: Дмитрий, роль: Руководитель отдела подбора",
        },
        {
          id: "company-corporate",
          label: "🏛 Крупная корпорация",
          value:
            "Компания: MegaCorp, занимается enterprise-решениями. Сайт: megacorp.ru, Бот: Анна, роль: Корпоративный рекрутер",
        },
        {
          id: "company-freelance",
          label: "👤 Фрилансер/Индивидуальный проект",
          value:
            "Фрилансер: Иван Петров, занимается разработкой. Специализация: React, Node.js. Бот: Иван, роль: Фрилансер",
        },
        {
          id: "company-consulting",
          label: "💼 Консалтинговая компания",
          value:
            "Компания: ConsultPro, занимается IT-консалтингом. Сайт: consultpro.ru, Бот: Сергей, роль: Партнёр по подбору талантов",
        },
        {
          id: "company-custom",
          label: "✏️ Описать свою компанию",
          value: "О компании",
          freeform: true,
          placeholder:
            "Расскажите о вашей компании: название, чем занимаетесь, сайт, желаемое имя и роль для бота-рекрутера...",
          maxLength: 1000,
        },
      ],
      timestamp: new Date(),
    };
  }

  const companyName = botSettings.companyName;
  const botName = botSettings.botName;
  const botRole = botSettings.botRole;

  return {
    id: "welcome",
    role: "assistant",
    content: `Привет! 👋 Меня зовут ${botName}, я ${botRole} компании "${companyName}".

Я помогу создать профессиональную вакансию, которая привлечёт качественных кандидатов. Расскажите, кого вы ищете? Можете описать задачу своими словами или выбрать один из популярных вариантов.

💡 *Подсказка:* Настройки компании можно изменить, нажав на иконку редактирования в верхней части чата.`,
    quickReplies: [
      { id: "dev", label: "💻 Разработчик", value: "Ищу разработчика" },
      { id: "design", label: "🎨 Дизайнер", value: "Ищу дизайнера" },
      {
        id: "pm",
        label: "📋 Менеджер проекта",
        value: "Ищу менеджера проекта",
      },
      { id: "marketing", label: "📈 Маркетолог", value: "Ищу маркетолога" },
      {
        id: "sales",
        label: "💼 Менеджер по продажам",
        value: "Ищу менеджера по продажам",
      },
      { id: "analyst", label: "📊 Аналитик", value: "Ищу аналитика данных" },
      { id: "hr", label: "👥 HR-специалист", value: "Ищу HR-специалиста" },
      {
        id: "other",
        label: "🔍 Другая специализация",
        value: "Ищу специалиста другой специализации",
      },
      {
        id: "custom-vacancy",
        label: "✏️ Описать задачу подробно",
        value: "Описание вакансии",
        freeform: true,
        placeholder:
          "Расскажите подробно о вакансии: какая задача, требования к кандидату, условия работы, бюджет...",
        maxLength: 2000,
      },
    ],
    timestamp: new Date(),
  };
}

export function useAIVacancyChat({
  workspaceId,
  initialDocument = {},
  apiEndpoint = "/api/vacancy/chat-generate",
  timeout = 60000,
  botSettings,
}: UseAIVacancyChatOptions): UseAIVacancyChatReturn {
  const [document, setDocument] = useState<VacancyDocument>(initialDocument);
  const [messages, setMessages] = useState<ConversationMessage[]>([
    createWelcomeMessage(botSettings),
  ]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<ChatError | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastMessageRef = useRef<string | null>(null);

  const createError = useCallback(
    (
      type: ChatError["type"],
      message: string,
      retryable: boolean,
    ): ChatError => ({
      type,
      message,
      retryable,
    }),
    [],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || status === "streaming" || status === "loading")
        return;

      lastMessageRef.current = content;
      setError(null);
      setStatus("loading");

      // Добавляем сообщение пользователя
      const userMessage: ConversationMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      // Добавляем placeholder для ответа ассистента
      const assistantPlaceholder: ConversationMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        isStreaming: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [
        ...prev.slice(-18),
        userMessage,
        assistantPlaceholder,
      ]);

      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(
        () => abortControllerRef.current?.abort(),
        timeout,
      );

      try {
        const conversationHistory = messages
          .filter((m) => m.id !== "welcome")
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content }));

        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId,
            message: content.trim(),
            currentDocument: document,
            conversationHistory,
          }),
          signal: abortControllerRef.current.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error: ${response.status}`);
        }

        setStatus("streaming");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let latestMessage = "";
        let latestQuickReplies: QuickReply[] | undefined;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            try {
              const data = JSON.parse(line.slice(6));

              // Обновляем документ
              if (data.document) {
                setDocument(data.document);
              }

              // Если настроили компанию, обновляем настройки в state
              if (data.companySetup && data.companySettings) {
                // После настройки компании показываем сообщение об успешной настройке
                const setupCompleteMessage: ConversationMessage = {
                  id: `setup-complete-${Date.now()}`,
                  role: "assistant",
                  content: `Отлично! 🎉 Настройки компании сохранены.

Теперь я — ${data.companySettings.botName}, ${data.companySettings.botRole} компании "${data.companySettings.companyName}".

Расскажите, кого вы ищете? Я помогу создать профессиональную вакансию с учётом специфики вашей компании.`,
                  quickReplies: [
                    {
                      id: "dev",
                      label: "💻 Разработчик",
                      value: "Ищу разработчика",
                    },
                    {
                      id: "design",
                      label: "🎨 Дизайнер",
                      value: "Ищу дизайнера",
                    },
                    {
                      id: "pm",
                      label: "📋 Менеджер проекта",
                      value: "Ищу менеджера проекта",
                    },
                    {
                      id: "marketing",
                      label: "📈 Маркетолог",
                      value: "Ищу маркетолога",
                    },
                    {
                      id: "sales",
                      label: "💼 Менеджер по продажам",
                      value: "Ищу менеджера по продажам",
                    },
                    {
                      id: "analyst",
                      label: "📊 Аналитик",
                      value: "Ищу аналитика данных",
                    },
                  ],
                  timestamp: new Date(),
                };

                setMessages([setupCompleteMessage]);
                return;
              }

              // Обновляем сообщение в реальном времени
              if (data.message) {
                latestMessage = data.message;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.isStreaming ? { ...m, content: latestMessage } : m,
                  ),
                );
              }

              // Финальный ответ с quickReplies
              if (data.done) {
                latestQuickReplies = data.quickReplies;

                setMessages((prev) =>
                  prev.map((m) =>
                    m.isStreaming
                      ? {
                          ...m,
                          content: latestMessage || "Готово!",
                          quickReplies: latestQuickReplies,
                          isMultiSelect: data.isMultiSelect ?? false,
                          isStreaming: false,
                        }
                      : m,
                  ),
                );
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }

        setStatus("idle");
      } catch (err) {
        clearTimeout(timeoutId);

        if (err instanceof Error && err.name === "AbortError") {
          setStatus("idle");
          return;
        }

        const chatError = createError(
          "network",
          err instanceof Error ? err.message : "Произошла ошибка",
          true,
        );
        setError(chatError);
        setStatus("error");

        // Убираем placeholder при ошибке
        setMessages((prev) => prev.filter((m) => !m.isStreaming));
      } finally {
        abortControllerRef.current = null;
      }
    },
    [
      workspaceId,
      document,
      messages,
      apiEndpoint,
      timeout,
      status,
      createError,
    ],
  );

  const selectQuickReply = useCallback(
    (value: string) => {
      sendMessage(value);
    },
    [sendMessage],
  );

  const selectMultipleReplies = useCallback(
    async (values: string[]) => {
      if (values.length === 0) return;
      const combined = values.join(", ");
      await sendMessage(combined);
    },
    [sendMessage],
  );

  const retry = useCallback(async () => {
    if (lastMessageRef.current) {
      setMessages((prev) => prev.filter((m) => !m.isStreaming));
      await sendMessage(lastMessageRef.current);
    }
  }, [sendMessage]);

  const clearChat = useCallback(() => {
    setDocument({});
    setMessages([createWelcomeMessage(botSettings)]);
    setError(null);
    setStatus("idle");
  }, [botSettings]);

  return {
    document,
    messages,
    status,
    error,
    sendMessage,
    selectQuickReply,
    selectMultipleReplies,
    clearChat,
    retry,
  };
}
