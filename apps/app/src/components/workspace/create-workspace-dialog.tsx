"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { env as baseEnv } from "@qbs-autonaim/config";
import { paths } from "@qbs-autonaim/config";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@qbs-autonaim/ui";
import { useMutation } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTRPC } from "~/trpc/react";

const workspaceSchema = z.object({
  name: z
    .string()
    .min(1, "Название обязательно")
    .max(100, "Название не должно превышать 100 символов"),
  slug: z
    .string()
    .min(1, "Slug обязателен")
    .max(50, "Slug не должен превышать 50 символов")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug может содержать только строчные буквы, цифры и дефисы",
    ),
  description: z.string().max(500).optional(),
});

type WorkspaceFormValues = z.infer<typeof workspaceSchema>;

interface CreateWorkspaceDialogProps {
  trigger?: React.ReactNode;
}

export function CreateWorkspaceDialog({ trigger }: CreateWorkspaceDialogProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const trpc = useTRPC();

  const form = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
  });

  const createMutation = useMutation(
    trpc.workspace.create.mutationOptions({
      onSuccess: (workspace) => {
        setOpen(false);
        form.reset();
        router.push(paths.workspace.root(workspace.slug));
        router.refresh();
      },
      onError: (error) => {
        form.setError("slug", {
          message: error.message || "Ошибка при создании рабочего пространства",
        });
      },
    }),
  );

  const handleNameChange = (value: string) => {
    form.setValue("name", value);

    // Автоматическая генерация slug из названия
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 50);

    if (!form.formState.dirtyFields.slug) {
      form.setValue("slug", slug);
    }
  };

  const handleSubmit = async (values: WorkspaceFormValues) => {
    createMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Создать рабочее пространство</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="size-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl">
            Создать рабочее пространство
          </DialogTitle>
          <DialogDescription>
            Настройте общее пространство для управления вакансиями с вашей
            командой.
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
                  <FormLabel>Название рабочего пространства</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Acme, Inc."
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
                  <FormLabel>Адрес пространства</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">
                        {new URL(baseEnv.NEXT_PUBLIC_APP_URL).host}/
                      </span>
                      <Input placeholder="acme" {...field} className="flex-1" />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Вы можете изменить это позже в настройках
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
                    <Input placeholder="Краткое описание" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending
                ? "Создание..."
                : "Создать рабочее пространство"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
