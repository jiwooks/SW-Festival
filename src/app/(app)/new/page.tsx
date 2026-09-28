import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";

export const metadata: Metadata = { title: "아이디어 입력" };

/** TODO: design/screens/01-idea-input.html 를 컴포넌트로 옮긴다. */
export default function Page() {
  return (
    <>
      <AppHeader current="01" />
      <main className="grow px-20 py-9">
        <p className="font-mono text-xs font-medium tracking-[0.14em] text-muted">
          STEP 01
        </p>
        <h1 className="mt-2 text-[28px] font-bold leading-[1.38] tracking-[-0.022em]">
          아이디어를 문장으로 적습니다
        </h1>
        <p className="mt-4 text-sm text-ink-3">
          시안: <code className="font-mono">design/screens/01-idea-input.html</code>
        </p>
      </main>
    </>
  );
}
