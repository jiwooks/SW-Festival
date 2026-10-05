"use client";

import { useState } from "react";
import {
  ChatComposer,
  NextSpeaker,
  PersonaMessage,
  RoundDivider,
  TypingMessage,
} from "@/components/chat/ChatParts";
import type { Persona } from "@/lib/types";

/**
 * 시안: design/screens/07-1-loading-chat.html — 페르소나가 순차로 말하는 동안.
 * 지금 누가 말하는 중인지 / 다음이 누구인지 보여주고, 기다리는 동안에도
 * 질문을 적어두거나 여기서 멈출 수 있게 한다. 04 대화 화면이 같은 조각을 쓴다.
 */
export function LoadingChatClient({
  spoke,
  speaking,
  next,
}: {
  /** 이미 말한 사람과 그 말 */
  spoke: { persona: Persona; text: string };
  /** 지금 답하는 중인 사람 */
  speaking: Persona;
  /** 다음 차례 */
  next: Persona;
}) {
  const [draft, setDraft] = useState("");
  const [stopped, setStopped] = useState(false);

  return (
    <>
      <main className="flex grow flex-col items-center overflow-hidden py-6">
        <div className="flex w-[880px] flex-col gap-4">
          <RoundDivider round={2} label="서로 이야기 나누기" />
          <PersonaMessage name={spoke.persona.name} color={spoke.persona.color} face={spoke.persona}>
            {spoke.text}
          </PersonaMessage>
          <TypingMessage name={speaking.name} color={speaking.color} face={speaking} />
          {stopped ? (
            <p className="text-[13px] text-ink-3" role="status">
              {speaking.name}님 답까지만 듣고 멈춰요. 이어서 들으려면 질문을 보내세요.
            </p>
          ) : (
            <NextSpeaker name={next.name} color={next.color} face={next} onStop={() => setStopped(true)} />
          )}
        </div>
      </main>
      <div className="flex h-[92px] shrink-0 justify-center pb-[22px]">
        <ChatComposer
          value={draft}
          onChange={setDraft}
          onSend={() => setDraft("")}
          sending
          placeholder="세 명이 말하는 동안에도 질문을 적어둘 수 있어요"
        />
      </div>
    </>
  );
}
