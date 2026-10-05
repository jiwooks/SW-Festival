"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { known, type IdeaInput } from "@/lib/soul-api";
export function IdeaSummary({ input, compact = false }: { input: IdeaInput; compact?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState(false);
  function edit() {
    try { localStorage.setItem("soul.idea.draft.v2", JSON.stringify(input)); router.push("/new"); }
    catch { setError(true); }
  }
  return <section className="rounded-card border border-card bg-base px-6 py-[18px]" aria-label="작성한 아이디어">
    <div className="flex items-center gap-4"><div className="min-w-0 grow"><p className="mb-1 text-xs text-muted">내 아이디어</p><p className="text-sm font-medium leading-relaxed">{known(input.q1)}</p></div><button type="button" onClick={edit} className="h-10 shrink-0 rounded-btn border border-btn-border px-4 text-sm text-ink-2">고치기</button></div>
    {compact ? <details className="mt-3 text-sm"><summary className="cursor-pointer text-xs text-muted">아이디어 자세히 보기</summary><p className="mt-2 whitespace-pre-wrap leading-relaxed">{known(input.q3_1)}</p></details> : <dl className="mt-3 flex flex-wrap gap-5 text-sm"><div className="min-w-40 flex-1"><dt className="text-xs text-muted">문제와 해결 방법</dt><dd className="mt-1 leading-relaxed">{known(input.q3_1)}</dd></div><div><dt className="text-xs text-muted">분야</dt><dd className="mt-1">{input.q5}</dd></div></dl>}
    {error && <p role="alert" className="mt-2 text-sm text-conflict-fg">브라우저에서 아이디어를 저장하지 못했습니다. 저장 설정을 확인해 주세요.</p>}
  </section>;
}
