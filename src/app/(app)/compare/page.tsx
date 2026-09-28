import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";

export const metadata: Metadata = { title: "한눈에 보기" };

/** TODO: design/screens/03-compare.html 를 컴포넌트로 옮긴다. */
export default function Page() {
  return (
    <>
      <AppHeader current="03" />
      <main className="grow px-20 py-9">
        <p className="font-mono text-xs font-medium tracking-[0.14em] text-muted">
          STEP 03
        </p>
        <h1 className="mt-2 text-[28px] font-bold leading-[1.38] tracking-[-0.022em]">
          고른 세 명, 한눈에 보기
        </h1>
        <p className="mt-4 text-sm text-ink-3">
          시안: <code className="font-mono">design/screens/03-compare.html</code>
        </p>
      </main>
    </>
  );
}
