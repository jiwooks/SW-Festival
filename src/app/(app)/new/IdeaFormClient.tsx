"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { api, createSession, DEFAULT_LIMITS, type Evidence, type IdeaInput, type InputLimits } from "@/lib/soul-api";

export const DRAFT_KEY = "soul.idea.draft.v2";
const EMPTY: IdeaInput = { q1: "", q2: "", q3_1: "", q3_2: "", q4_1: "", q5: "IT", evidence: [] };
const FIELDS = ["IT", "교육", "금융", "운영관리", "네트워킹", "농업/축산업", "라이프스타일", "모빌리티", "마케팅/PR", "미디어/엔터테인먼트", "바이오/의료", "에너지/자원", "유통/물류", "임팩트", "재무", "프롭테크", "하드웨어", "기타", "패션", "F&B", "뷰티", "생활"];
const CARD = "flex flex-col gap-[18px] rounded-card border border-card bg-base px-[26px] py-6";
const AREA = "w-full rounded-[11px] border border-input-border bg-input px-3.5 py-3 text-[15px] leading-[1.7]";
const INPUT = "h-11 w-full rounded-[11px] border border-input-border bg-input px-3.5 text-[15px]";
const SECONDARY = "h-11 rounded-btn border border-btn-border bg-base px-4 text-sm text-ink-2";
type TextField = "q1" | "q2" | "q3_1" | "q3_2" | "q4_1";

