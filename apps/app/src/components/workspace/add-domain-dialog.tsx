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
  toast,
} from "@qbs-autonaim/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTRPC } from "~/trpc/react";

const formSchema = z.object({
  domain: z
    .string()
    .min(3, "Домен должен содержать минимум 3 символа")
    .max(255, "Домен слишком длинный")
    .regex(
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/,
      "Некорректный формат домена",
    )
    .transform((val) => val.toLowerCase().trim()),
  type: z.enum(["interview", "prequalification"]),
});

type FormValues = z.infer<typeof formSchema>;

interface AddDomainDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: "interview" | "prequalification";
}

export function AddDomainDialog({
  workspaceId,
  open,
  onOpenChange,
  defaultType = "interview",
}: AddDomainDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domain: "",
      type: defaultType,
    },
  });

  const createMutation = useMutation(
    trpc.customDomain.create.mutationOptions({
      onSuccess: () => {
        toast.success("Домен добавлен", {
          description: "Теперь настройте DNS записи для верификации",
        });
        queryClient.invalidateQueries({
          queryKey: trpc.customDomain.list.queryKey({ workspaceId }),
        });
        form.reset({ domain: "", type: defaultType });
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error("Ошибка", {
          description: error.message,
        });
      },
    }),
  );

  const onSubmit = (values: FormValues) => {
    createMutation.mutate({
      workspaceId,
      domain: values.domain,
      type: values.type,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Добавить домен</DialogTitle>
          <DialogDescription>
            Добавьте свой домен для использования в ссылках
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип домена</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип домена" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="interview">Интервью</SelectItem>
                      <SelectItem value="prequalification">
                        Предквалификация
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Для чего будет использоваться домен
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ваш домен</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="go.example.com"
                      autoComplete="off"
                      spellCheck={false}
                      className="font-mono text-base"
                      style={{ fontSize: "16px" }}
                    />
                  </FormControl>
                  <FormDescription>
                    Введите домен без протокола (https://)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Добавить домен
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
