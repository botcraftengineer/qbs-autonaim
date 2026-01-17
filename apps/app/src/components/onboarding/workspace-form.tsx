import { APP_CONFIG } from "@qbs-autonaim/config";
import {
  Button,
  Input,
  Label,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@qbs-autonaim/ui";
import { Briefcase, HelpCircle } from "lucide-react";

interface WorkspaceFormProps {
  organizationSlug: string;
  name: string;
  slug: string;
  description: string;
  isPending: boolean;
  onNameChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSkip: () => void;
}

export function WorkspaceForm({
  organizationSlug,
  name,
  slug,
  description,
  isPending,
  onNameChange,
  onSlugChange,
  onDescriptionChange,
  onSubmit,
  onSkip,
}: WorkspaceFormProps) {
  const appDomain = new URL(APP_CONFIG.url).host;

  return (
    <>
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-sm">
          <Briefcase className="size-8 text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold">Создайте воркспейс</h1>
        <p className="text-muted-foreground mt-2">
          Настройте общее пространство для управления проектами с вашей
          командой.{" "}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="cursor-help border-b border-dotted border-current"
                >
                  Узнать больше
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>
                  <strong>Что такое рабочее пространство?</strong>
                  <br />
                  Воркспейс — это изолированная среда внутри организации для
                  работы над конкретным проектом или направлением. В каждом
                  воркспейсе могут быть свои участники, настройки и данные.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-xl border bg-card p-8 shadow-lg backdrop-blur-sm"
      >
        <div className="space-y-2">
          <Label htmlFor="workspace-name">Название воркспейса</Label>
          <Input
            id="workspace-name"
            name="workspace-name"
            placeholder="Основной проект"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            required
            maxLength={100}
            autoFocus
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="workspace-slug">Slug воркспейса</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground inline-flex"
                    aria-label="Информация о slug"
                  >
                    <HelpCircle className="size-4" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Slug — это уникальный идентификатор для URL. Например, для
                    воркспейса "Основной проект" slug может быть
                    "osnovnoy-proekt". Используется только латиница, цифры и
                    дефисы.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-stretch overflow-hidden rounded-md border">
            <div className="bg-muted text-muted-foreground flex items-center px-3 text-sm">
              {appDomain}/orgs/{organizationSlug}/workspaces/
            </div>
            <Input
              id="workspace-slug"
              name="workspace-slug"
              placeholder="acme"
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
              required
              maxLength={50}
              pattern="[a-z0-9-]+"
              title="Только строчные буквы, цифры и дефис"
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Вы сможете изменить это позже в настройках воркспейса.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="workspace-description">Описание (опционально)</Label>
          <Textarea
            id="workspace-description"
            name="workspace-description"
            placeholder="Краткое описание воркспейса…"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={3}
            maxLength={500}
            className="resize-none"
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onSkip}
            disabled={isPending}
          >
            Пропустить
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isPending || !name || !slug}
          >
            {isPending ? "Создание…" : "Создать воркспейс"}
          </Button>
        </div>
      </form>
    </>
  );
}
