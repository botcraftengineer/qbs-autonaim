"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Textarea,
} from "@qbs-autonaim/ui";
import {
  type UpdateVacancySettingsInput,
  updateVacancySettingsSchema,
} from "@qbs-autonaim/validators";
import {
  IconExternalLink,
  Loader2,
  MessageSquare,
  Save,
  Settings,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface VacancySettingsFormProps {
  vacancyTitle?: string;
  vacancyDescription?: string;
  initialData?: {
    customBotInstructions?: string | null;
    customScreeningPrompt?: string | null;
    customInterviewQuestions?: string | null;
    customOrganizationalQuestions?: string | null;
    source?: "HH" | "KWORK" | "FL_RU" | "FREELANCE_RU" | "AVITO" | "SUPERJOB" | "HABR" | "WEB_LINK";
    externalId?: string | null;
    url?: string | null;
  };
  onSave: (data: UpdateVacancySettingsInput) => Promise<void>;
  onImprove: (
    fieldType: keyof UpdateVacancySettingsInput,
    currentValue: string,
    context?: { vacancyTitle?: string; vacancyDescription?: string },
  ) => Promise<string>;
}

export function VacancySettingsForm({
  vacancyTitle,
  vacancyDescription,
  initialData,
  onSave,
  onImprove,
}: VacancySettingsFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [improvingField, setImprovingField] = useState<string | null>(null);

  const form = useForm<UpdateVacancySettingsInput>({
    resolver: zodResolver(updateVacancySettingsSchema),
    defaultValues: {
      customBotInstructions: initialData?.customBotInstructions ?? "",
      customScreeningPrompt: initialData?.customScreeningPrompt ?? "",
      customInterviewQuestions: initialData?.customInterviewQuestions ?? "",
      customOrganizationalQuestions:
        initialData?.customOrganizationalQuestions ?? "",
      source: initialData?.source ?? undefined,
      externalId: initialData?.externalId ?? "",
      url: initialData?.url ?? "",
    },
  });

  useEffect(() => {
    const subscription = form.watch(() => {
      setHasChanges(form.formState.isDirty);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  const handleSubmit = async (data: UpdateVacancySettingsInput) => {
    setIsSaving(true);
    try {
      await onSave(data);
      toast.success("Настройки сохранены");
      form.reset(data);
      setHasChanges(false);
    } catch (error) {
      toast.error("Ошибка при сохранении настроек");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImprove = async (fieldName: keyof UpdateVacancySettingsInput) => {
    const currentValue = form.getValues(fieldName);

    if (!currentValue?.trim()) {
      toast.error("Сначала введите текст для улучшения");
      return;
    }

    setImprovingField(fieldName);
    try {
      const improvedText = await onImprove(fieldName, currentValue, {
        vacancyTitle,
        vacancyDescription,
      });
      form.setValue(fieldName, improvedText, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast.success("Текст улучшен с помощью AI");
    } catch (error) {
      toast.error("Не удалось улучшить текст");
      console.error(error);
    } finally {
      setImprovingField(null);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="max-w-4xl">
          <Card className="p-6">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-linear-to-br from-primary/20 to-primary/10 p-3">
                  <Sparkles
                    className="size-6 text-primary"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Настройки AI-бота
                  </h2>
                  <p className="text-muted-foreground">
                    Настройте поведение бота для этой вакансии
                  </p>
                </div>
              </div>
              <Separator className="mb-6" />
            </div>

            <div className="space-y-8">
              {/* Основные инструкции для бота */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Settings className="size-4 text-muted-foreground" />
                  <h3 className="text-base font-medium text-foreground">
                    Общие настройки
                  </h3>
                </div>
                <FormField
                  control={form.control}
                  name="customBotInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Общие инструкции для бота
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Например: Обращай внимание на релевантный опыт работы и ключевые навыки. Важно уточнить мотивацию кандидата и готовность к условиям работы…"
                            className="min-h-32 resize-y font-mono text-sm pr-12 leading-relaxed"
                            maxLength={5000}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleImprove("customBotInstructions")
                            }
                            disabled={
                              improvingField === "customBotInstructions" ||
                              !field.value?.trim()
                            }
                            className="absolute right-2 top-2 h-8 gap-1.5 text-xs hover:bg-primary/10"
                            aria-label="Улучшить инструкции с помощью AI"
                          >
                            {improvingField === "customBotInstructions" ? (
                              <Loader2
                                className="size-3.5 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <Wand2 className="size-3.5" aria-hidden="true" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Эти инструкции будут использоваться ботом при общении с
                        кандидатами. Укажите, на что обратить внимание, какие
                        вопросы задавать.
                      </FormDescription>
                      <FormMessage />
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-muted-foreground text-xs">
                          {field.value?.length ?? 0} / 5000 символов
                        </div>
                        {improvingField === "customBotInstructions" && (
                          <span className="text-muted-foreground text-xs flex items-center gap-1">
                            <Loader2 className="size-3 animate-spin" />
                            Улучшение…
                          </span>
                        )}
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customScreeningPrompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Инструкции для скрининга резюме
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Например: При оценке резюме обрати особое внимание на релевантный коммерческий опыт, наличие ключевых навыков и достижения в профильной области…"
                            className="min-h-32 resize-y font-mono text-sm pr-12 leading-relaxed"
                            maxLength={5000}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleImprove("customScreeningPrompt")
                            }
                            disabled={
                              improvingField === "customScreeningPrompt" ||
                              !field.value?.trim()
                            }
                            className="absolute right-2 top-2 h-8 gap-1.5 text-xs hover:bg-primary/10"
                            aria-label="Улучшить инструкции с помощью AI"
                          >
                            {improvingField === "customScreeningPrompt" ? (
                              <Loader2
                                className="size-3.5 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <Wand2 className="size-3.5" aria-hidden="true" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Дополнительные критерии для автоматической оценки
                        резюме. Укажите, какие навыки или опыт важнее всего.
                      </FormDescription>
                      <FormMessage />
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-muted-foreground text-xs">
                          {field.value?.length ?? 0} / 5000 символов
                        </div>
                        {improvingField === "customScreeningPrompt" && (
                          <span className="text-muted-foreground text-xs flex items-center gap-1">
                            <Loader2 className="size-3 animate-spin" />
                            Улучшение…
                          </span>
                        )}
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-8" />

              {/* Привязка к внешней платформе */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <IconExternalLink className="size-4 text-muted-foreground" />
                  <h3 className="text-base font-medium text-foreground">
                    Привязка к внешней платформе
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Платформа
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger aria-label="Выберите платформу">
                              <SelectValue placeholder="Выберите платформу" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="HH">HeadHunter</SelectItem>
                            <SelectItem value="KWORK">Kwork</SelectItem>
                            <SelectItem value="FL_RU">FL.ru</SelectItem>
                            <SelectItem value="FREELANCE_RU">Freelance.ru</SelectItem>
                            <SelectItem value="AVITO">Avito</SelectItem>
                            <SelectItem value="SUPERJOB">SuperJob</SelectItem>
                            <SelectItem value="HABR">Хабр Карьера</SelectItem>
                            <SelectItem value="WEB_LINK">Веб-ссылка</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          Платформа, на которой размещена вакансия
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="externalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Внешний ID
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Например: 12345678"
                            aria-label="Внешний ID вакансии"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          ID вакансии на внешней платформе (опционально)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        URL вакансии на платформе
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          type="url"
                          placeholder="https://hh.ru/vacancy/12345678"
                          aria-label="URL вакансии на платформе"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Ссылка на вакансию на фриланс-платформе (опционально)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Индикатор статуса привязки */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <div className={`w-2 h-2 rounded-full ${form.watch("url")?.trim() ? "bg-green-500" : "bg-gray-400"}`}></div>
                  <span className="text-sm text-muted-foreground">
                    {form.watch("url")?.trim() ? "Привязана к внешней платформе" : "Не привязана к внешней платформе"}
                  </span>
                </div>
              </div>

              <Separator className="my-8" />

              {/* Вопросы для интервью */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-4 text-muted-foreground" />
                  <h3 className="text-base font-medium text-foreground">
                    Вопросы для интервью
                  </h3>
                </div>
                <FormField
                  control={form.control}
                  name="customInterviewQuestions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Технические и профессиональные вопросы
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Например:&#10;1. Расскажите о вашем профессиональном опыте и ключевых достижениях&#10;2. Какие проекты или задачи вы считаете наиболее успешными?&#10;3. Почему вас интересует эта позиция?…"
                            className="min-h-40 resize-y font-mono text-sm pr-12 leading-relaxed"
                            maxLength={5000}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleImprove("customInterviewQuestions")
                            }
                            disabled={
                              improvingField === "customInterviewQuestions" ||
                              !field.value?.trim()
                            }
                            className="absolute right-2 top-2 h-8 gap-1.5 text-xs hover:bg-primary/10"
                            aria-label="Улучшить вопросы с помощью AI"
                          >
                            {improvingField === "customInterviewQuestions" ? (
                              <Loader2
                                className="size-3.5 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <Wand2 className="size-3.5" aria-hidden="true" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Список вопросов, которые бот будет задавать кандидатам
                        во время интервью в Telegram. Каждый вопрос с новой
                        строки.
                      </FormDescription>
                      <FormMessage />
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-muted-foreground text-xs">
                          {field.value?.length ?? 0} / 5000 символов
                        </div>
                        {improvingField === "customInterviewQuestions" && (
                          <span className="text-muted-foreground text-xs flex items-center gap-1">
                            <Loader2 className="size-3 animate-spin" />
                            Улучшение…
                          </span>
                        )}
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customOrganizationalQuestions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Организационные вопросы
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Например:&#10;1. Когда вы готовы приступить к работе?&#10;2. Какой формат работы вам подходит?&#10;3. Есть ли у вас другие офферы на рассмотрении?…"
                            className="min-h-32 resize-y font-mono text-sm pr-12 leading-relaxed"
                            maxLength={5000}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleImprove("customOrganizationalQuestions")
                            }
                            disabled={
                              improvingField ===
                                "customOrganizationalQuestions" ||
                              !field.value?.trim()
                            }
                            className="absolute right-2 top-2 h-8 gap-1.5 text-xs hover:bg-primary/10"
                            aria-label="Улучшить вопросы с помощью AI"
                          >
                            {improvingField ===
                            "customOrganizationalQuestions" ? (
                              <Loader2
                                className="size-3.5 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <Wand2 className="size-3.5" aria-hidden="true" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Организационные вопросы, которые бот будет задавать в
                        начале интервью (график работы, зарплата, сроки начала и
                        т.д.). Каждый вопрос с новой строки.
                      </FormDescription>
                      <FormMessage />
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-muted-foreground text-xs">
                          {field.value?.length ?? 0} / 5000 символов
                        </div>
                        {improvingField === "customOrganizationalQuestions" && (
                          <span className="text-muted-foreground text-xs flex items-center gap-1">
                            <Loader2 className="size-3 animate-spin" />
                            Улучшение…
                          </span>
                        )}
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </Card>

          {/* Статус и кнопка сохранения */}
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              {hasChanges ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Есть несохраненные изменения
                  </p>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <p className="text-sm text-muted-foreground">
                    Все изменения сохранены
                  </p>
                </>
              )}
            </div>
            <Button
              type="submit"
              disabled={isSaving || !hasChanges}
              size="lg"
              className="min-w-32 transition-all duration-200"
            >
              {isSaving ? (
                <>
                  <Loader2
                    className="mr-2 size-4 animate-spin"
                    aria-hidden="true"
                  />
                  Сохранение…
                </>
              ) : (
                <>
                  <Save className="mr-2 size-4" aria-hidden="true" />
                  Сохранить настройки
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
