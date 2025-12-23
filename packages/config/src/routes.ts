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
    root: (slug: string) => `/${slug}`,
    candidates: (slug: string) => `/${slug}/candidates`,
    chat: (slug: string, candidateId?: string) =>
      candidateId ? `/${slug}/chat/${candidateId}` : `/${slug}/chat`,
    funnel: (slug: string) => `/${slug}/funnel`,
    responses: (slug: string, responseId?: string) =>
      responseId ? `/${slug}/responses/${responseId}` : `/${slug}/responses`,
    vacancies: (slug: string, vacancyId?: string) =>
      vacancyId ? `/${slug}/vacancies/${vacancyId}` : `/${slug}/vacancies`,
    settings: {
      root: (slug: string) => `/${slug}/settings`,
      members: (slug: string) => `/${slug}/settings/members`,
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
    },
  },
} as const;
