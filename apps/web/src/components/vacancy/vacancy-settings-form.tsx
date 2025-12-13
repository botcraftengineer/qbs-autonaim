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
  Separator,
  Textarea,
} from "@qbs-autonaim/ui";
import {
  type UpdateVacancySettingsInput,
  updateVacancySettingsSchema,
} from "@qbs-autonaim/validators";
import { Loader2, Save, Sparkles, Wand2 } from "lucide-react";
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
        <Card className="p-6">
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Sparkles className="size-5 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Настройки AI-бота</h2>
              <p className="text-muted-foreground text-sm">
                Настройте поведение бота для этой вакансии
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="customBotInstructions"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel>Общие инструкции для бота</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleImprove("customBotInstructions")}
                      disabled={
                        improvingField === "customBotInstructions" ||
                        !field.value?.trim()
                      }
                      className="h-8 gap-1.5 text-xs"
                      aria-label="Улучшить инструкции с помощью AI"
                    >
                      {improvingField === "customBotInstructions" ? (
                        <>
                          <Loader2
                            className="size-3.5 animate-spin"
                            aria-hidden="true"
                          />
                          Улучшение…
                        </>
                      ) : (
                        <>
                          <Wand2 className="size-3.5" aria-hidden="true" />
                          Улучшить
                        </>
                      )}
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Например: Обращай внимание на опыт работы с React и TypeScript. Важно уточнить готовность к релокации…"
                      className="min-h-[120px] resize-y font-mono text-sm"
                      maxLength={5000}
                    />
                  </FormControl>
                  <FormDescription>
                    Эти инструкции будут использоваться ботом при общении с
                    кандидатами. Укажите, на что обратить внимание, какие
                    вопросы задавать.
                  </FormDescription>
                  <FormMessage />
                  <div className="text-muted-foreground text-xs">
                    {field.value?.length ?? 0} / 5000
                  </div>
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name="customInterviewQuestions"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel>Вопросы для интервью</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleImprove("customInterviewQuestions")}
                      disabled={
                        improvingField === "customInterviewQuestions" ||
                        !field.value?.trim()
                      }
                      className="h-8 gap-1.5 text-xs"
                      aria-label="Улучшить вопросы с помощью AI"
                    >
                      {improvingField === "customInterviewQuestions" ? (
                        <>
                          <Loader2
                            className="size-3.5 animate-spin"
                            aria-hidden="true"
                          />
                          Улучшение…
                        </>
                      ) : (
                        <>
                          <Wand2 className="size-3.5" aria-hidden="true" />
                          Улучшить
                        </>
                      )}
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Например:&#10;1. Расскажите о вашем опыте с микросервисной архитектурой&#10;2. Какие проекты вы считаете наиболее успешными?&#10;3. Почему вас интересует эта позиция?…"
                      className="min-h-[160px] resize-y font-mono text-sm"
                      maxLength={5000}
                    />
                  </FormControl>
                  <FormDescription>
                    Список вопросов, которые бот будет задавать кандидатам во
                    время интервью в Telegram. Каждый вопрос с новой строки.
                  </FormDescription>
                  <FormMessage />
                  <div className="text-muted-foreground text-xs">
                    {field.value?.length ?? 0} / 5000
                  </div>
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name="customOrganizationalQuestions"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel>Организационные вопросы</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleImprove("customOrganizationalQuestions")
                      }
                      disabled={
                        improvingField === "customOrganizationalQuestions" ||
                        !field.value?.trim()
                      }
                      className="h-8 gap-1.5 text-xs"
                      aria-label="Улучшить вопросы с помощью AI"
                    >
                      {improvingField === "customOrganizationalQuestions" ? (
                        <>
                          <Loader2
                            className="size-3.5 animate-spin"
                            aria-hidden="true"
                          />
                          Улучшение…
                        </>
                      ) : (
                        <>
                          <Wand2 className="size-3.5" aria-hidden="true" />
                          Улучшить
                        </>
                      )}
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Например:&#10;1. Когда вы готовы приступить к работе?&#10;2. Какой формат работы вам подходит?&#10;3. Есть ли у вас другие офферы на рассмотрении?…"
                      className="min-h-[120px] resize-y font-mono text-sm"
                      maxLength={5000}
                    />
                  </FormControl>
                  <FormDescription>
                    Организационные вопросы, которые бот будет задавать после
                    основного интервью. Каждый вопрос с новой строки.
                  </FormDescription>
                  <FormMessage />
                  <div className="text-muted-foreground text-xs">
                    {field.value?.length ?? 0} / 5000
                  </div>
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name="customScreeningPrompt"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel>Инструкции для скрининга резюме</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleImprove("customScreeningPrompt")}
                      disabled={
                        improvingField === "customScreeningPrompt" ||
                        !field.value?.trim()
                      }
                      className="h-8 gap-1.5 text-xs"
                      aria-label="Улучшить инструкции с помощью AI"
                    >
                      {improvingField === "customScreeningPrompt" ? (
                        <>
                          <Loader2
                            className="size-3.5 animate-spin"
                            aria-hidden="true"
                          />
                          Улучшение…
                        </>
                      ) : (
                        <>
                          <Wand2 className="size-3.5" aria-hidden="true" />
                          Улучшить
                        </>
                      )}
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Например: При оценке резюме обрати особое внимание на коммерческий опыт с GraphQL и опыт работы в продуктовых компаниях…"
                      className="min-h-[120px] resize-y font-mono text-sm"
                      maxLength={5000}
                    />
                  </FormControl>
                  <FormDescription>
                    Дополнительные критерии для автоматической оценки резюме.
                    Укажите, какие навыки или опыт важнее всего.
                  </FormDescription>
                  <FormMessage />
                  <div className="text-muted-foreground text-xs">
                    {field.value?.length ?? 0} / 5000
                  </div>
                </FormItem>
              )}
            />
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          {hasChanges && (
            <p className="text-muted-foreground text-sm">
              Есть несохраненные изменения
            </p>
          )}
          <Button
            type="submit"
            disabled={isSaving || !hasChanges}
            className="min-w-[120px]"
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
                Сохранить
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
