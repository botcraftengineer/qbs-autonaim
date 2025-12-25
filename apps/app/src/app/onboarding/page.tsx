"use client";

import { APP_CONFIG, paths } from "@qbs-autonaim/config";
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
import slugify from "@sindresorhus/slugify";
import { useMutation } from "@tanstack/react-query";
import { Briefcase, Building2, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

type OnboardingStep = "organization" | "workspace";

export default function OnboardingPage() {
  const router = useRouter();
  const trpc = useTRPC();

  const [step, setStep] = useState<OnboardingStep>("organization");

  // Данные организации
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(true);

  // Созданная организация
  const [createdOrganization, setCreatedOrganization] = useState<{
    id: string;
    slug: string;
    name: string;
  } | null>(null);

  // Данные workspace
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [workspaceWebsite, setWorkspaceWebsite] = useState("");
  const [isGeneratingWorkspaceSlug, setIsGeneratingWorkspaceSlug] =
    useState(true);

  // Извлекаем домен из URL
  const appDomain = new URL(APP_CONFIG.url).host;

  const createOrganization = useMutation(
    trpc.organization.create.mutationOptions({
      onSuccess: (organization) => {
        toast.success("Организация создана", {
          description: `Организация "${organization.name}" успешно создана`,
        });
        setCreatedOrganization({
          id: organization.id,
          slug: organization.slug,
          name: organization.name,
        });
        setStep("workspace");
      },
      onError: (error) => {
        if (
          error.message.includes("уже существует") ||
          error.message.includes("already exists") ||
          error.message.includes("duplicate") ||
          error.message.includes("CONFLICT")
        ) {
          toast.error("Организация с таким slug уже существует", {
            description: "Попробуйте другой slug",
          });
        } else {
          toast.error("Ошибка при создании организации", {
            description: error.message,
          });
        }
      },
    }),
  );

  const createWorkspace = useMutation(
    trpc.organization.createWorkspace.mutationOptions({
      onSuccess: (workspace) => {
        toast.success("Воркспейс создан", {
          description: `Воркспейс "${workspace.name}" успешно создан`,
        });
        if (createdOrganization && workspace.slug) {
          router.push(
            paths.workspace.root(createdOrganization.slug, workspace.slug),
          );
          router.refresh();
        }
      },
      onError: (error) => {
        if (
          error.message.includes("уже существует") ||
          error.message.includes("already exists") ||
          error.message.includes("duplicate") ||
          error.message.includes("CONFLICT")
        ) {
          toast.error("Воркспейс с таким slug уже существует", {
            description: "Попробуйте другой slug",
          });
        } else {
          toast.error("Ошибка при создании воркспейса", {
            description: error.message,
          });
        }
      },
    }),
  );

  const handleNameChange = (value: string) => {
    setName(value);
    if (isGeneratingSlug) {
      const generatedSlug = slugify(value);
      setSlug(generatedSlug);
    }
  };

  const handleSlugChange = (value: string) => {
    setIsGeneratingSlug(false);
    setSlug(value);
  };

  const handleOrganizationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrganization.mutate({
      name,
      slug,
      description: description || undefined,
      website: website || undefined,
    });
  };

  const handleWorkspaceNameChange = (value: string) => {
    setWorkspaceName(value);
    if (isGeneratingWorkspaceSlug) {
      const generatedSlug = slugify(value);
      setWorkspaceSlug(generatedSlug);
    }
  };

  const handleWorkspaceSlugChange = (value: string) => {
    setIsGeneratingWorkspaceSlug(false);
    setWorkspaceSlug(value);
  };

  const handleWorkspaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdOrganization) return;

    createWorkspace.mutate({
      organizationId: createdOrganization.id,
      workspace: {
        name: workspaceName,
        slug: workspaceSlug,
        description: workspaceDescription || undefined,
        website: workspaceWebsite || undefined,
      },
    });
  };

  const handleSkipWorkspace = () => {
    if (!createdOrganization) return;
    router.push(paths.organization.workspaces(createdOrganization.slug));
    router.refresh();
  };

  return (
    <div className="relative flex min-h-screen items-start justify-center p-4 pt-20">
      {/* Background gradient */}
      <div className="absolute inset-0 isolate overflow-hidden bg-white">
        <div className="absolute inset-y-0 left-1/2 w-[1200px] -translate-x-1/2 mask-intersect mask-[linear-gradient(black,transparent_320px),linear-gradient(90deg,transparent,black_5%,black_95%,transparent)]">
          <svg
            className="pointer-events-none absolute inset-0 text-neutral-200"
            width="100%"
            height="100%"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="grid-pattern"
                x="-0.25"
                y="-1"
                width="60"
                height="60"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 60 0 L 0 0 0 60"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect fill="url(#grid-pattern)" width="100%" height="100%" />
          </svg>
        </div>
        <div className="absolute left-1/2 top-6 size-[80px] -translate-x-1/2 -translate-y-1/2 scale-x-[1.6] mix-blend-overlay">
          <div className="absolute -inset-16 mix-blend-overlay blur-[50px] saturate-[2] bg-[conic-gradient(from_90deg,#F00_5deg,#EAB308_63deg,#5CFF80_115deg,#1E00FF_170deg,#855AFC_220deg,#3A8BFD_286deg,#F00_360deg)]" />
          <div className="absolute -inset-16 mix-blend-overlay blur-[50px] saturate-[2] bg-[conic-gradient(from_90deg,#F00_5deg,#EAB308_63deg,#5CFF80_115deg,#1E00FF_170deg,#855AFC_220deg,#3A8BFD_286deg,#F00_360deg)]" />
        </div>
        <div className="absolute left-1/2 top-6 size-[80px] -translate-x-1/2 -translate-y-1/2 scale-x-[1.6] opacity-10">
          <div className="absolute -inset-16 mix-blend-overlay blur-[50px] saturate-[2] bg-[conic-gradient(from_90deg,#F00_5deg,#EAB308_63deg,#5CFF80_115deg,#1E00FF_170deg,#855AFC_220deg,#3A8BFD_286deg,#F00_360deg)]" />
        </div>
      </div>

      <div className="relative w-full max-w-md space-y-8">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2">
          <div
            className={`h-2 w-16 rounded-full transition-colors ${
              step === "organization" ? "bg-primary" : "bg-primary/30"
            }`}
          />
          <div
            className={`h-2 w-16 rounded-full transition-colors ${
              step === "workspace" ? "bg-primary" : "bg-muted"
            }`}
          />
        </div>

        {step === "organization" ? (
          <>
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-sm">
                <Building2 className="size-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">Создайте организацию</h1>
              <p className="text-muted-foreground mt-2">
                Настройте организацию для управления командами и рабочими
                пространствами
              </p>
            </div>

            <form
              onSubmit={handleOrganizationSubmit}
              className="space-y-6 rounded-xl border bg-card p-8 shadow-lg backdrop-blur-sm"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Название организации</Label>
                <Input
                  id="name"
                  placeholder="Моя компания"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  maxLength={100}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="slug">Slug организации</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="text-muted-foreground size-4 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          Slug — это уникальный идентификатор для URL. Например,
                          для организации "Моя Компания" slug может быть
                          "moya-kompaniya". Используется только латиница, цифры
                          и дефисы.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-stretch overflow-hidden rounded-md border">
                  <div className="bg-muted text-muted-foreground flex items-center px-3 text-sm">
                    {appDomain}/orgs/
                  </div>
                  <Input
                    id="slug"
                    placeholder="acme"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    required
                    maxLength={50}
                    pattern="[a-z0-9-]+"
                    title="Только строчные буквы, цифры и дефис"
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  Вы сможете изменить это позже в настройках организации.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание (опционально)</Label>
                <Textarea
                  id="description"
                  placeholder="Краткое описание организации…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Веб-сайт (опционально)</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  maxLength={200}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createOrganization.isPending || !name || !slug}
              >
                {createOrganization.isPending
                  ? "Создание…"
                  : "Создать организацию"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-sm">
                <Briefcase className="size-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">Создайте воркспейс</h1>
              <p className="text-muted-foreground mt-2">
                Настройте общее пространство для управления проектами с вашей
                командой.{" "}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help border-b border-dotted border-current">
                        Узнать больше
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>
                        <strong>Что такое рабочее пространство?</strong>
                        <br />
                        Воркспейс — это изолированная среда внутри организации
                        для работы над конкретным проектом или направлением. В
                        каждом воркспейсе могут быть свои участники, настройки и
                        данные.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </p>
            </div>

            <form
              onSubmit={handleWorkspaceSubmit}
              className="space-y-6 rounded-xl border bg-card p-8 shadow-lg backdrop-blur-sm"
            >
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Название воркспейса</Label>
                <Input
                  id="workspace-name"
                  placeholder="Основной проект"
                  value={workspaceName}
                  onChange={(e) => handleWorkspaceNameChange(e.target.value)}
                  required
                  maxLength={100}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="workspace-slug">Slug воркспейса</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="text-muted-foreground size-4 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          Slug — это уникальный идентификатор для URL. Например,
                          для воркспейса "Основной проект" slug может быть
                          "osnovnoy-proekt". Используется только латиница, цифры
                          и дефисы.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-stretch overflow-hidden rounded-md border">
                  <div className="bg-muted text-muted-foreground flex items-center px-3 text-sm">
                    {appDomain}/orgs/{createdOrganization?.slug}/workspaces/
                  </div>
                  <Input
                    id="workspace-slug"
                    placeholder="acme"
                    value={workspaceSlug}
                    onChange={(e) => handleWorkspaceSlugChange(e.target.value)}
                    required
                    maxLength={50}
                    pattern="[a-z0-9-]+"
                    title="Только строчные буквы, цифры и дефис"
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  Вы сможете изменить это позже в настройках воркспейса.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workspace-description">
                  Описание (опционально)
                </Label>
                <Textarea
                  id="workspace-description"
                  placeholder="Краткое описание воркспейса…"
                  value={workspaceDescription}
                  onChange={(e) => setWorkspaceDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workspace-website">
                  Веб-сайт (опционально)
                </Label>
                <Input
                  id="workspace-website"
                  type="url"
                  placeholder="https://example.com"
                  value={workspaceWebsite}
                  onChange={(e) => setWorkspaceWebsite(e.target.value)}
                  maxLength={200}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleSkipWorkspace}
                  disabled={createWorkspace.isPending}
                >
                  Пропустить
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={
                    createWorkspace.isPending ||
                    !workspaceName ||
                    !workspaceSlug
                  }
                >
                  {createWorkspace.isPending
                    ? "Создание…"
                    : "Создать воркспейс"}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
