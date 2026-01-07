"use client";

import { usePathname } from "next/navigation";
import { use } from "react";
import { SiteHeader } from "~/components/layout";
import { ChatList } from "./chat-list";

export default function ChatLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string; slug: string }>;
}) {
  const pathname = usePathname();
  use(params);

  // Check if pathname matches pattern: /orgs/[orgSlug]/workspaces/[slug]/chat/[responseId]
  // A chat is selected when there's a non-empty segment after /chat/
  const chatSegmentMatch = pathname.match(/\/chat\/([^/]+)/);
  const isChatSelected = Boolean(chatSegmentMatch?.[1]);

  return (
    <>
      <SiteHeader />
      <div className="flex h-[calc(100vh-4rem)]">
        <div
          className={`${
            isChatSelected ? "hidden md:block" : "block"
          } w-full md:w-80 border-r h-full overflow-hidden`}
        >
          <ChatList />
        </div>
        <div
          className={`${
            isChatSelected ? "flex" : "hidden md:flex"
          } flex-1 h-full overflow-hidden`}
        >
          {children}
        </div>
      </div>
    </>
  );
}
