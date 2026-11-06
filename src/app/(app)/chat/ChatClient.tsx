"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ChatComposer, ChatRoomHeader, PersonaMessage, QuestionChips, TypingMessage, UserMessage } from "@/components/chat/ChatParts";
import { currentSessionId, getSession, rememberSession, runSessionAction, type SoulSession } from "@/lib/soul-api";
import { useSoulSession } from "@/lib/use-soul-session";
import { cardColor } from "@/lib/persona-presentation";
import { IdeaSummary } from "@/components/IdeaSummary";
import { displayChatText } from "@/lib/chat-presentation";
import { DmPanel } from "./DmPanel";
type Ask = { question: string; persona_id: string | null; interaction: "auto" | "direct" };
const SECONDARY = "inline-flex h-11 items-center justify-center rounded-btn border border-btn-border bg-base px-4 text-sm text-ink-2 disabled:opacity-50";
const pendingKey = (id: string) => `soul.qwen.pending-message.v1:${id}`;

export function ChatClient({ initialDraft = "", initialPersona = "" }: { initialDraft?: string; initialPersona?: string }) {
  const router = useRouter();
  const { session, loading, error: readError } = useSoulSession();
  const [draft, setDraft] = useState(initialDraft);
  const [targetId, setTargetId] = useState(initialPersona);
  const [dmId, setDmId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [operation, setOperation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [questionAt, setQuestionAt] = useState(0);
  const [retry, setRetry] = useState<Ask | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const initialized = useRef<string | null>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [session?.transcript.length, session?.pending_speaker]);
  useEffect(() => {
    if (!session || initialized.current === session.id) return;
    initialized.current = session.id;
    const pending = session.dialogue_runtime.followup;
    if (pending && !pending.done) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore a persisted server mutation for explicit retry.
      setRetry({ question: pending.key[0], persona_id: pending.key[1], interaction: pending.key[2] === "direct" ? "direct" : "auto" });
    } else if (session.error) {
      try { const raw = localStorage.getItem(pendingKey(session.id)); if (raw) setRetry(JSON.parse(raw)); } catch {}
    }
  }, [session]);
  const unfinished = !!session?.dialogue_runtime.followup && !session.dialogue_runtime.followup.done;
  const live = unfinished && !session?.error;
  const sessionId = session?.id;
  useEffect(() => {
    if (!sessionId || !live || busy) return;
    let reading = false;
    let active = true;
    const timer = setInterval(async () => { if (reading) return; reading = true; try { const latest = await getSession(sessionId); if (active && (currentSessionId() === sessionId || currentSessionId() === null)) rememberSession(latest); } catch {} finally { reading = false; } }, 1500);
    return () => { active = false; clearInterval(timer); };
  }, [sessionId, live, busy]);
  const personas = (session?.cards ?? []).map(card => ({ id: card.id, name: card.presentation.display_name, segment: card.immutable_core.identity_context.segment, color: cardColor(session!, card) }));
  const byId = (id?: string | null) => personas.find(p => p.id === id);
  const publicTurns = (session?.transcript ?? []).filter(t => t.phase === "group");
  const utteranceOwners = Object.fromEntries(publicTurns.map(turn => [turn.id, byId(turn.persona_id)?.name ?? ""]));
  const inProgress = busy || live;
  const pendingSpeaker = byId(session?.pending_speaker);
  const dmPersona = byId(dmId);
  const reported = !!session?.report;
  const reportPending = !!session?.dialogue_runtime.report_snapshot && !session.dialogue_runtime.report_snapshot.done;
  const recoverableMessage = unfinished || ((session?.status === "PRE" || session?.status === "FAILED") && !publicTurns.length);

  async function send(text: string, directedPersona?: string | null, resume = false) {
    if (!session || inProgress || !text.trim() || text.trim().length > 500) return;
    const mention = text.trim().match(/^@(\S+)/)?.[1];
    const mentioned = mention ? personas.find(p => p.name === mention) : null;
    const addressed = directedPersona || targetId || mentioned?.id || null;
    const request: Ask = resume && retry ? retry : { question: text.trim(), persona_id: addressed, interaction: addressed ? "direct" : "auto" };
    setBusy(true); setOperation("ask"); setError(null); setRetry(request);
    try { localStorage.setItem(pendingKey(session.id), JSON.stringify(request)); } catch {}
    try {
      await runSessionAction(session.id, "ask", request);
      setRetry(null); setDraft("");
      try { localStorage.removeItem(pendingKey(session.id)); } catch {}
    } catch (err) { setError(err instanceof Error ? err.message : "대화를 이어가지 못했습니다."); }
    finally { setBusy(false); setOperation(""); }
  }
  async function suggestions() {
    if (!session || inProgress) return;
    if (session.suggestions.length) { setQuestionAt(value => value + 2); return; }
    setBusy(true); setOperation("suggestions"); setError(null);
    try { await runSessionAction(session.id, "suggestions"); }
    catch (err) { setError(err instanceof Error ? err.message : "질문 추천을 받지 못했습니다."); }
    finally { setBusy(false); setOperation(""); }
  }
  async function finish() {
    if (!session || inProgress || unfinished || !publicTurns.length) return;
    setBusy(true); setOperation("finish"); setError(null);
    try { await runSessionAction(session.id, "finish"); router.push("/report"); }
    catch (err) { setError(err instanceof Error ? err.message : "리포트를 만들지 못했습니다."); }
    finally { setBusy(false); setOperation(""); }
  }
  const questions = session?.suggestions.length ? [0, 1].map(offset => session.suggestions[(questionAt + offset) % session.suggestions.length].question) : [];
  if (loading) return <main className="flex grow items-center justify-center p-20" role="status">저장한 대화를 불러오고 있어요.</main>;
  if (!session?.cards.length) return <main className="flex grow flex-col items-center justify-center gap-4 p-20"><h1 className="text-2xl font-semibold">먼저 페르소나를 만들어 주세요</h1>{readError && <p role="alert" className="text-conflict-fg">{readError}</p>}<Link href="/targets" className={SECONDARY}>이용자 고르기</Link></main>;

  function eventsBefore(index: number, current: SoulSession) { return current.chat_events.filter(event => event.before === index && (current.lounge_mode !== "guided" || event.role === "founder")); }
  return <>
    <AppHeader current="04" right={<div className="flex gap-2">{reported && <Link href="/report" className={SECONDARY}>{session.report_stale ? "이전 리포트 보기" : "리포트 보기"}</Link>}<button type="button" disabled={inProgress || unfinished || !publicTurns.length} onClick={() => void finish()} className="h-11 rounded-btn bg-brand px-[18px] text-sm font-semibold text-white disabled:opacity-50">{operation === "finish" ? "리포트 생성 중…" : session.report_stale ? "리포트 업데이트" : "리포트 만들기"}</button></div>}/>
    <div ref={scrollRef} onScroll={event => { const el = event.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 90; }} className="flex min-h-0 grow flex-col items-center overflow-y-auto px-5 py-6">
      <div className="flex w-full max-w-[880px] flex-col gap-4" aria-live="polite" aria-busy={inProgress}><IdeaSummary input={session.input} compact /><ChatRoomHeader personas={personas} round={session.threads.length} interaction={operation === "ask" && retry ? retry.interaction : session.dialogue_runtime.followup?.key[2] ?? (targetId ? "direct" : "auto")} onOpenDm={id => { if (!inProgress && !unfinished) setDmId(id); }}/>
        <p className="text-xs leading-relaxed text-muted">{session.mode === "mock" ? "모의 테스트 모드입니다. 실제 Qwen 성능 평가 결과가 아닙니다." : "가상 페르소나와의 대화입니다."}</p>
        {!publicTurns.length && !inProgress && <div className="rounded-card border border-card bg-base p-6"><h2 className="text-lg font-semibold">궁금한 점을 물어보세요</h2><p className="mt-2 text-sm leading-relaxed text-ink-3">선택한 {personas.length}명이 먼저 자기 조건에서 답하고, 서로의 말에 적용되는 조건이나 차이를 비교합니다. 답변이 끝난 뒤에도 아래 입력칸에서 계속 질문할 수 있어요.</p></div>}
        {session.transcript.map((turn, index) => { const p = byId(turn.persona_id); const parent = publicTurns.find(t => t.id === turn.reply_to); const parentPersona = byId(parent?.persona_id); return <Fragment key={turn.id}>{eventsBefore(index, session).map((event, i) => event.role === "founder" ? <UserMessage key={`${index}-${i}`}>{event.content}</UserMessage> : <p key={`${index}-${i}`} className="self-center rounded-full bg-bubble px-4 py-2 text-center text-xs leading-relaxed text-ink-3">{event.content}</p>)}{turn.phase === "group" && p && <div id={`utterance-${turn.id}`} data-utterance-id={turn.id}>{parent && <p className="mb-1 ml-[51px] text-xs text-muted">↳ {parentPersona?.name}님에게 답함</p>}<PersonaMessage name={p.name} segment={p.segment} color={p.color}>{displayChatText(turn.content, p.id, personas, utteranceOwners)}</PersonaMessage></div>}</Fragment>; })}
        {eventsBefore(session.transcript.length, session).map((event, i) => event.role === "founder" ? <UserMessage key={`tail-${i}`}>{event.content}</UserMessage> : <p key={`tail-${i}`} className="self-center rounded-full bg-bubble px-4 py-2 text-center text-xs leading-relaxed text-ink-3">{event.content}</p>)}
        {inProgress && <div role="status" className="rounded-card bg-bubble px-4 py-3 text-sm text-ink-3">{operation === "suggestions" ? "이 아이디어와 페르소나에 맞는 질문을 추천하고 있어요." : operation === "finish" ? "대화를 리포트로 정리하고 있어요." : session.status === "PRE" ? "각자 첫 답변을 준비하고 있어요." : "각자의 답과 서로의 조건을 비교하며 대화하고 있어요."}</div>}
        {inProgress && pendingSpeaker && session.status !== "PRE" && operation !== "finish" && <TypingMessage name={pendingSpeaker.name} color={pendingSpeaker.color}/>}
        {(error || session.error || readError) && <div role="alert" className="rounded-card bg-conflict-bg p-4 text-sm leading-relaxed text-conflict-fg"><p>진행하지 못했습니다: {error || session.error || readError}</p><p className="mt-2">완료된 발언은 저장되어 있어요. 같은 메시지를 재개하면 중단된 지점부터 이어갑니다.</p>{retry && recoverableMessage && <button type="button" onClick={() => void send(retry.question, retry.persona_id, true)} disabled={inProgress} className={`${SECONDARY} mt-3`}>중단된 메시지 재개</button>}{session.dialogue_runtime.report_snapshot && !session.dialogue_runtime.report_snapshot.done && <button type="button" onClick={() => void finish()} disabled={inProgress} className={`${SECONDARY} mt-3`}>리포트 생성 재개</button>}</div>}

      </div>
    </div>
    <div className="flex shrink-0 justify-center border-t border-line bg-alt px-5 pt-3 pb-5"><div className="flex w-full max-w-[880px] flex-col gap-2"><div className="flex flex-wrap items-center gap-3">{questions.length ? <QuestionChips questions={questions} onPick={question => { setDraft(question); setTargetId(""); }} onMore={() => setQuestionAt(value => value + 2)}/> : <button type="button" disabled={inProgress} onClick={() => void suggestions()} className={SECONDARY}>질문 추천받기</button>}<label className="ml-auto flex items-center gap-2 text-xs text-muted">질문할 대상<select value={targetId} disabled={inProgress || unfinished || reportPending} onChange={event => setTargetId(event.target.value)} className="h-9 rounded-[9px] border border-input-border bg-base px-2 text-ink-2"><option value="">모두 · 상호 대화</option>{personas.map(p => <option key={p.id} value={p.id}>{p.name} · 지정 답변</option>)}</select></label></div><ChatComposer value={draft} onChange={setDraft} onSend={() => void send(draft)} sending={inProgress || unfinished || reportPending} placeholder="궁금한 점을 물어보세요. 같은 입력칸에서 계속 대화할 수 있어요."/><span className="self-end text-xs text-muted">{draft.length} / 500자</span></div></div>
    {dmPersona && <DmPanel persona={dmPersona} session={session} sending={inProgress} onSend={question => void send(question, dmPersona.id)} onClose={() => setDmId(null)}/>}
  </>;
}
