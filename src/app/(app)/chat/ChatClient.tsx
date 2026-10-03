"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChatComposer,
  ChatRoomHeader,
  NextSpeaker,
  PersonaMessage,
  QuestionChips,
  RoundDivider,
  TypingMessage,
  UserMessage,
} from "@/components/chat/ChatParts";
import { PersonaAvatar } from "@/components/PersonaAvatar";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "@/components/states/CenteredState";
import { ErrorState, remainingLabel } from "@/components/states/ErrorState";
import { streamChat } from "@/lib/chatStream";
import { MOCK_PERSONAS, MOCK_PRESELECTED, MOCK_QUESTION_POOL } from "@/lib/mock";
import { roundLabel, type ChatEvent, type ChatRequest, type Message, type Persona } from "@/lib/types";
import { DmPanel } from "./DmPanel";

type Msg = Pick<Message, "id" | "speakerId" | "text" | "round" | "concern">;
type Speaking = { id: string; nextId?: string } | null;

const USER = "user";

/**
 * 시안: design/screens/04-chat.html (단체) + 04-1-chat-dm.html (1:1 패널) + 07-1 (답하는 중) + 08 (끊김)
 *
 * 단체 대화가 메인이고, 페르소나는 /api/chat 이 정한 순서대로 한 명씩 토큰 단위로 말한다.
 * 1:1 패널이 열려 있는 동안 단체 대화는 멈추고, 멈췄다는 것을 화면에 표시한다.
 * TODO: 02·03 에서 고른 세 명이 넘어오면 MOCK_PRESELECTED 대신 그걸 쓴다.
 */
