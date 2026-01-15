import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://docs.qbs-autonaim.ru";

  // Static pages
  const staticPages = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/quickstart`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/glossary`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
  ];

  // Candidates section
  const candidatesPages = [
    "/candidates",
    "/candidates/screening",
    "/candidates/scoring",
    "/candidates/pipeline",
    "/candidates/gig",
    "/candidates/voice",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // AI Assistant section
  const aiPages = [
    "/ai-assistant",
    "/ai-assistant/chat",
    "/ai-assistant/auto-replies",
    "/ai-assistant/templates",
    "/ai-assistant/scenarios",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Analytics section
  const analyticsPages = [
    "/analytics",
    "/analytics/reports",
    "/analytics/metrics",
    "/analytics/dashboard",
    "/analytics/roi",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Integrations section
  const integrationsPages = [
    "/integrations",
    "/integrations/hh",
    "/integrations/superjob",
    "/integrations/telegram",
    "/integrations/freelance",
    "/integrations/email",
    "/integrations/1c",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Settings section
  const settingsPages = [
    "/settings/account",
    "/settings/team",
    "/settings/notifications",
    "/settings/security",
    "/settings/privacy",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  // Help section
  const helpPages = [
    "/help/faq",
    "/help/videos",
    "/help/knowledge-base",
    "/help/support",
    "/help/status",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Pricing page (when implemented)
  const pricingPage = {
    url: `${baseUrl}/pricing`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  };

  return [
    ...staticPages,
    ...candidatesPages,
    ...aiPages,
    ...analyticsPages,
    ...integrationsPages,
    ...settingsPages,
    ...helpPages,
    pricingPage,
  ];
}