"use client";

import { useEffect, useRef, useState } from "react";
import { UserMessage } from "@/components/chat/ChatParts";
import { PersonaAvatar } from "@/components/PersonaAvatar";
import { streamChat } from "@/lib/chatStream";
import type { ChatEvent, Persona, PersonaColor } from "@/lib/types";

type DmMsg = { id: string; speakerId: string; text: string };

const NAME_COLOR: Record<PersonaColor, string> = {
  1: "text-persona-1",
  2: "text-persona-2",
  3: "text-persona-3",
  4: "text-persona-4",
  5: "text-persona-5",
};

/**
 * 시안: design/screens/04-1-chat-dm.html — 오른쪽 460px 1:1 패널.
 *
 * - 열려 있는 동안 단체 대화는 멈추고 딤 처리한다. 멈췄다는 것을 위쪽에 띄운다
 * - 위에 "단체 대화에서 걸려한 부분"을 그 사람이 실제로 한 말로 인용한다 — 왜 따로 이야기하는지가 맥락으로 붙는다
 * - MVP 에서 1:1 컨텍스트는 단체방과 나눈다. history 에 이 방 메시지만 보낸다 (DECISIONS.md 04)
 * - Esc 로 닫고, 닫으면 단체 대화로 돌아간다
 */
export function DmPanel({
  persona,
  groupQuote,
  onClose,
}: {
  persona: Persona;
  /** 단체 대화에서 이 사람이 걸려한 말. 없으면 인용 칸을 그리지 않는다 */
  groupQuote?: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<DmMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0); // 메시지 id 용 순번

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      abortRef.current?.abort();
    };
  }, [onClose]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, waiting]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    const history = [...messages, { id: "u", speakerId: "user", text: trimmed }];
    seq.current += 1;
    const turn = seq.current;
    setMessages((prev) => [...prev, { id: `u-${turn}`, speakerId: "user", text: trimmed }]);
    setDraft("");
    setSuggestions([]);
    setFailed(false);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const replyId = `r-${turn}`;
    const onEvent = (e: ChatEvent) => {
      switch (e.type) {
        case "start":
          setWaiting(true);
          break;
        case "token":
          setWaiting(false);
          setMessages((prev) => {
            const at = prev.findIndex((m) => m.id === replyId);
            if (at < 0) return [...prev, { id: replyId, speakerId: e.personaId, text: e.text }];
            const next = [...prev];
            next[at] = { ...next[at], text: next[at].text + e.text };
            return next;
          });
          break;
        case "suggestions":
          setSuggestions(e.items);
          break;
        case "error":
          setMessages((prev) => prev.filter((m) => m.id !== replyId));
          setFailed(true);
          setWaiting(false);
          setStreaming(false);
          break;
        case "done":
          setWaiting(false);
          setStreaming(false);
          break;
      }
    };
    void streamChat(
      {
        roomType: "dm",
        kind: "message",
        personaIds: [persona.id],
        round: 1,
        message: trimmed,
        history: history.map((m) => ({ speakerId: m.speakerId, text: m.text, round: 1 })),
      },
      onEvent,
      controller.signal,
    );
  };

  return (
    <>
      {/* 단체 대화 딤 + 멈춤 안내. 누르면 닫힌다 */}
      <button
        type="button"
        aria-label="1:1 닫고 단체 대화로 돌아가기"
        onClick={onClose}
        className="fixed inset-y-0 left-0 right-[460px] z-10 cursor-default bg-dark-bg/40"
      />
      <div className="pointer-events-none fixed left-0 right-[460px] top-0 z-20 flex h-16 items-center justify-center">
        <p className="flex items-center gap-2 rounded-full bg-dark-bg/60 px-3.5 py-[7px] text-[13px] text-dark-ink">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--dark-text)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
          단체 대화는 잠시 멈춰 있어요
        </p>
      </div>

      <aside
        role="dialog"
        aria-label={`${persona.name}와 1:1 대화`}
        className="fixed inset-y-0 right-0 z-30 flex w-[460px] flex-col border-l border-line bg-base"
      >
        <div className="flex items-center gap-3 border-b border-line px-[22px] py-[18px]">
          <PersonaAvatar name={persona.name} color={persona.color} size="lg" />
          <div className="flex grow flex-col gap-0.5">
            <p className="text-[16px] font-semibold">{persona.name}</p>
            <p className="font-mono text-[11px] tracking-[0.1em] text-muted">둘이서만</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex size-11 shrink-0 items-center justify-center rounded-[10px] border border-btn-border bg-base"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-2)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {groupQuote && (
          <div className="flex flex-col gap-1.5 border-b border-line bg-panel px-[22px] py-3.5">
            <p className="font-mono text-[10px] font-semibold tracking-[0.12em] text-muted">단체 대화에서 걸려한 부분</p>
            <blockquote className="text-sm leading-[1.65] text-ink-2">“{groupQuote}”</blockquote>
          </div>
        )}

        <div ref={listRef} className="flex grow flex-col gap-3.5 overflow-y-auto px-[22px] py-[18px]" aria-live="polite">
          {messages.length === 0 && (
            <p className="text-[13px] leading-[1.6] text-muted">
              단체 대화에서 다 못 들은 이야기를 {persona.name}님에게만 물어보세요. 이 대화는 단체방에 보이지 않아요.
            </p>
          )}
          {messages.map((m) =>
            m.speakerId === "user" ? (
              <UserMessage key={m.id} compact>
                {m.text}
              </UserMessage>
            ) : (
              <div key={m.id} className="flex max-w-[350px] flex-col gap-[5px]">
                <p className={`text-[11px] font-semibold ${NAME_COLOR[persona.color]}`}>{persona.name}</p>
                <div className="rounded-[4px_12px_12px_12px] bg-bubble px-3.5 py-[11px] text-sm leading-[1.7] text-ink-2">
                  {m.text}
                </div>
              </div>
            ),
          )}
          {waiting && (
            <p className={`text-[11px] font-semibold ${NAME_COLOR[persona.color]}`} role="status">
              {persona.name}님이 답하는 중…
            </p>
          )}
          {failed && (
            <p className="text-[13px] text-conflict-fg" role="status">
              답을 받는 중에 연결이 끊겼어요. 보낸 말은 남아 있으니 다시 보내 주세요.
            </p>
          )}

          {suggestions.length > 0 && !streaming && (
            <div className="mt-auto flex flex-col gap-[7px]">
              <p className="font-mono text-[10px] font-semibold tracking-[0.12em] text-muted">이어서 물어볼 만한 것</p>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-[11px] border border-action-border bg-action-bg px-[13px] py-[11px] text-left text-[13px] leading-[1.6] text-brand"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <form
          className="flex items-center gap-2.5 border-t border-line px-[22px] py-4"
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <label htmlFor="dm" className="sr-only">
            {persona.name}에게 보낼 말
          </label>
          <input
            ref={inputRef}
            id="dm"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`${persona.name}님에게 물어보기`}
            className="h-[46px] grow rounded-btn border border-input-border bg-input px-[15px] text-sm text-ink placeholder:text-muted"
          />
          <button
            type="submit"
            aria-label="보내기"
            disabled={streaming || !draft.trim()}
            className="flex size-[46px] shrink-0 items-center justify-center rounded-btn bg-brand disabled:cursor-not-allowed disabled:bg-btn-border"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--bg-base)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </form>
      </aside>
    </>
  );
}