export function ChatClient({ initialDraft = "" }: { initialDraft?: string }) {
  const personas = useMemo(
    () => MOCK_PRESELECTED.map((id) => MOCK_PERSONAS.find((p) => p.id === id)).filter((p): p is Persona => !!p),
    [],
  );
  const byId = useCallback((id?: string) => personas.find((p) => p.id === id), [personas]);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [round, setRound] = useState(1);
  const [speaking, setSpeaking] = useState<Speaking>(null);
  /** 말할 차례가 됐지만 첫 글자가 아직 안 온 동안만 "답하는 중" 점 세 개를 띄운다 */
  const [waiting, setWaiting] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [failed, setFailed] = useState<{ personaId?: string } | null>(null);
  const [stopped, setStopped] = useState(false);
  const [dmId, setDmId] = useState<string | null>(null);
  // 05 리포트의 "이어서 물어볼 지점"을 누르고 오면 그 질문이 입력창에 채워져 있다
  const [draft, setDraft] = useState(initialDraft);
  const [questionAt, setQuestionAt] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const lastRequest = useRef<ChatRequest | null>(null);
  // 요청을 만들 때 최신 대화가 필요하다. 렌더 중에 ref 를 쓰지 않도록 effect 에서 맞춘다
  const messagesRef = useRef<Msg[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const run = useCallback(
    (req: Omit<ChatRequest, "history" | "personaIds" | "roomType">) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const request: ChatRequest = {
        ...req,
        roomType: "group",
        personaIds: personas.map((p) => p.id),
        history: messagesRef.current
          .filter((m) => m.text)
          .map(({ speakerId, text, round: r, concern }) => ({ speakerId, text, round: r, concern })),
      };
      lastRequest.current = request;
      setStreaming(true);
      setStopped(false);
      setFailed(null);
      const turnId = Date.now().toString(36);
      let currentRound = req.round;

      const onEvent = (e: ChatEvent) => {
        if (controller.signal.aborted) return;
        switch (e.type) {
          case "round":
            currentRound = e.round;
            setRound(e.round);
            break;
          case "start":
            setSpeaking({ id: e.personaId, nextId: e.nextId });
            setWaiting(true);
            break;
          case "token":
            setWaiting(false);
            setMessages((prev) => {
              const id = `${turnId}-${e.personaId}`;
              const at = prev.findIndex((m) => m.id === id);
              if (at < 0) return [...prev, { id, speakerId: e.personaId, text: e.text, round: currentRound }];
              const next = [...prev];
              next[at] = { ...next[at], text: next[at].text + e.text };
              return next;
            });
            break;
          case "end":
            setMessages((prev) =>
              prev.map((m) => (m.id === `${turnId}-${e.personaId}` ? { ...m, concern: e.concern } : m)),
            );
            break;
          case "error":
            // 끊긴 사람의 반쯤 쓴 말은 지운다 — 남아 있는 것은 끝까지 말한 발언만
            setMessages((prev) => prev.filter((m) => m.id !== `${turnId}-${e.personaId}`));
            setFailed({ personaId: e.personaId });
            setSpeaking(null);
            setWaiting(false);
            setStreaming(false);
            break;
          case "done":
            setSpeaking(null);
            setWaiting(false);
            setStreaming(false);
            break;
        }
      };

      const url =
        typeof window !== "undefined" && window.location.search.includes("simulateError=1")
          ? "/api/chat?simulateError=1"
          : "/api/chat";
      void streamChat(request, onEvent, controller.signal, url);
    },
    [personas],
  );

  // 들어오면 1라운드(처음 들은 생각)를 시작한다. 떠나면 끊는다.
  // (개발 모드 StrictMode 는 effect 를 두 번 돌린다 — 첫 요청은 정리에서 끊기고 두 번째가 산다)
  useEffect(() => {
    // 외부 스트림(/api/chat)을 여는 자리다. run 이 "연결 중" 표시를 위해 상태를 바로 바꾸는데,
    // 그건 구독 시작을 알리는 한 번뿐이라 여기서만 규칙을 끈다 (01 IdeaFormClient 와 같은 예외)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 외부 스트림 구독 시작
    run({ kind: "round", round: 1 });
    return () => abortRef.current?.abort();
  }, [run]);

  // 맨 아래를 보고 있을 때만 따라 내려간다 — 위를 읽는 중이면 끌어내리지 않는다
  const stick = useRef(true);
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages, speaking]);

  /** 지금 말하던 사람까지만 듣고 멈춘다. 반쯤 쓴 말은 그대로 둔다. */
  const stop = () => {
    abortRef.current?.abort();
    setSpeaking(null);
    setWaiting(false);
    setStreaming(false);
    setStopped(true);
  };

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    // @이름 으로 시작하면 그 사람에게만 묻는다
    const mention = trimmed.match(/^@(\S+)/)?.[1];
    const target = mention ? personas.find((p) => p.name === mention || p.name.endsWith(mention)) : undefined;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now().toString(36)}`, speakerId: USER, text: trimmed, round },
    ]);
    messagesRef.current = [
      ...messagesRef.current,
      { id: "pending", speakerId: USER, text: trimmed, round },
    ];
    setDraft("");
    run({ kind: "message", round, message: trimmed, targetId: target?.id });
  };

  const closeDm = useCallback(() => setDmId(null), []);

  const openDm = (id: string) => {
    if (streaming) stop(); // 1:1 이 열려 있는 동안 단체 대화는 멈춘다
    setDmId(id);
  };

  // 가장 많이 걸려한 사람 — 대화 중 태깅된 concern 수로 센다. 아무도 없으면 버튼을 띄우지 않는다.
  const mostConcerned = useMemo(() => {
    const counts = personas.map((p) => ({
      p,
      n: messages.filter((m) => m.speakerId === p.id && m.concern).length,
    }));
    const top = counts.sort((a, b) => b.n - a.n)[0];
    return top && top.n > 0 ? top.p : undefined;
  }, [messages, personas]);

  // 처음 걸려한 말을 인용한다 — 뒤로 갈수록 앞 말을 되풀이하는 경우가 많아 그 사람을 가장 잘 보여주는 건 첫 반대다
  const concernQuote = (id: string) => messages.find((m) => m.speakerId === id && m.concern)?.text;

  const spoken = messages.filter((m) => m.speakerId !== USER && m.text).length;
  const questions = [0, 1].map((i) => MOCK_QUESTION_POOL[(questionAt + i) % MOCK_QUESTION_POOL.length]);
  const speaker = byId(speaking?.id);
  const next = byId(speaking?.nextId);
  const dmPersona = byId(dmId ?? undefined);

  if (failed) {
    const who = byId(failed.personaId);
    return (
      <ErrorState
        title="대화를 이어가지 못했어요"
        description={`${who ? `${who.name}님이 답하는 중에` : "답을 받는 중에"} 연결이 끊겼어요. 지금까지 나눈 이야기는 그대로 남아 있어요.`}
        remaining={spoken > 0 ? remainingLabel(round, spoken) : undefined}
        actions={
          <>
            <button
              type="button"
              className={PRIMARY_BUTTON}
              onClick={() => {
                const req = lastRequest.current;
                if (req) run({ kind: req.kind, round: req.round, message: req.message, targetId: req.targetId });
              }}
            >
              다시 시도
            </button>
            {spoken > 0 && (
              <Link href="/report" className={SECONDARY_BUTTON}>
                여기까지로 리포트 만들기
              </Link>
            )}
          </>
        }
      />
    );
  }

  return (
    <>
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="flex grow flex-col items-center overflow-y-auto py-6"
        inert={Boolean(dmPersona)}
      >
        <div className="flex w-[880px] flex-col gap-4" aria-live="polite" aria-busy={streaming}>
          <ChatRoomHeader personas={personas} round={round} onOpenDm={openDm} />

          {messages.map((m, i) => {
            const newRound = i === 0 || messages[i - 1].round !== m.round;
            const p = byId(m.speakerId);
            return (
              <Fragment key={m.id}>
                {newRound && <RoundDivider round={m.round} label={roundLabel(m.round)} />}
                {m.speakerId === USER ? (
                  <UserMessage>{m.text}</UserMessage>
                ) : p ? (
                  <PersonaMessage name={p.name} color={p.color}>
                    {m.text}
                  </PersonaMessage>
                ) : null}
              </Fragment>
            );
          })}

          {messages.length === 0 && <RoundDivider round={round} label={roundLabel(round)} />}
          {speaker && waiting && <TypingMessage name={speaker.name} color={speaker.color} />}

          {streaming && next && <NextSpeaker name={next.name} color={next.color} onStop={stop} />}
          {streaming && !next && speaker && (
            <div className="flex">
              <button
                type="button"
                onClick={stop}
                className="h-11 rounded-full border border-btn-border bg-base px-3.5 text-[13px] text-ink-3"
              >
                여기서 멈추기
              </button>
            </div>
          )}
          {stopped && (
            <p className="text-[13px] text-ink-3" role="status">
              여기서 멈췄어요. 이어서 들으려면 질문을 보내거나 ‘이어서 더 듣기’를 누르세요.
            </p>
          )}

          {!streaming && spoken > 0 && (
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => run({ kind: "round", round: round + 1 })}
                className="h-11 rounded-btn border border-btn-border bg-base px-[18px] text-sm text-ink-2"
              >
                이어서 더 듣기
              </button>
              {mostConcerned && (
                <button
                  type="button"
                  onClick={() => openDm(mostConcerned.id)}
                  className="flex h-11 items-center gap-[9px] rounded-btn bg-conflict-bg px-4 text-sm text-conflict-fg"
                >
                  <PersonaAvatar name={mostConcerned.name} color={mostConcerned.color} size="sm" />
                  {mostConcerned.name}님이 가장 많이 걸려했어요 · 따로 물어보기
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex h-[134px] shrink-0 justify-center pb-[22px]" inert={Boolean(dmPersona)}>
        <div className="flex w-[880px] flex-col gap-3">
          <QuestionChips
            questions={questions}
            onPick={(q) => setDraft(q)}
            onMore={() => setQuestionAt((i) => i + 2)}
          />
          <ChatComposer
            value={draft}
            onChange={setDraft}
            onSend={() => send(draft)}
            sending={streaming}
            placeholder={
              streaming
                ? "세 명이 말하는 동안에도 질문을 적어둘 수 있어요"
                : "궁금한 걸 물어보세요. @이름을 쓰면 그 사람에게만 물어봐요."
            }
          />
        </div>
      </div>

      {dmPersona && (
        <DmPanel
          persona={dmPersona}
          groupQuote={concernQuote(dmPersona.id)}
          onClose={closeDm}
        />
      )}
    </>
  );
}
