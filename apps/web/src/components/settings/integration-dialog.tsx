"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@selectio/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Eye, EyeOff, Mail } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AVAILABLE_INTEGRATIONS } from "~/lib/integrations";
import { useTRPC } from "~/trpc/react";

interface IntegrationDialogProps {
  open: boolean;
  onClose: () => void;
  editingType: string | null;
}

const integrationFormSchema = z.object({
  type: z.string(),
  name: z.string().optional(),
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Пароль обязателен"),
});

type IntegrationFormValues = z.infer<typeof integrationFormSchema>;

const INTEGRATION_TYPES = AVAILABLE_INTEGRATIONS.map((int) => ({
  value: int.type,
  label: int.name,
  fields: int.fields,
}));

export function IntegrationDialog({
  open,
  onClose,
  editingType,
}: IntegrationDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const [showPassword, setShowPassword] = useState(false);

  const { data: workspaceData } = useQuery(
    trpc.workspace.bySlug.queryOptions({ slug: workspaceSlug }),
  );

  const form = useForm<IntegrationFormValues>({
    resolver: zodResolver(integrationFormSchema),
    defaultValues: {
      type: editingType || "hh",
      name: "",
      email: "",
      password: "",
    },
  });

  const selectedType = INTEGRATION_TYPES.find(
    (t) => t.value === form.watch("type"),
  );

  useEffect(() => {
    if (editingType) {
      form.setValue("type", editingType);
    }
  }, [editingType, form]);

  const createMutation = useMutation(
    trpc.integration.create.mutationOptions({
      onSuccess: () => {
        toast.success("Интеграция успешно создана");
        queryClient.invalidateQueries({
          queryKey: trpc.integration.list.queryKey(),
        });
        handleClose();
      },
      onError: (err) => {
        toast.error(err.message || "Не удалось создать интеграцию");
      },
    }),
  );

  const handleClose = () => {
    form.reset();
    setShowPassword(false);
    onClose();
  };

  const onSubmit = (data: IntegrationFormValues) => {
    if (!workspaceData?.workspace?.id) {
      toast.error("Workspace не найден");
      return;
    }

    createMutation.mutate({
      workspaceId: workspaceData.workspace.id,
      type: data.type,
      name: data.name || selectedType?.label || "",
      credentials: {
        email: data.email,
        password: data.password,
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open: boolean) => !open && handleClose()}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            {editingType ? "Редактировать" : "Подключить"} интеграцию
          </DialogTitle>
          <DialogDescription className="text-base">
            Подключите внешний сервис для автоматизации работы с вакансиями и
            откликами
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 pt-2"
          >
            <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              <p>
                Для подключения HeadHunter используйте учетные данные вашего
                аккаунта работодателя
              </p>
            </div>

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Тип интеграции
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!!editingType}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INTEGRATION_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    Название (опционально)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={selectedType?.label}
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Используется для идентификации интеграции
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    Пароль
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="h-11 pr-10"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Пароль хранится в зашифрованном виде
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="h-11"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="h-11"
              >
                {createMutation.isPending ? "Подключение..." : "Подключить"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
