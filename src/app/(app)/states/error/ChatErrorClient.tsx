"use client";

import Link from "next/link";
import { useState } from "react";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "@/components/states/CenteredState";
import { ErrorState, remainingLabel } from "@/components/states/ErrorState";

/**
 * 대화 중 연결이 끊겼을 때 (08). 04 대화 화면이 붙으면 그 화면이 이 컴포넌트에
 * 끊긴 사람·라운드·발언 수를 넘긴다. 지금은 시안과 같은 더미 값으로 그린다.
 */
export function ChatErrorClient({
  speaker,
  round,
  utterances,
}: {
  speaker: string;
  round: number;
  utterances: number;
}) {
  const [retrying, setRetrying] = useState(false);

  return (
    <ErrorState
      title="대화를 이어가지 못했어요"
      description={`${speaker}님이 답하는 중에 연결이 끊겼어요. 지금까지 나눈 이야기는 그대로 남아 있어요.`}
      remaining={utterances > 0 ? remainingLabel(round, utterances) : undefined}
      actions={
        <>
          {/* TODO: 04 대화가 붙으면 끊긴 발화부터 다시 요청한다 */}
          <button
            type="button"
            className={PRIMARY_BUTTON}
            disabled={retrying}
            onClick={() => setRetrying(true)}
          >
            {retrying ? "다시 연결하는 중…" : "다시 시도"}
          </button>
          {utterances > 0 && (
            <Link href="/report" className={SECONDARY_BUTTON}>
              여기까지로 리포트 만들기
            </Link>
          )}
        </>
      }
    />
  );
}
