import type { Metadata } from "next";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { getSession } from "@/lib/auth";
import { getUserModules } from "@/lib/server-api";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "TANSS API-Tester" };

export default async function TanssTesterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.isAdmin) redirect("/dashboard");

  const userModules = await getUserModules();

  return (
    <div className="flex min-h-screen bg-[#e7e2d3]">
      <Sidebar isAdmin={session.isAdmin} userModules={userModules} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header
          title="TANSS API-Tester"
          username={session.username}
          displayName={session.displayName}
        />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
