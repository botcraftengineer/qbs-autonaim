"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { APP_CONFIG, paths } from "@qbs-autonaim/config";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@qbs-autonaim/ui";
import { createWorkspaceSchema } from "@qbs-autonaim/validators";
import slugify from "@sindresorhus/slugify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { useTRPC } from "~/trpc/react";

type CreateWorkspaceFormValues = z.infer<typeof createWorkspaceSchema>;

interface CreateWorkspaceDialogProps {
  organizationId: string;
  organizationSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceDialog({
  organizationId,
  organizationSlug,
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Извлекаем домен из URL
  const appDomain = APP_CONFIG.url.replace(/^https?:\/\//, "");

  const form = useForm<CreateWorkspaceFormValues>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      website: "",
    },
  });

  const createMutation = useMutation(
    trpc.organization.createWorkspace.mutationOptions({
      onSuccess: async (workspace) => {
        toast.success("Воркспейс создан", {
          description: `Воркспейс "${workspace.name}" успешно создан`,
        });

        // Инвалидируем кеш воркспейсов и организаций
        await queryClient.invalidateQueries(trpc.workspace.list.pathFilter());
        await queryClient.invalidateQueries(
          trpc.organization.list.pathFilter(),
        );

        onOpenChange(false);
        form.reset();
        // Перенаправляем на страницу нового воркспейса
        router.push(
          paths.workspace.root(organizationSlug, workspace?.slug ?? ""),
        );
        router.refresh();
      },
      onError: (error) => {
        // Проверяем на дубликат slug
        if (
          error.message.includes("уже существует") ||
          error.message.includes("already exists") ||
          error.message.includes("duplicate") ||
          error.message.includes("CONFLICT")
        ) {
          form.setError("slug", {
            message: "Воркспейс с таким slug уже существует в этой организации",
          });
        } else {
          toast.error("Ошибка при создании воркспейса", {
            description: error.message,
          });
        }
      },
    }),
  );

  const handleSubmit = async (values: CreateWorkspaceFormValues) => {
    createMutation.mutate({
      organizationId,
      workspace: values,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      form.reset();
    }
  };

  // Автоматическая генерация slug из названия
  const handleNameChange = (name: string) => {
    form.setValue("name", name);
    if (!form.formState.dirtyFields.slug) {
      const slug = slugify(name);
      form.setValue("slug", slug);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="size-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Создать воркспейс</DialogTitle>
          <DialogDescription>
            Создайте новое рабочее пространство для вашей команды
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название воркспейса</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Моя компания"
                      {...field}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-1.5">
                    <FormLabel>Slug воркспейса</FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="text-muted-foreground size-4 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>
                            Slug — это уникальный идентификатор для URL.
                            Например, для воркспейса "Основной проект" slug
                            может быть "osnovnoy-proekt". Используется только
                            латиница, цифры и дефисы.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <FormControl>
                    <div className="flex items-stretch overflow-hidden rounded-md border">
                      <div className="bg-muted text-muted-foreground flex items-center px-3 text-sm">
                        {appDomain}/orgs/{organizationSlug}/workspaces/
                      </div>
                      <Input
                        placeholder="acme"
                        {...field}
                        onChange={(e) => {
                          form.setValue("slug", e.target.value, {
                            shouldDirty: true,
                          });
                        }}
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Вы сможете изменить это позже в настройках воркспейса.
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
                  <FormLabel>Описание (опционально)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Краткое описание воркспейса..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Веб-сайт (опционально)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleOpenChange(false)}
                disabled={createMutation.isPending}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Создание…" : "Создать воркспейс"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
