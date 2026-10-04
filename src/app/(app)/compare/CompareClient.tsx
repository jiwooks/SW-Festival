"use client";
import Link from "next/link";
import { useState } from "react";
import { Chip } from "@/components/Chip";
import { PersonaAvatar } from "@/components/PersonaAvatar";
import { known, sessionAction, type PersonaCard } from "@/lib/soul-api";
import { useSoulSession } from "@/lib/use-soul-session";
import type { PersonaColor } from "@/lib/types";
const SECONDARY = "inline-flex h-11 shrink-0 items-center justify-center rounded-btn border border-btn-border bg-base px-4 text-sm text-ink-2";
export function CompareClient() {
  const { session, loading, error: readError } = useSoulSession();
  const [editing, setEditing] = useState<PersonaCard | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (loading) return <main className="p-20 text-ink-3" role="status">페르소나와 검사 결과를 불러오고 있어요.</main>;
  if (!session?.cards.length) return <main className="flex grow flex-col items-center justify-center gap-4 p-20"><h1 className="text-2xl font-semibold">먼저 이용자를 고르고 페르소나를 만들어 주세요</h1>{readError && <p role="alert">{readError}</p>}<Link href="/targets" className={SECONDARY}>이용자 고르기</Link></main>;
  const sessionId = session.id;
  const canEdit = session.status === "SELECTED";
  const cards = session.cards;
  const rows: { label: string; render: (card: PersonaCard) => React.ReactNode; highlight?: boolean }[] = [
    { label: "요즘 상황", render: c => known(c.immutable_core.identity_context.use_context) },
    { label: "현재 대안", render: c => known(c.immutable_core.problem_context.current_alternative) },
    { label: "문제의 정도", render: c => known(c.immutable_core.problem_context.problem_severity) },
    { label: "바라는 결과", render: c => known(c.immutable_core.goals_motivations.desired_outcome) },
    { label: "판단 기준", render: c => c.immutable_core.decision_model.decision_criteria.length ? <div className="flex flex-wrap gap-1.5">{c.immutable_core.decision_model.decision_criteria.map((criterion, index) => <Chip key={index}>{criterion}</Chip>)}</div> : known(null) },
    { label: "도입 장벽", render: c => known(c.immutable_core.decision_model.adoption_barrier) },
    { label: "전환 비용", render: c => known(c.immutable_core.decision_model.switching_cost) },
    { label: "예산 조건", render: c => known(c.immutable_core.decision_model.budget_constraint) },
    { label: "선택의 논리", highlight: true, render: c => c.immutable_core.reasoning_rules.length ? c.immutable_core.reasoning_rules.map(rule => <div key={rule.id} className="mb-3 last:mb-0"><p className="font-medium">{rule.trigger}</p><p className="mt-1">{rule.value} · {rule.tradeoff}</p><p className="mt-1">{rule.conditional_choice}</p><p className="mt-1 text-xs text-muted">추론한 판단 조건 · 실제 경험 확인 전</p></div>) : known(null) },
    { label: "근거", render: c => c.immutable_core.evidence_anchors.length ? c.immutable_core.evidence_anchors.map((anchor, index) => <p key={index}>L{anchor.level} · {anchor.source_id}: <q>{anchor.quote}</q></p>) : "L0 · 아이디어와 모델의 사전 지식에서 추론한 가설이에요." },
  ];
  async function save() {
    if (!editing || !name.trim() || busy) return;
    setBusy(true); setError(null);
    try {
      if (editing.presentation.display_name !== name.trim()) await sessionAction(sessionId, `names/${editing.id}`, { display_name: name.trim() });
      await sessionAction(sessionId, `cards/${editing.id}`, { ...editing, presentation: { ...editing.presentation, display_name: name.trim() } });
      setEditing(null);
    } catch (err) { setError(err instanceof Error ? err.message : "페르소나 검사에 실패했습니다."); }
    finally { setBusy(false); }
  }
  return <>
    <main className="flex grow flex-col gap-[18px] px-[clamp(20px,5vw,70px)] pt-[30px] pb-6"><div className="flex flex-wrap items-end gap-4"><div className="grow"><p className="font-mono text-xs tracking-[0.14em] text-muted">STEP 03</p><h1 className="mt-2 text-[28px] font-bold tracking-[-0.022em]">고른 {cards.length}명, 한눈에 보기</h1><p className="mt-2 text-[15px] leading-[1.7] text-ink-3">각자가 현재 쓰는 대안과 판단 조건을 나란히 볼 수 있어요. 모르는 정보는 채우지 않았어요.</p></div><p className="rounded-[9px] bg-bubble px-3 py-2 text-xs text-ink-3">{session.mode === "mock" ? "모의 테스트 데이터 · 실제 Qwen 결과가 아닙니다" : "Qwen이 만든 가상 인물 · 실제 고객이 아닙니다"}</p></div>
      {(error || readError) && <div role="alert" className="rounded-card bg-conflict-bg p-4 text-sm text-conflict-fg">{error || readError}</div>}
      <p className="rounded-[14px] bg-bubble px-5 py-4 text-sm leading-relaxed text-ink-2">생성한 페르소나는 카드의 조건에 근거해 답해요. 의견 차이는 실제 대화에서 확인하며, 동의·반대를 미리 정하지 않아요.</p>
      <div className="overflow-x-auto rounded-card border border-card bg-base"><table className="w-full min-w-[760px] table-fixed border-collapse"><thead><tr><th className="w-[118px] bg-th p-4"/><>{cards.map((card, index) => <th key={card.id} className="border-l border-divider px-[18px] py-4 text-left align-top"><div className="flex items-start gap-[11px]"><PersonaAvatar name={card.presentation.display_name} color={(index + 1) as PersonaColor} size="lg"/><div className="min-w-0 grow"><p className="text-base font-semibold">{card.presentation.display_name}</p><p className="mt-1 text-xs font-normal leading-relaxed text-muted">{card.immutable_core.identity_context.segment}</p></div>{canEdit && <button type="button" onClick={() => { setEditing(card); setName(card.presentation.display_name); setError(null); }} className="h-9 rounded-[10px] border border-btn-border px-2 text-xs font-normal">고치기</button>}</div></th>)}</></tr></thead><tbody>{rows.map(row => <tr key={row.label} className="border-t border-divider"><th scope="row" className={`w-[118px] p-4 text-left align-top font-mono text-[11px] font-medium ${row.highlight ? "bg-action-bg text-brand" : "bg-th text-ink-3"}`}>{row.label}</th>{cards.map(card => <td key={card.id} className={`border-l border-divider px-[18px] py-4 align-top text-sm leading-[1.8] ${row.highlight ? "bg-hl" : "text-ink-2"}`}>{row.render(card)}</td>)}</tr>)}</tbody></table></div>
      <details className="rounded-card border border-card bg-base p-5"><summary className="cursor-pointer text-sm font-medium">페르소나 검사 결과</summary><div className="mt-3 flex flex-col gap-3">{session.validations.map((validation, index) => <div key={index} className="text-sm leading-relaxed"><strong>{cards[index]?.presentation.display_name}</strong><p>{validation.issues.length ? validation.issues.map(issue => issue.detail).join(" · ") : "필수 검사 통과"}</p>{validation.advisory.map((advice, i) => <p key={i} className="text-muted">참고: {advice.detail}</p>)}</div>)}</div></details>
    </main><footer className="flex shrink-0 flex-wrap items-center gap-3 border-t border-line bg-base px-[clamp(20px,5vw,70px)] py-5"><Link href="/targets" className={SECONDARY}>이용자 목록 보기</Link><p className="grow text-sm text-muted">채팅창에서 질문하면 각자가 답하고 서로의 조건을 비교해요.</p><Link href="/chat" className="inline-flex h-12 shrink-0 items-center rounded-btn bg-brand px-[26px] text-[15px] font-semibold text-white">대화 시작하기</Link></footer>
    {editing && <div className="fixed inset-0 z-40 flex items-center justify-center bg-dark-bg/40 p-6"><section role="dialog" aria-modal="true" aria-labelledby="edit-persona-title" className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-card bg-base p-6"><h2 id="edit-persona-title" className="mb-5 text-xl font-semibold">페르소나 정보 고치기</h2><form className="flex flex-col gap-4" onSubmit={event => { event.preventDefault(); void save(); }}><label className="text-sm">표시 이름<input value={name} onChange={event => setName(event.target.value)} maxLength={24} required className="mt-1 h-11 w-full rounded-[11px] border border-input-border bg-input px-3.5"/><span className="mt-1 block text-right text-xs text-muted">{name.length} / 24자</span></label>{[{ label: "요즘 상황", block: "identity_context", field: "use_context" }, { label: "현재 대안", block: "problem_context", field: "current_alternative" }, { label: "도입 장벽", block: "decision_model", field: "adoption_barrier" }].map(row => <label key={row.field} className="text-sm">{row.label}<textarea rows={3} value={String((editing.immutable_core[row.block as "identity_context"] as Record<string, unknown>)[row.field]) === "UNKNOWN" ? "" : String((editing.immutable_core[row.block as "identity_context"] as Record<string, unknown>)[row.field])} maxLength={300} onChange={event => setEditing(previous => previous ? { ...previous, immutable_core: { ...previous.immutable_core, [row.block]: { ...previous.immutable_core[row.block as "identity_context"], [row.field]: event.target.value || "UNKNOWN" } } } : null)} className="mt-1 w-full rounded-[11px] border border-input-border bg-input px-3.5 py-3"/></label>)}<p className="text-sm leading-relaxed text-ink-3">수정한 조건은 별도 Qwen 검사로 모순·근거 없는 경험을 확인해요. 검사 실패 시 원래 조건을 유지합니다.</p>{error && <p role="alert" className="text-sm text-conflict-fg">{error}</p>}<div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} disabled={busy} className={SECONDARY}>취소</button><button type="submit" disabled={busy} className="h-11 rounded-btn bg-brand px-5 text-sm font-semibold text-white">{busy ? "검사 중…" : "검사 후 저장"}</button></div></form></section></div>}
  </>;
}
