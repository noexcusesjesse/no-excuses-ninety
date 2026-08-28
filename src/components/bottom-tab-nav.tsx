"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, TrendingUp, CalendarDays, MessageCircle } from "lucide-react";

const TABS = [
  { href: "/client", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/client/log", label: "Log", icon: FileText, exact: false },
  { href: "/client/progress", label: "Progress", icon: TrendingUp, exact: false },
  { href: "/client/month", label: "Month", icon: CalendarDays, exact: false },
  { href: "/client/coach", label: "Coach", icon: MessageCircle, exact: false },
] as const;

export function BottomTabNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-lg"
      aria-label="Client house"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-2 sm:px-4">
        {TABS.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="font-mono text-[9px] uppercase tracking-wide">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
