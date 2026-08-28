import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * No Excuses Reset Program brand logo.
 * Mirrors the canonical lockup: typographic stack on black, red bar/ribbon divider.
 * No resistance-band icon — the brand mark IS the typographic stack.
 *
 * Sizes:
 *  - sm:  24px tall (favicon-sized, just the badge)
 *  - md:  64px tall (header default)
 *  - lg:  160px tall (landing hero)
 *  - xl:  280px tall (marketing splash)
 */

interface LogoProps extends React.SVGAttributes<SVGSVGElement> {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
}

const SIZE_MAP = {
  sm: { w: 24, h: 24, showText: false },
  md: { w: 64, h: 64, showText: true },
  lg: { w: 160, h: 160, showText: true },
  xl: { w: 280, h: 280, showText: true },
} as const;

export function Logo({ size = "md", showTagline = true, className, ...props }: LogoProps) {
  const dims = SIZE_MAP[size];

  if (!dims.showText) {
    // Badge-only: red bar with NE
    return (
      <svg
        viewBox="0 0 24 24"
        width={dims.w}
        height={dims.h}
        className={cn("shrink-0", className)}
        {...props}
      >
        <rect width="24" height="24" rx="4" fill="hsl(0 84% 50%)" />
        <text
          x="12"
          y="16"
          textAnchor="middle"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="800"
          fontSize="11"
          fill="white"
          letterSpacing="-0.5"
        >
          NE
        </text>
      </svg>
    );
  }

  // Full lockup — vertical stack
  // Aspect ratio of the source logo: roughly 1:1.15 (taller than wide)
  const w = dims.w;
  const h = dims.h;

  return (
    <svg
      viewBox="0 0 320 360"
      width={w}
      height={h}
      className={cn("shrink-0", className)}
      role="img"
      aria-label="No Excuses Reset Program"
      {...props}
    >
      <defs>
        {/* White-to-light-gray gradient for "NO EXCUSES" */}
        <linearGradient id="ne-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#D4D4D8" />
        </linearGradient>
        {/* Slightly darker gradient for "RESET" to add depth */}
        <linearGradient id="reset-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F4F4F5" />
          <stop offset="100%" stopColor="#A1A1AA" />
        </linearGradient>
      </defs>

      {/* NO EXCUSES — top, lighter weight */}
      <text
        x="160"
        y="78"
        textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fontSize="46"
        fill="url(#ne-grad)"
        letterSpacing="-1"
      >
        NO EXCUSES
      </text>

      {/* Red bar/ribbon divider — the brand mark */}
      <rect
        x="20"
        y="108"
        width="280"
        height="18"
        rx="2"
        fill="hsl(0 84% 50%)"
      />
      {/* Subtle bevel highlight on the bar */}
      <rect
        x="20"
        y="108"
        width="280"
        height="3"
        rx="1.5"
        fill="hsl(0 84% 60%)"
        opacity="0.7"
      />

      {/* RESET — bottom, heavy weight, the visual anchor */}
      <text
        x="160"
        y="220"
        textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="900"
        fontSize="96"
        fill="url(#reset-grad)"
        letterSpacing="-3"
      >
        RESET
      </text>

      {/* Tagline — small monospace */}
      {showTagline && (
        <text
          x="160"
          y="290"
          textAnchor="middle"
          fontFamily="ui-monospace, 'JetBrains Mono', monospace"
          fontWeight="500"
          fontSize="14"
          fill="#D4D4D8"
          letterSpacing="3"
        >
          15-MONTH RESET PROGRAM
        </text>
      )}
    </svg>
  );
}
