import { paths } from "@qbs-autonaim/config";
import slugify from "@sindresorhus/slugify";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

type OnboardingStep = "welcome" | "organization" | "workspace";

interface CreatedOrganization {
  id: string;
  slug: string;
  name: string;
}

export function useOnboarding() {
  const router = useRouter();
  const trpc = useTRPC();

  const [step, setStep] = useState<OnboardingStep>("welcome");

  // Данные организации
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(true);

  // Созданная организация
  const [createdOrganization, setCreatedOrganization] =
    useState<CreatedOrganization | null>(null);

  // Данные workspace
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [isGeneratingWorkspaceSlug, setIsGeneratingWorkspaceSlug] =
    useState(true);

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
      },
    });
  };

  const handleSkipWorkspace = () => {
    if (!createdOrganization) return;
    router.push(paths.organization.workspaces(createdOrganization.slug));
    router.refresh();
  };

  const handleGetStarted = () => {
    setStep("organization");
  };

  return {
    step,
    organization: {
      name,
      slug,
      description,
      website,
      isGeneratingSlug,
      isPending: createOrganization.isPending,
      onNameChange: handleNameChange,
      onSlugChange: handleSlugChange,
      onDescriptionChange: setDescription,
      onWebsiteChange: setWebsite,
      onSubmit: handleOrganizationSubmit,
    },
    workspace: {
      name: workspaceName,
      slug: workspaceSlug,
      description: workspaceDescription,
      isGeneratingSlug: isGeneratingWorkspaceSlug,
      isPending: createWorkspace.isPending,
      organizationSlug: createdOrganization?.slug ?? "",
      onNameChange: handleWorkspaceNameChange,
      onSlugChange: handleWorkspaceSlugChange,
      onDescriptionChange: setWorkspaceDescription,
      onSubmit: handleWorkspaceSubmit,
      onSkip: handleSkipWorkspace,
    },
    onGetStarted: handleGetStarted,
  };
}
