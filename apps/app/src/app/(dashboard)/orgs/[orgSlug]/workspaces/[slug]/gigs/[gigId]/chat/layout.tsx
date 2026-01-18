"use client";

import { usePathname } from "next/navigation";
import { use } from "react";
import { GigChatList } from "./gig-chat-list";

export default function GigChatLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string; slug: string; gigId: string }>;
}) {
  const pathname = usePathname();
  const { gigId } = use(params);

  const chatSegmentMatch = pathname.match(/\/gigs\/[^/]+\/chat\/([^/]+)/);
  const isChatSelected = Boolean(chatSegmentMatch?.[1]);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div
        className={`${
          isChatSelected ? "hidden md:block" : "block"
        } w-full md:w-80 border-r h-full overflow-hidden`}
      >
        <GigChatList gigId={gigId} />
      </div>
      <div
        className={`${
          isChatSelected ? "flex" : "hidden md:flex"
        } flex-1 h-full overflow-hidden`}
      >
        {children}
      </div>
    </div>
  );
}
