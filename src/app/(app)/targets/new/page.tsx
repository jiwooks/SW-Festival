import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { CreateTargetClient } from "./CreateTargetClient";

export const metadata: Metadata = { title: "타깃 직접 만들기" };

/** 시안: design/screens/02-1-create-target.html */
export default function Page() {
  return (
    <>
      <AppHeader current="02" />
      <CreateTargetClient />
    </>
  );
}
