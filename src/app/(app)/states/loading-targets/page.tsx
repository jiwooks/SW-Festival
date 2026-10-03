import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { LoadingTargetsClient } from "./LoadingTargetsClient";

export const metadata: Metadata = { title: "타깃 찾는 중" };

/** 시안: design/screens/07-loading-targets.html */
export default function Page() {
  return (
    <>
      <AppHeader current="02" />
      <LoadingTargetsClient />
    </>
  );
}
