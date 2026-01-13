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
  Separator,
  Textarea,
} from "@qbs-autonaim/ui";
import {
  type UpdateVacancyDetailsInput,
  updateVacancyDetailsSchema,
} from "@qbs-autonaim/validators";
import { FileText, Loader2, Save, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface VacancyEditFormProps {
  initialData: {
    title: string;
    description?: string | null;
  };
  onSave: (data: UpdateVacancyDetailsInput) => Promise<void>;
  onCancel?: () => void;
}

export function VacancyEditForm({
  initialData,
  onSave,
  onCancel,
}: VacancyEditFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const form = useForm<UpdateVacancyDetailsInput>({
    resolver: zodResolver(updateVacancyDetailsSchema),
    defaultValues: {
      title: initialData.title,
      description: initialData.description ?? "",
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

  const handleSubmit = async (data: UpdateVacancyDetailsInput) => {
    setIsSaving(true);
    try {
      await onSave(data);
      toast.success("Вакансия сохранена");
      form.reset(data);
      setHasChanges(false);
    } catch (error) {
      toast.error("Ошибка при сохранении вакансии");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="max-w-4xl">
          <Card className="p-6">
            <div className="mb-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-linear-to-br from-primary/20 to-primary/10 p-3">
                  <Sparkles
                    className="size-6 text-primary"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Детали вакансии
                  </h2>
                  <p className="text-muted-foreground">
                    Заполните основную информацию о вакансии
                  </p>
                </div>
              </div>
              <Separator className="mb-4" />
            </div>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Название вакансии
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Например, Senior Frontend Developer…"
                        maxLength={500}
                        autoComplete="off"
                        className="text-sm"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Краткое и понятное название позиции
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Описание вакансии
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Опишите вакансию, требования, обязанности и условия работы…"
                          className="min-h-75 resize-y font-mono text-sm pr-12 leading-relaxed"
                          maxLength={50000}
                        />
                        <div className="absolute right-3 top-3 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                          <FileText className="inline size-3 mr-1" />
                          Описание
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Полное описание вакансии, включая требования, обязанности
                      и условия работы
                    </FormDescription>
                    <FormMessage />
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-muted-foreground text-xs">
                        {field.value?.length ?? 0} / 50000 символов
                      </div>
                      {hasChanges && field.value && (
                        <span className="text-muted-foreground text-xs flex items-center gap-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                          Изменено
                        </span>
                      )}
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </Card>

          {/* Статус и кнопка сохранения */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border bg-card p-4">
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
            <div className="flex items-center gap-3">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSaving}
                  className="min-h-11 md:min-h-0"
                >
                  Отмена
                </Button>
              )}
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
                    Сохранить изменения
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
