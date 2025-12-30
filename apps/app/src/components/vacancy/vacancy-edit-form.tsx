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
  Textarea,
} from "@qbs-autonaim/ui";
import {
  type UpdateVacancyDetailsInput,
  updateVacancyDetailsSchema,
} from "@qbs-autonaim/validators";
import { Loader2, Save } from "lucide-react";
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
        <Card className="p-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название вакансии</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Например, Senior Frontend Developer…"
                      maxLength={500}
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormDescription>
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
                  <FormLabel>Описание вакансии</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Опишите вакансию, требования, обязанности и условия работы…"
                      className="min-h-[300px] resize-y"
                      maxLength={50000}
                    />
                  </FormControl>
                  <FormDescription>
                    Полное описание вакансии, включая требования, обязанности и
                    условия
                  </FormDescription>
                  <FormMessage />
                  <div className="text-muted-foreground text-xs">
                    {field.value?.length ?? 0} / 50000
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
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
              className="min-h-[44px] md:min-h-0"
            >
              Отмена
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSaving || !hasChanges}
            className="min-w-[120px] min-h-[44px] md:min-h-0"
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
