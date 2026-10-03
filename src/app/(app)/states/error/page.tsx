import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { MOCK_PERSONAS } from "@/lib/mock";
import { ChatErrorClient } from "./ChatErrorClient";

export const metadata: Metadata = { title: "대화 연결 끊김" };

/** 시안: design/screens/08-error.html — 시안과 같은 장면(정서윤님 발화 중 끊김, ROUND 02, 발언 7개) */
export default function Page() {
  return (
    <>
      <AppHeader current="04" />
      <ChatErrorClient speaker={MOCK_PERSONAS[1].name} round={2} utterances={7} />
    </>
  );
}
