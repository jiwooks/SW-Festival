import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { MOCK_PERSONAS } from "@/lib/mock";
import { LoadingChatClient } from "./LoadingChatClient";

export const metadata: Metadata = { title: "답하는 중" };

/** 시안: design/screens/07-1-loading-chat.html — 시안과 같은 장면(박민수 → 정서윤 답하는 중 → 다음 김태현) */
export default function Page() {
  const [minsu, seoyun, taehyun] = MOCK_PERSONAS;
  return (
    <>
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
      <LoadingChatClient
        spoke={{ persona: minsu, text: "저는 인터뷰를 아예 못 해본 쪽이라, 뭐라도 먼저 해보는 게 낫다고 봐요." }}
        speaking={seoyun}
        next={taehyun}
      />
    </>
  );
}
