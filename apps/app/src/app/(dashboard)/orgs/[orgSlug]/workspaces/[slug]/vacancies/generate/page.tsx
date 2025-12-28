"use client";

import { Button, Card, Input, ScrollArea, Separator } from "@qbs-autonaim/ui";
import { IconSend, IconSparkles } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "~/components/layout";
import { VacancyEditor } from "~/components/vacancy/vacancy-editor";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface VacancyData {
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  conditions: string[];
  salary?: {
    from?: number;
    to?: number;
    currency: string;
  };
}

export default function VacancyGeneratorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Привет! Я помогу создать вакансию. Расскажите, какую позицию вы ищете?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [vacancyData, setVacancyData] = useState<VacancyData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);

    // Симуляция генерации (замените на реальный API вызов)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Отлично! Какие основные требования к кандидату?",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Обновляем данные вакансии
      setVacancyData({
        title: "Senior Frontend Developer",
        description:
          "Мы ищем опытного Frontend разработчика для работы над современными веб-приложениями.",
        requirements: [
          "Опыт работы с React 3+ года",
          "Знание TypeScript",
          "Опыт работы с Next.js",
        ],
        responsibilities: [
          "Разработка новых функций",
          "Код-ревью",
          "Менторинг junior разработчиков",
        ],
        conditions: [
          "Удаленная работа",
          "Гибкий график",
          "Корпоративное обучение",
        ],
        salary: {
          from: 200000,
          to: 300000,
          currency: "RUB",
        },
      });

      setIsGenerating(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <SiteHeader title="Генератор вакансий" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="@container/main flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col gap-4 p-4 lg:flex-row lg:p-6 overflow-hidden">
            {/* Левая панель - Чат */}
            <Card className="flex flex-1 flex-col min-h-0">
              <div className="flex items-center gap-2 border-b p-4">
                <IconSparkles
                  className="size-5 text-primary"
                  aria-hidden="true"
                />
                <h2 className="font-semibold">AI&nbsp;Ассистент</h2>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div
                  className="flex flex-col gap-4"
                  role="log"
                  aria-live="polite"
                  aria-label="История диалога с ассистентом"
                >
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                        role="article"
                        aria-label={
                          message.role === "user"
                            ? "Ваше сообщение"
                            : "Сообщение ассистента"
                        }
                      >
                        <p className="text-sm">{message.content}</p>
                        <span className="mt-1 block text-xs opacity-70 tabular-nums">
                          {message.timestamp.toLocaleTimeString("ru-RU", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isGenerating && (
                    <div className="flex justify-start">
                      <div
                        className="max-w-[80%] rounded-lg bg-muted px-4 py-2"
                        role="status"
                        aria-label="Ассистент печатает"
                      >
                        <div className="flex gap-1">
                          <span className="size-2 animate-bounce rounded-full bg-foreground/50" />
                          <span
                            className="size-2 animate-bounce rounded-full bg-foreground/50"
                            style={{ animationDelay: "0.2s" }}
                          />
                          <span
                            className="size-2 animate-bounce rounded-full bg-foreground/50"
                            style={{ animationDelay: "0.4s" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="border-t p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Опишите требования к вакансии…"
                    disabled={isGenerating}
                    className="flex-1"
                    aria-label="Сообщение ассистенту"
                    autoComplete="off"
                  />
                  <Button
                    type="submit"
                    onClick={handleSend}
                    disabled={!input.trim() || isGenerating}
                    size="icon"
                    aria-label="Отправить сообщение"
                  >
                    <IconSend className="size-4" aria-hidden="true" />
                  </Button>
                </form>
              </div>
            </Card>

            {/* Правая панель - Превью вакансии */}
            <Card className="flex w-full flex-col lg:w-1/2 lg:max-w-2xl min-h-0">
              <div className="border-b p-4">
                <h2 className="font-semibold">Превью вакансии</h2>
              </div>

              <ScrollArea className="flex-1 p-6">
                {vacancyData ? (
                  isEditing ? (
                    <VacancyEditor
                      data={vacancyData}
                      onChange={setVacancyData}
                      onSave={() => {
                        setIsEditing(false);
                        // TODO: Сохранить в базу
                      }}
                      onCancel={() => setIsEditing(false)}
                    />
                  ) : (
                    <article className="space-y-6">
                      <header>
                        <h1 className="text-2xl font-bold">
                          {vacancyData.title}
                        </h1>
                        {vacancyData.salary && (
                          <p className="mt-2 text-lg font-medium text-muted-foreground tabular-nums">
                            {vacancyData.salary.from?.toLocaleString("ru-RU")} —{" "}
                            {vacancyData.salary.to?.toLocaleString("ru-RU")}{" "}
                            {vacancyData.salary.currency === "RUB" ? "₽" : "$"}
                          </p>
                        )}
                      </header>

                      <Separator />

                      <section>
                        <h2 className="mb-2 font-semibold">Описание</h2>
                        <p className="text-sm text-muted-foreground">
                          {vacancyData.description}
                        </p>
                      </section>

                      <section>
                        <h2 className="mb-2 font-semibold">Требования</h2>
                        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                          {vacancyData.requirements.map((req) => (
                            <li key={req}>{req}</li>
                          ))}
                        </ul>
                      </section>

                      <section>
                        <h2 className="mb-2 font-semibold">Обязанности</h2>
                        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                          {vacancyData.responsibilities.map((resp) => (
                            <li key={resp}>{resp}</li>
                          ))}
                        </ul>
                      </section>

                      <section>
                        <h2 className="mb-2 font-semibold">Условия</h2>
                        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                          {vacancyData.conditions.map((cond) => (
                            <li key={cond}>{cond}</li>
                          ))}
                        </ul>
                      </section>

                      <Separator />

                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          aria-label="Сохранить вакансию в базу данных"
                        >
                          Сохранить вакансию
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                          aria-label="Редактировать вакансию"
                        >
                          Редактировать
                        </Button>
                      </div>
                    </article>
                  )
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <IconSparkles
                        className="mx-auto mb-4 size-12 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <p className="text-muted-foreground">
                        Вакансия появится здесь после диалога с&nbsp;ассистентом
                      </p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
