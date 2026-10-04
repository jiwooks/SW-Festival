"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageFooterBar } from "@/components/PageFooterBar";
import { TargetEditor, loadCustomTargets, saveCustomTargets } from "@/components/TargetEditor";
import { known, runSessionAction, type Target } from "@/lib/soul-api";
import { useSoulSession } from "@/lib/use-soul-session";
const SECONDARY = "inline-flex h-11 shrink-0 items-center justify-center rounded-btn border border-btn-border bg-base px-4 text-sm text-ink-2 disabled:opacity-50";

export function TargetsClient() {
  const router = useRouter();
  const { session, loading, error: readError } = useSoulSession();
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [custom, setCustom] = useState<Target[]>([]);
  const [editing, setEditing] = useState<Target | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef<string | null>(null);
  useEffect(() => {
    if (!session || initialized.current === session.id) return;
    initialized.current = session.id;
    setCustom(loadCustomTargets(session.id));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore this session's external browser selection once; this is not derived state.
    try { const saved = JSON.parse(localStorage.getItem(`soul.qwen.target-selection.v1:${session.id}`) ?? "[]"); if (Array.isArray(saved)) setPickedIds(saved.filter((id): id is string => typeof id === "string").slice(0, 3)); } catch {}
  }, [session]);
  if (loading) return <main className="p-20 text-ink-3" role="status">저장한 아이디어와 타깃 후보를 불러오고 있어요.</main>;
  if (!session) return <main className="flex grow flex-col items-center justify-center gap-4 p-20"><h1 className="text-2xl font-semibold">먼저 아이디어를 적어주세요</h1>{readError && <p role="alert" className="text-conflict-fg">{readError}</p>}<Link href="/new" className={SECONDARY}>아이디어 적기</Link></main>;
  const sessionId = session.id;
  const canEdit = session.status === "CREATED" || session.status === "SELECTED";
  const targets = [...session.targets.filter(t => !custom.some(c => c.id === t.id)), ...custom];
  const picked = targets.filter(t => pickedIds.includes(t.id));
  const maxSelected = picked.length >= 3;
  const currentCards = session.cards.length;
  function toggle(id: string) {
    const next = pickedIds.includes(id) ? pickedIds.filter(value => value !== id) : pickedIds.length < 3 ? [...pickedIds, id] : pickedIds;
    setPickedIds(next);
    try { localStorage.setItem(`soul.qwen.target-selection.v1:${sessionId}`, JSON.stringify(next)); } catch {}
  }
  async function select() {
    if (!picked.length || busy) return;
    setBusy(true); setError(null);
    try { await runSessionAction(sessionId, "select", { target_ids: picked.filter(t => !custom.some(c => c.id === t.id)).map(t => t.id), custom_targets: picked.filter(t => custom.some(c => c.id === t.id)) }); router.push("/compare"); }
    catch (err) { setError(err instanceof Error ? err.message : "페르소나를 생성하지 못했습니다."); }
    finally { setBusy(false); }
  }
  async function recommend() {
    setBusy(true); setError(null);
    try { await runSessionAction(sessionId, "targets/recommend"); setPickedIds([]); try { localStorage.removeItem(`soul.qwen.target-selection.v1:${sessionId}`); } catch {} }
    catch (err) { setError(err instanceof Error ? err.message : "추천을 받지 못했습니다."); }
    finally { setBusy(false); }
  }
  return <>
    <main className="flex grow flex-col gap-5 px-[clamp(20px,6vw,80px)] pt-[30px] pb-6">
      <section className="flex flex-wrap items-center gap-7 rounded-card border border-card bg-base px-6 py-[18px]"><h2 className="shrink-0 font-mono text-[11px] font-semibold tracking-[0.14em] text-muted">읽은 내용</h2><dl className="flex grow flex-wrap gap-7">{[{ k: "아이디어", v: session.input.q1 }, { k: "풀려는 문제", v: String(session.brief.problem ?? "UNKNOWN") }, { k: "분야", v: session.input.q5 }].map(row => <div key={row.k} className="flex min-w-40 flex-1 flex-col gap-1"><dt className="text-xs text-muted">{row.k}</dt><dd className="text-sm leading-relaxed">{known(row.v)}</dd></div>)}</dl><Link href="/new" className={SECONDARY}>새로 적기</Link></section>
      <div className="flex flex-wrap items-end gap-4"><div className="grow"><p className="font-mono text-xs tracking-[0.14em] text-muted">STEP 02</p><h1 className="mt-2 text-[28px] font-bold tracking-[-0.022em]">만나볼 이용자를 추천하고, 고릅니다</h1><p className="mt-2 text-[15px] leading-[1.7] text-ink-3">{session.targets.length}개 후보 중 1~3개를 고르세요. 선택 후 모델이 이름과 판단 조건이 있는 가상 페르소나를 만들고 검사해요.</p></div><button type="button" onClick={() => void recommend()} disabled={busy || session.status !== "CREATED" || currentCards > 0} className={SECONDARY}>다시 추천받기</button>{currentCards > 0 && <Link href="/compare" className={SECONDARY}>생성한 페르소나 보기</Link>}</div>
      {session.mode === "mock" && <p className="rounded-card border border-action-border bg-action-bg p-4 text-sm text-brand">모의 테스트 모드 · 이 추천은 실제 Qwen의 생성 결과가 아닙니다.</p>}{!canEdit && <p className="rounded-card bg-bubble p-4 text-sm text-ink-3">이미 대화를 시작한 페르소나는 유지해요. 다른 이용자와 이야기하려면 새 아이디어로 시작하세요.</p>}
      {(error || readError) && <div role="alert" className="rounded-card bg-conflict-bg p-4 text-sm text-conflict-fg">{error || readError}</div>}
      {busy && <p role="status" className="rounded-card border border-action-border bg-action-bg p-4 text-sm text-brand">모델이 처리하고 있어요. 생성·검사가 완료될 때까지 이 화면을 열어 주세요.</p>}
      <ul className="grid grid-cols-1 gap-[18px] md:grid-cols-2 xl:grid-cols-3">{targets.map(t => <li key={t.id} className="flex"><article className={`flex grow flex-col gap-3.5 rounded-card border-2 bg-base px-5 py-[18px] ${pickedIds.includes(t.id) ? "border-brand" : "border-card"}`}><header><h3 className="text-base font-semibold leading-relaxed">{t.segment_name}</h3><p className="mt-1 text-xs text-muted">{custom.some(c => c.id === t.id) ? "직접 입력·수정한 후보" : "추천 후보"} · L{t.evidence_level} 근거</p></header><p className="text-sm leading-[1.75] text-ink-2">{known(t.problem_exposure)}</p><hr className="border-divider"/><dl className="flex flex-col gap-3 text-sm"><div><dt className="text-xs text-muted">현재 대안</dt><dd className="mt-1 leading-relaxed">{known(t.expected_current_alternative)}</dd></div><div><dt className="text-xs text-muted">추천 이유</dt><dd className="mt-1 leading-relaxed">{t.why_relevant}</dd></div><div><dt className="text-xs text-muted">확인할 점</dt><dd className="mt-1 leading-relaxed">{t.critical_unknowns.length ? t.critical_unknowns.join(" · ") : "실제 고객 인터뷰에서 이 조건을 확인해요."}</dd></div></dl><div className="mt-auto flex gap-2 pt-1"><button type="button" onClick={() => setEditing(t)} disabled={busy || !canEdit} className={`${SECONDARY} grow`}>고치기</button><button type="button" onClick={() => toggle(t.id)} disabled={busy || !canEdit || (maxSelected && !pickedIds.includes(t.id))} aria-pressed={pickedIds.includes(t.id)} className={`h-11 grow rounded-btn px-4 text-sm disabled:opacity-50 ${pickedIds.includes(t.id) ? "bg-brand font-semibold text-white" : "border border-btn-border text-ink-2"}`}>{pickedIds.includes(t.id) ? "선택됨" : "고르기"}</button></div></article></li>)}{canEdit && <li className="flex"><div className="flex grow flex-col items-center justify-center gap-3 rounded-card border border-dashed border-btn-border bg-panel p-6"><h3 className="text-[15px] font-semibold">직접 만들기</h3><p className="text-center text-[13px] leading-[1.7] text-ink-3">직접 만나보고 싶은 이용자 유형과 상황을 적어주세요. 이름과 경험을 임의로 채우지 않아요.</p><Link href="/targets/new" className={SECONDARY}>만들러 가기</Link></div></li>}</ul>
    </main>
    <PageFooterBar title={picked.length ? `${picked.length}개 후보를 골랐어요` : "아직 고른 이용자가 없어요"} description={busy ? "페르소나별 생성·검사를 진행 중입니다." : "최대 3개까지 고를 수 있어요. 무조건 다른 의견을 만들지는 않아요."}><button type="button" onClick={() => void select()} disabled={!picked.length || busy || !canEdit} className="h-12 shrink-0 rounded-btn bg-brand px-[26px] text-[15px] font-semibold text-white disabled:bg-bubble disabled:text-muted">{busy ? "생성·검사 중…" : "선택한 이용자로 페르소나 만들기"}</button></PageFooterBar>
    {editing && <div className="fixed inset-0 z-40 flex items-center justify-center bg-dark-bg/40 p-6"><section role="dialog" aria-modal="true" aria-labelledby="edit-target-title" className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-card bg-base p-6"><h2 id="edit-target-title" className="mb-5 text-xl font-semibold">이용자 후보 고치기</h2><TargetEditor key={editing.id} initial={editing} onCancel={() => setEditing(null)} onSave={target => { const next = [...custom.filter(t => t.id !== target.id), target]; try { saveCustomTargets(sessionId, next); setCustom(next); setEditing(null); } catch { setError("브라우저 저장이 막혀 후보 수정을 저장하지 못했습니다."); } }}/></section></div>}
  </>;
}
