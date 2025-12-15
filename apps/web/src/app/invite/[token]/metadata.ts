import type { Metadata } from "next";

export async function generateMetadata({
  params: _params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  return {
    title: "Приглашение в рабочее пространство",
    description:
      "Примите приглашение для присоединения к рабочему пространству",
    robots: {
      index: false,
      follow: false,
    },
  };
}
