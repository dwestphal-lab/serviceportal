import type { Metadata } from "next";
import { TanssApiTester } from "@/modules/tanss-tester/TanssApiTester";

export const metadata: Metadata = { title: "TANSS API-Tester" };

export default function TanssTesterPage() {
  return <TanssApiTester />;
}
