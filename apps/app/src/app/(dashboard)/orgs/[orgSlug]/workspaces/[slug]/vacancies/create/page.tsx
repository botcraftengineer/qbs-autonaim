"use client";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@qbs-autonaim/ui";
import { IconArrowLeft, IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "~/components/layout";
import { useWorkspace } from "~/hooks/use-workspace";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";
import { useTRPC } from "~/trpc/react";

export default function CreateVacancyPage() {
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();
  const { workspace } = useWorkspace();
  const router = useRouter();
  const trpc = useTRPC();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [platformSource, setPlatformSource] = useState<string>("");
  const [platformUrl, setPlatformUrl] = useState("");

  const createMutation = trpc.freelancePlatforms.createVacancy.useMutation({
    onSuccess: (data: { vacancy: { id: string } }) => {
      toast.success("Вакансия создана");
      router.push(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${data.vacancy.id}`,
      );
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Ошибка при создании вакансии");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!workspace?.id) {
      toast.error("Workspace не найден");
      return;
    }

    if (!title.trim()) {
      toast.error("Укажите название вакансии");
      return;
    }

    if (!platformSource) {
      toast.error("Выберите платформу");
      return;
    }

    await createMutation.mutateAsync({
      workspaceId: workspace.id,
      title: title.trim(),
      description: description.trim() || undefined,
      requirements: requirements.trim() || undefined,
      platformSource: platformSource as
        | "kwork"
        | "fl"
        | "weblancer"
        | "upwork"
        | "freelancer"
        | "fiverr",
      platformUrl: platformUrl.trim() || undefined,
    });
  };

  return (
    <>
      <SiteHeader title="Создать вакансию" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
            <div className="mb-4">
              <Button variant="ghost" size="sm" asChild>
                <Link
                  href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies`}
                >
                  <IconArrowLeft className="size-4" aria-hidden="true" />
                  Назад к списку
                </Link>
              </Button>
            </div>

            <Card className="max-w-3xl">
              <CardHeader>
                <CardTitle>Новая вакансия для фриланс-платформы</CardTitle>
                <CardDescription>
                  Создайте вакансию для размещения на фриланс-платформе. После
                  создания вы получите ссылку на AI-интервью для добавления в
                  описание задания.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Название вакансии
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Например: Frontend разработчик на React"
                      maxLength={500}
                      required
                      aria-required="true"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="platformSource">
                      Платформа
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    <Select
                      value={platformSource}
                      onValueChange={setPlatformSource}
                      required
                    >
                      <SelectTrigger id="platformSource" aria-required="true">
                        <SelectValue placeholder="Выберите платформу" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kwork">Kwork</SelectItem>
                        <SelectItem value="fl">FL.ru</SelectItem>
                        <SelectItem value="weblancer">Weblancer</SelectItem>
                        <SelectItem value="upwork">Upwork</SelectItem>
                        <SelectItem value="freelancer">Freelancer</SelectItem>
                        <SelectItem value="fiverr">Fiverr</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="platformUrl">
                      URL вакансии на платформе (опционально)
                    </Label>
                    <Input
                      id="platformUrl"
                      type="url"
                      value={platformUrl}
                      onChange={(e) => setPlatformUrl(e.target.value)}
                      placeholder="https://kwork.ru/projects/..."
                    />
                    <p className="text-sm text-muted-foreground">
                      Если вы уже опубликовали вакансию, укажите ссылку на неё
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Описание</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Опишите задачу, проект или вакансию…"
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requirements">Требования</Label>
                    <Textarea
                      id="requirements"
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      placeholder="Укажите необходимые навыки, опыт, квалификацию…"
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="min-w-[120px]"
                    >
                      {createMutation.isPending ? (
                        <>Создание…</>
                      ) : (
                        <>
                          <IconPlus className="size-4" aria-hidden="true" />
                          Создать
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      asChild
                      disabled={createMutation.isPending}
                    >
                      <Link
                        href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies`}
                      >
                        Отмена
                      </Link>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
