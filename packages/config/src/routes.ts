const ROOTS = {
  DASHBOARD: "/",
  AUTH: "/auth",
  ACCOUNT: "/account",
  ONBOARDING: "/onboarding",
  INVITATIONS: "/invitations",
  INVITE: "/invite",
  ACCESS_DENIED: "/access-denied",
} as const;

export const paths = {
  dashboard: {
    root: ROOTS.DASHBOARD,
  },
  auth: {
    root: ROOTS.AUTH,
    signin: `${ROOTS.AUTH}/signin`,
    signup: `${ROOTS.AUTH}/signup`,
    otp: `${ROOTS.AUTH}/otp`,
    forgotPassword: `${ROOTS.AUTH}/forgot-password`,
    resetPassword: `${ROOTS.AUTH}/reset-password`,
  },
  account: {
    root: ROOTS.ACCOUNT,
    settings: `${ROOTS.ACCOUNT}/settings`,
  },
  workspace: {
    root: (orgSlug: string, slug: string) =>
      `/orgs/${orgSlug}/workspaces/${slug}`,
    candidates: (orgSlug: string, slug: string) =>
      `/orgs/${orgSlug}/workspaces/${slug}/candidates`,
    chat: (orgSlug: string, slug: string, candidateId?: string) =>
      candidateId
        ? `/orgs/${orgSlug}/workspaces/${slug}/chat/${candidateId}`
        : `/orgs/${orgSlug}/workspaces/${slug}/chat`,
    funnel: (orgSlug: string, slug: string) =>
      `/orgs/${orgSlug}/workspaces/${slug}/funnel`,
    responses: (orgSlug: string, slug: string, responseId?: string) =>
      responseId
        ? `/orgs/${orgSlug}/workspaces/${slug}/responses/${responseId}`
        : `/orgs/${orgSlug}/workspaces/${slug}/responses`,
    vacancies: (
      orgSlug: string,
      slug: string,
      vacancyId?: string,
      section?: "detail" | "settings" | "responses" | "edit",
    ) => {
      const base = `/orgs/${orgSlug}/workspaces/${slug}/vacancies`;
      if (!vacancyId) return base;
      if (section) return `${base}/${vacancyId}/${section}`;
      return `${base}/${vacancyId}`;
    },
    settings: {
      root: (orgSlug: string, slug: string) =>
        `/orgs/${orgSlug}/workspaces/${slug}/settings`,
      members: (orgSlug: string, slug: string) =>
        `/orgs/${orgSlug}/workspaces/${slug}/settings/members`,
      telegram: (orgSlug: string, slug: string) =>
        `/orgs/${orgSlug}/workspaces/${slug}/settings/telegram`,
    },
  },
  onboarding: {
    root: ROOTS.ONBOARDING,
  },
  invitations: {
    root: ROOTS.INVITATIONS,
    accept: (token: string) => `${ROOTS.INVITE}/${token}`,
  },
  accessDenied: ROOTS.ACCESS_DENIED,
  organization: {
    workspaces: (slug: string) => `/orgs/${slug}/workspaces`,
    settings: {
      root: (slug: string) => `/orgs/${slug}/settings`,
      members: (slug: string) => `/orgs/${slug}/settings/members`,
      billing: (slug: string) => `/orgs/${slug}/settings/billing`,
      usage: (slug: string) => `/orgs/${slug}/settings/usage`,
    },
  },
} as const;
