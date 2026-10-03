import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { CreateTargetClient } from "./CreateTargetClient";

export const metadata: Metadata = { title: "타깃 직접 만들기" };

/** 시안: design/screens/02-1-create-target.html — ?edit=<id> 면 02 카드의 "고치기" (같은 폼에 그 사람 내용이 채워진다) */
export default async function Page({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  return (
    <>
      <AppHeader current="02" />
      <CreateTargetClient editId={edit} />
    </>
  );
}
