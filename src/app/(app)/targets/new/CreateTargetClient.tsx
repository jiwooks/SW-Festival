"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TargetEditor, loadCustomTargets, saveCustomTargets } from "@/components/TargetEditor";
import { useSoulSession } from "@/lib/use-soul-session";
export function CreateTargetClient() {
  const router = useRouter();
  const { session, loading, error: readError } = useSoulSession();
  const [error, setError] = useState<string | null>(null);
  return <main className="flex grow flex-col gap-5 px-[clamp(20px,6vw,80px)] py-8"><div><p className="font-mono text-xs tracking-widest text-muted">STEP 02</p><h1 className="mt-2 text-[28px] font-bold">직접 만나볼 이용자 만들기</h1><p className="mt-2 text-sm leading-relaxed text-ink-3">이용자 유형과 관련된 상황을 입력하세요. 목록에서 선택하면 Qwen의 적합성 검사와 페르소나 생성을 진행합니다.</p></div>{loading ? <p role="status">아이디어를 불러오는 중…</p> : session && (session.status === "CREATED" || session.status === "SELECTED") ? <section className="w-full max-w-3xl rounded-card border border-card bg-base p-7"><TargetEditor onCancel={() => router.push("/targets")} onSave={target => { try { saveCustomTargets(session.id, [...loadCustomTargets(session.id), target]); router.push("/targets"); } catch { setError("브라우저 저장이 막혀 후보를 저장하지 못했습니다."); } }} /></section> : <><p>{readError || "새 아이디어를 입력한 뒤 이용자를 추가해 주세요."}</p><Link href="/new" className="text-brand">아이디어 적기</Link></>}{error && <p role="alert" className="text-conflict-fg">{error}</p>}</main>;
}