export function IdeaFormClient() {
  const router = useRouter();
  const [draft, setDraft] = useState<IdeaInput>(EMPTY);
  const [limits, setLimits] = useState(DEFAULT_LIMITS);
  const [categories, setCategories] = useState(FIELDS);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const loaded = useRef(false);
  useEffect(() => {
    try {
      const current = localStorage.getItem(DRAFT_KEY);
      const old = localStorage.getItem("soul.idea.draft");
      if (current) {
        const parsed = JSON.parse(current);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore a versioned external browser draft once.
        setDraft({ ...EMPTY, ...parsed, evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [] });
      } else if (old) {
        const parsed = JSON.parse(old);
        setDraft({ ...EMPTY, q1: parsed.oneLiner ?? "", q2: parsed.background ?? "", q3_1: [parsed.description, parsed.problemAndDiff].filter(Boolean).join("\n"), q3_2: parsed.revenueModel ?? "", q4_1: parsed.executionPlan ?? "", q5: parsed.field ?? "IT" });
      }
    } catch { /* A blocked storage API does not prevent writing a new idea. */ }
    loaded.current = true;
    void api<InputLimits>("/limits").then(setLimits).catch(() => {});
    void api<string[]>("/categories").then(setCategories).catch(() => {});
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    const timer = setTimeout(() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); setSavedAt(Date.now()); } catch {} }, 500);
    return () => clearTimeout(timer);
  }, [draft]);
  const set = (key: TextField) => (value: string) => setDraft(previous => ({ ...previous, [key]: value }));
  const evidenceTotal = draft.evidence.reduce((sum, item) => sum + item.text.length, 0);
  const withinLimits = (["q1", "q2", "q3_1", "q3_2", "q4_1"] as TextField[]).every(key => draft[key].length <= limits[key]);
  const ready = !!draft.q1.trim() && categories.includes(draft.q5) && withinLimits && evidenceTotal <= limits.evidence_total && draft.evidence.every(e => !!e.text.trim() && !!e.source_id.trim() && e.text.length <= limits.evidence_text);
  async function submit() {
    if (!ready || busy) return;
    setBusy(true); setError(null);
    try { await createSession(draft); router.push("/targets"); }
    catch (err) { setError(err instanceof Error ? err.message : "타깃 추천을 받지 못했습니다."); }
    finally { setBusy(false); }
  }
  function updateEvidence(index: number, update: Partial<Evidence>) { setDraft(previous => ({ ...previous, evidence: previous.evidence.map((e, i) => i === index ? { ...e, ...update } : e) })); }
  function field(key: TextField, label: string, rows = 3) {
    return <div className="flex min-w-[220px] grow basis-0 flex-col gap-[7px]"><label htmlFor={key} className="text-sm font-medium text-ink-2">{label}{key === "q1" && <span className="ml-1 text-conflict-fg">*</span>}</label>{key === "q1" ? <input id={key} value={draft[key]} onChange={event => set(key)(event.target.value)} maxLength={limits[key]} className={INPUT} /> : <textarea id={key} rows={rows} value={draft[key]} onChange={event => set(key)(event.target.value)} maxLength={limits[key]} className={AREA} />}<span className={`self-end text-xs ${draft[key].length > limits[key] ? "text-conflict-fg" : "text-muted"}`}>{draft[key].length} / {limits[key]}자</span></div>;
  }
  return <>
    <AppHeader current="01" right={savedAt ? <p className="text-[13px] text-muted">이 브라우저에 초안 저장됨</p> : undefined} />
    <main className="flex grow flex-col gap-5 px-[clamp(20px,8vw,120px)] py-[34px]">
      <div className="flex flex-col gap-2"><p className="font-mono text-xs tracking-[0.14em] text-muted">STEP 01</p><h1 className="text-[30px] font-bold leading-[1.36] tracking-[-0.022em]">아이디어를 문장으로 적습니다</h1><p className="text-[15px] leading-[1.7] text-ink-3">작성한 내용을 읽고 관련 있는 이용자 후보를 추천해요. 없는 정보는 모르는 상태로 남깁니다.</p></div>
      <section className={CARD}><h2 className="font-mono text-[11px] font-semibold tracking-[0.14em] text-brand">기본</h2>{field("q1", "Q1. 나의 아이디어를 한 줄로 소개해주세요.")}{field("q2", "Q2. 아이디어를 떠올린 배경 이야기를 들려주세요.")}<div className="flex flex-col gap-[7px]"><label htmlFor="q5" className="text-sm font-medium text-ink-2">Q5. 사업 분야를 선택해주세요. <span className="text-conflict-fg">*</span></label><select id="q5" value={draft.q5} onChange={event => setDraft(previous => ({ ...previous, q5: event.target.value }))} className={INPUT}>{categories.map(category => <option key={category}>{category}</option>)}</select></div></section>
      <section className={CARD}><h2 className="text-base font-semibold">Q3. 어떤 아이디어인가요?</h2><div className="flex flex-wrap gap-4">{field("q3_1", "Q3-1. 기존 제품 및 서비스 대비 차별점과 어떤 문제를 해결할 수 있나요?", 4)}{field("q3_2", "Q3-2. 어떻게 수익을 창출할 계획인가요?", 4)}</div></section>
      <section className={CARD}><h2 className="text-base font-semibold">Q4. 어떻게 실현하고 싶으신가요?</h2>{field("q4_1", "Q4-1. 아이디어를 어떻게 사업화하실 계획인가요?", 3)}</section>
      <section className={CARD}><div className="flex items-center gap-4"><div className="grow"><h2 className="text-base font-semibold">가진 자료 · 선택</h2><p className="mt-1 text-sm text-ink-3">원문의 관련 부분을 붙여 넣으면 근거와 가설을 구분해요. 개인정보는 지워 주세요.</p></div><button type="button" onClick={() => setShowEvidence(v => !v)} className={SECONDARY} aria-expanded={showEvidence}>{showEvidence ? "자료 접기" : "자료 추가"}</button></div>
        {showEvidence && <div className="flex flex-col gap-4">{draft.evidence.map((e, index) => <div key={index} className="flex flex-col gap-2 rounded-[12px] border border-divider p-4"><div className="flex flex-wrap items-center gap-3"><label className="flex grow items-center gap-2 text-sm">자료 이름<input value={e.source_id} maxLength={80} onChange={event => updateEvidence(index, { source_id: event.target.value })} className={INPUT} /></label><select aria-label={`자료 ${index + 1} 근거 수준`} value={e.level} onChange={event => updateEvidence(index, { level: Number(event.target.value) as Evidence["level"] })} className={`${INPUT} max-w-64`}><option value={1}>L1 공개 시장 자료</option><option value={2}>L2 직접 제공한 고객·시장 자료</option><option value={3}>L3 실제 인터뷰 원문</option><option value={4}>L4 실제 행동 데이터</option></select><button type="button" className={SECONDARY} onClick={() => setDraft(previous => ({ ...previous, evidence: previous.evidence.filter((_, i) => i !== index) }))}>삭제</button></div><textarea aria-label={`자료 ${index + 1} 원문 발췌`} rows={4} value={e.text} maxLength={limits.evidence_text} onChange={event => updateEvidence(index, { text: event.target.value })} className={AREA} /><p className="self-end text-xs text-muted">{e.text.length} / {limits.evidence_text}자</p><label className="text-sm text-ink-3">사용 허가·수집 맥락<input value={e.consent_note === "UNKNOWN" ? "" : e.consent_note} onChange={event => updateEvidence(index, { consent_note: event.target.value || "UNKNOWN" })} maxLength={500} className={`${INPUT} mt-1`} /></label></div>)}<div className="flex items-center gap-3"><button type="button" disabled={draft.evidence.length >= limits.evidence_count} onClick={() => setDraft(previous => ({ ...previous, evidence: [...previous.evidence, { source_id: `source-${Date.now()}`, text: "", level: 2, consent_note: "UNKNOWN" }] }))} className={SECONDARY}>원문 발췌 추가</button><span className="text-xs text-muted">{draft.evidence.length} / {limits.evidence_count}개 · 총 {evidenceTotal} / {limits.evidence_total}자</span></div></div>}
      </section>
      {error && <div role="alert" className="rounded-card bg-conflict-bg p-4 text-sm leading-relaxed text-conflict-fg">진행하지 못했습니다: {error}</div>}
      <div className="mt-auto flex flex-wrap items-center gap-4 pt-2"><p role="status" className="grow text-sm text-muted">{busy ? "모델이 타깃을 추천하고 적합성을 검사하고 있어요. 완료까지 이 화면을 열어 주세요." : "Q1과 사업 분야를 채우면 시작할 수 있어요. 설명이 구체적일수록 도움이 됩니다."}</p><button type="button" onClick={() => void submit()} disabled={!ready || busy} className="h-12 shrink-0 rounded-btn bg-brand px-[26px] text-[15px] font-semibold text-white disabled:bg-bubble disabled:text-muted">{busy ? "타깃 추천 중…" : "타깃 추천받기"}</button></div>
    </main>
  </>;
}
