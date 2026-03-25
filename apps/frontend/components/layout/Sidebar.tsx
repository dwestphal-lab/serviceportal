"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  ChevronRight,
  LogOut,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { MODULE_NAVIGATION } from "@/lib/module-registry";

// ── Navigation Items ──────────────────────────────────────────────────────────
const coreNavigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
];


interface SidebarProps {
  userModules?: string[];
  isAdmin?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Sidebar({ userModules = [], isAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const visibleModules = MODULE_NAVIGATION.filter((m) =>
    userModules.includes(m.id)
  );

  async function handleLogout() {
    await fetch("http://localhost:3001/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-[#0a322d] text-white shrink-0">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-white/10">
        <Logo variant="light" className="h-6 w-auto" />
      </div>

      {/* Core Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {coreNavigation.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-[#5afff5]/15 text-[#5afff5] border border-[#5afff5]/20"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="flex-1">{item.name}</span>
              {isActive && <ChevronRight className="w-4 h-4 opacity-60" />}
            </Link>
          );
        })}

        {/* Module Section */}
        {visibleModules.length > 0 && (
          <div className="pt-4">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-white/30 mb-2">
              Module
            </p>
            {visibleModules.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <div key={item.id}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-[#5afff5]/15 text-[#5afff5] border border-[#5afff5]/20"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="flex-1">{item.name}</span>
                    {isActive && <ChevronRight className="w-4 h-4 opacity-60" />}
                  </Link>
                  {item.children && pathname.startsWith(item.href) && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "block px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
                            pathname === child.href
                              ? "text-[#5afff5]"
                              : "text-white/50 hover:text-white/80"
                          )}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <div className="pt-4">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-white/30 mb-2">
              Administration
            </p>
            {[
              { href: "/dashboard/settings/systems", icon: Settings,      label: "Einstellungen",   match: "/dashboard/settings" },
              { href: "/admin/berechtigungen",        icon: ShieldCheck,   label: "Berechtigungen",  match: "/admin/berechtigungen" },
              { href: "/tanss-tester",                icon: FlaskConical,  label: "TANSS API-Tester", match: "/tanss-tester" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  pathname.startsWith(item.match)
                    ? "bg-[#5afff5]/15 text-[#5afff5] border border-[#5afff5]/20"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="flex-1">{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/5 hover:text-white transition-all duration-150"
        >
          <LogOut className="w-5 h-5" />
          <span>Abmelden</span>
        </button>
        <div className="px-3 py-2">
          <p className="text-xs text-white/25">PLENIUM v0.1.0</p>
        </div>
      </div>
    </aside>
  );
}
