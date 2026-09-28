import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { TargetSelection } from "./TargetSelection";

export const metadata: Metadata = { title: "타깃 설정" };

/** 시안: design/screens/02-targets.html */
export default function Page() {
  return (
    <>
      <AppHeader current="02" />
      <TargetSelection />
    </>
  );
}
