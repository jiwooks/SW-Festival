import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { ChatClient } from "./ChatClient";

export const metadata: Metadata = { title: "대화" };

/**
 * 시안: design/screens/04-chat.html · 04-1-chat-dm.html — 대화 영역만 스크롤되도록 화면 높이에 맞춘다.
 * ?ask= 로 들어오면(05 리포트 "이어서 물어볼 지점") 그 질문을 입력창에 채워 둔다.
 */
export default async function Page({ searchParams }: { searchParams: Promise<{ ask?: string }> }) {
  const { ask } = await searchParams;
  return (
    <div className="flex h-dvh flex-col">
      <AppHeader
        current="04"
        right={
          <Link
            href="/report"
            className="inline-flex h-11 items-center rounded-btn bg-brand px-[18px] text-sm font-semibold text-white hover:bg-brand-hover"
          >
            리포트 만들기
          </Link>
        }
      />
      <ChatClient initialDraft={ask?.slice(0, 500) ?? ""} />
    </div>
  );
}
