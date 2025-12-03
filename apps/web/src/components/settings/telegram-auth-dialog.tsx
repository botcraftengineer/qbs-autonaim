"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@selectio/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useTRPC } from "~/trpc/react";

interface TelegramAuthDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
}

const step1Schema = z.object({
  apiId: z.string().min(1, "API ID обязателен"),
  apiHash: z.string().min(1, "API Hash обязателен"),
  phone: z.string().min(1, "Номер телефона обязателен"),
});

const step2Schema = z.object({
  phoneCode: z.string().min(1, "Код обязателен"),
});

const step3Schema = z.object({
  password: z.string().min(1, "Пароль обязателен"),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;
type Step3Values = z.infer<typeof step3Schema>;

export function TelegramAuthDialog({
  open,
  onClose,
  workspaceId,
}: TelegramAuthDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phoneCodeHash, setPhoneCodeHash] = useState("");
  const [apiData, setApiData] = useState<{
    apiId: number;
    apiHash: string;
    phone: string;
  } | null>(null);
  const [sessionData, setSessionData] = useState<Record<string, string>>({});

  const form1 = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      apiId: "",
      apiHash: "",
      phone: "",
    },
  });

  const form2 = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      phoneCode: "",
    },
  });

  const form3 = useForm<Step3Values>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      password: "",
    },
  });

  const sendCodeMutation = useMutation(
    trpc.telegram.sendCode.mutationOptions({
      onSuccess: (data) => {
        setPhoneCodeHash(data.phoneCodeHash);
        setStep(2);
        toast.success("Код отправлен на ваш телефон");
      },
      onError: (err) => {
        toast.error(err.message || "Не удалось отправить код");
      },
    }),
  );

  const signInMutation = useMutation(
    trpc.telegram.signIn.mutationOptions({
      onSuccess: (data) => {
        if (data.success) {
          toast.success("Успешная авторизация!");
          queryClient.invalidateQueries({
            queryKey: trpc.telegram.getSessions.queryKey({ workspaceId }),
          });
          handleClose();
        }
      },
      onError: (err) => {
        if (err.message === "SESSION_PASSWORD_NEEDED") {
          setStep(3);
          toast.info("Требуется пароль 2FA");
        } else {
          toast.error(err.message || "Ошибка авторизации");
        }
      },
    }),
  );

  const checkPasswordMutation = useMutation(
    trpc.telegram.checkPassword.mutationOptions({
      onSuccess: () => {
        toast.success("Успешная авторизация!");
        queryClient.invalidateQueries({
          queryKey: trpc.telegram.getSessions.queryKey({ workspaceId }),
        });
        handleClose();
      },
      onError: (err) => {
        toast.error(err.message || "Неверный пароль");
      },
    }),
  );

  const handleClose = () => {
    form1.reset();
    form2.reset();
    form3.reset();
    setStep(1);
    setPhoneCodeHash("");
    setApiData(null);
    setSessionData({});
    onClose();
  };

  const onStep1Submit = (data: Step1Values) => {
    const apiId = Number.parseInt(data.apiId, 10);
    if (Number.isNaN(apiId)) {
      toast.error("API ID должен быть числом");
      return;
    }

    setApiData({
      apiId,
      apiHash: data.apiHash,
      phone: data.phone,
    });

    sendCodeMutation.mutate({
      apiId,
      apiHash: data.apiHash,
      phone: data.phone,
    });
  };

  const onStep2Submit = (data: Step2Values) => {
    if (!apiData) return;

    signInMutation.mutate({
      workspaceId,
      ...apiData,
      phoneCode: data.phoneCode,
      phoneCodeHash,
    });
  };

  const onStep3Submit = (data: Step3Values) => {
    if (!apiData) return;

    checkPasswordMutation.mutate({
      workspaceId,
      ...apiData,
      password: data.password,
      sessionData,
    });
  };

  return (
    <Sheet open={open} onOpenChange={(open: boolean) => !open && handleClose()}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader className="space-y-3">
          <SheetTitle>Подключить Telegram</SheetTitle>
          <SheetDescription>
            {step === 1 && "Введите данные вашего Telegram приложения"}
            {step === 2 && "Введите код из SMS"}
            {step === 3 && "Введите пароль 2FA"}
          </SheetDescription>
        </SheetHeader>

        {step === 1 && (
          <Form {...form1}>
            <form
              onSubmit={form1.handleSubmit(onStep1Submit)}
              className="flex flex-col h-full gap-6 mt-6"
            >
              <div className="space-y-5 flex-1 overflow-y-auto px-6">
                <div className="text-sm text-muted-foreground space-y-2 mb-4">
                  <p>
                    Для подключения Telegram нужно создать приложение на{" "}
                    <a
                      href="https://my.telegram.org/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      my.telegram.org/apps
                    </a>
                  </p>
                </div>

                <FormField
                  control={form1.control}
                  name="apiId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API ID</FormLabel>
                      <Input placeholder="123456" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form1.control}
                  name="apiHash"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Hash</FormLabel>
                      <Input
                        placeholder="0123456789abcdef0123456789abcdef"
                        {...field}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form1.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Номер телефона</FormLabel>
                      <Input placeholder="+79991234567" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <SheetFooter className="gap-3 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 sm:flex-none"
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={sendCodeMutation.isPending}
                  className="flex-1 sm:flex-none"
                >
                  {sendCodeMutation.isPending ? "Отправка..." : "Отправить код"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        )}

        {step === 2 && (
          <Form {...form2}>
            <form
              onSubmit={form2.handleSubmit(onStep2Submit)}
              className="flex flex-col h-full gap-6 mt-6"
            >
              <div className="space-y-5 flex-1 px-6">
                <FormField
                  control={form2.control}
                  name="phoneCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Код из SMS</FormLabel>
                      <Input placeholder="12345" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <SheetFooter className="gap-3 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 sm:flex-none"
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={signInMutation.isPending}
                  className="flex-1 sm:flex-none"
                >
                  {signInMutation.isPending ? "Проверка..." : "Войти"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        )}

        {step === 3 && (
          <Form {...form3}>
            <form
              onSubmit={form3.handleSubmit(onStep3Submit)}
              className="flex flex-col h-full gap-6 mt-6"
            >
              <div className="space-y-5 flex-1 px-6">
                <FormField
                  control={form3.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Пароль 2FA</FormLabel>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <SheetFooter className="gap-3 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 sm:flex-none"
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={checkPasswordMutation.isPending}
                  className="flex-1 sm:flex-none"
                >
                  {checkPasswordMutation.isPending ? "Проверка..." : "Войти"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}
