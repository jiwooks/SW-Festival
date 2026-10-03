import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { ChatClient } from "./ChatClient";

export const metadata: Metadata = { title: "대화" };

/** 시안: design/screens/04-chat.html · 04-1-chat-dm.html — 대화 영역만 스크롤되도록 화면 높이에 맞춘다 */
export default function Page() {
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
      <ChatClient />
    </div>
  );
}
