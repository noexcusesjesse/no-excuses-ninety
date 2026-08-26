"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, TrendingUp, CalendarDays, MessageCircle } from "lucide-react";

const TABS = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/log", label: "Log", icon: FileText },
  { href: "/app/progress", label: "Progress", icon: TrendingUp },
  { href: "/app/cycle", label: "Cycle", icon: CalendarDays },
  { href: "/app/coach", label: "Coach", icon: MessageCircle },
];

export function BottomTabNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-2 sm:px-4">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-mono text-[9px] uppercase tracking-wide">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
