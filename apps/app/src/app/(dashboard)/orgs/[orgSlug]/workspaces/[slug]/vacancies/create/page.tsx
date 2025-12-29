"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { paths } from "@qbs-autonaim/config";
import {
  Button,
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
  Textarea,
} from "@qbs-autonaim/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { SiteHeader } from "~/components/layout";
import { useWorkspace } from "~/hooks/use-workspace";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";
import { useTRPC } from "~/trpc/react";

const createVacancySchema = z.object({
  title: z
    .string()
    .min(1, "Название обязательно")
    .max(500, "Максимум 500 символов"),
  description: z.string().optional(),
  requirements: z.string().optional(),
  platformSource: z.enum(
    ["kwork", "fl", "weblancer", "upwork", "freelancer", "fiverr"],
    "Выберите платформу",
  ),
  platformUrl: z
    .string()
    .url("Введите корректный URL")
    .optional()
    .or(z.literal("")),
});

type CreateVacancyFormValues = z.infer<typeof createVacancySchema>;

const platformLabels: Record<string, string> = {
  kwork: "Kwork",
  fl: "FL.ru",
  weblancer: "Weblancer",
  upwork: "Upwork",
  freelancer: "Freelancer",
  fiverr: "Fiverr",
};

export default function CreateVacancyPage() {
  const router = useRouter();
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();
  const { workspace } = useWorkspace();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<CreateVacancyFormValues>({
    resolver: zodResolver(createVacancySchema),
    defaultValues: {
      title: "",
      description: "",
      requirements: "",
      platformSource: undefined,
      platformUrl: "",
    },
  });

  const createMutation = useMutation(
    trpc.freelancePlatforms.createVacancy.mutationOptions({
      onSuccess: async (data) => {
        toast.success("Вакансия создана", {
          description: `Вакансия "${data.vacancy.title}" успешно создана`,
        });

        // Инвалидируем кеш вакансий
        await queryClient.invalidateQueries(
          trpc.freelancePlatforms.getVacancies.pathFilter(),
        );

        // Перенаправляем на страницу деталей вакансии
        router.push(
          paths.workspace.vacancies(
            orgSlug ?? "",
            workspaceSlug ?? "",
            data.vacancy.id,
          ),
        );
      },
      onError: (error) => {
        toast.error("Ошибка при создании вакансии", {
          description: error.message,
        });
      },
    }),
  );

  const handleSubmit = async (values: CreateVacancyFormValues) => {
    if (!workspace?.id) {
      toast.error("Workspace не найден");
      return;
    }

    createMutation.mutate({
      workspaceId: workspace.id,
      title: values.title,
      description: values.description || undefined,
      requirements: values.requirements || undefined,
      platformSource: values.platformSource,
      platformUrl: values.platformUrl || undefined,
    });
  };

  return (
    <>
      <SiteHeader title="Создать вакансию" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="mb-6">
                <Button variant="ghost" size="sm" asChild className="mb-4">
                  <Link
                    href={paths.workspace.vacancies(
                      orgSlug ?? "",
                      workspaceSlug ?? "",
                    )}
                    aria-label="Вернуться к списку вакансий"
                  >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Назад к вакансиям
                  </Link>
                </Button>

                <div className="flex items-center gap-3 mb-2">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles
                      className="size-5 text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold">Создать вакансию</h1>
                    <p className="text-muted-foreground text-sm">
                      Создайте вакансию для фриланс-платформы
                    </p>
                  </div>
                </div>
              </div>

              <div className="max-w-2xl">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Название вакансии</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Например: Разработчик React"
                              autoFocus
                              {...field}
                              aria-label="Название вакансии"
                            />
                          </FormControl>
                          <FormDescription>
                            Краткое и понятное название вакансии
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
                          <FormLabel>Описание</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Опишите задачу или проект…"
                              className="resize-none min-h-[120px]"
                              {...field}
                              aria-label="Описание вакансии"
                            />
                          </FormControl>
                          <FormDescription>
                            Подробное описание задачи или проекта (опционально)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Требования</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Укажите требования к кандидату…"
                              className="resize-none min-h-[120px]"
                              {...field}
                              aria-label="Требования к кандидату"
                            />
                          </FormControl>
                          <FormDescription>
                            Навыки, опыт и квалификация (опционально)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="platformSource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Платформа</FormLabel>
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
                              {Object.entries(platformLabels).map(
                                ([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Фриланс-платформа, на которой размещена вакансия
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="platformUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL вакансии на платформе</FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://kwork.ru/projects/12345"
                              {...field}
                              aria-label="URL вакансии на платформе"
                            />
                          </FormControl>
                          <FormDescription>
                            Ссылка на вакансию на фриланс-платформе
                            (опционально)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.back()}
                        disabled={createMutation.isPending}
                        aria-label="Отменить создание вакансии"
                      >
                        Отмена
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={createMutation.isPending}
                        aria-label="Создать вакансию"
                      >
                        {createMutation.isPending
                          ? "Создание…"
                          : "Создать вакансию"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
