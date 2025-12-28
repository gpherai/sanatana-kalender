"use client";

import { cn } from "@/lib/utils";

interface MoonPhaseProps {
  /** Moon illumination percentage (0-100) */
  percent: number;
  /** Is the moon waxing (growing)? */
  isWaxing: boolean;
  /** Size in pixels */
  size?: number;
  /** Additional CSS classes */
  className?: string;
  /** Show glow effect */
  glow?: boolean;
}

/**
 * Beautiful animated SVG moon phase visualization.
 * Accurately renders the moon's current phase based on illumination percentage.
 */
export function MoonPhase({
  percent,
  isWaxing,
  size = 120,
  className,
  glow = true,
}: MoonPhaseProps) {
  const illumination = percent / 100;
  const r = size / 2 - 2;
  const cx = size / 2;
  const cy = size / 2;

  // Create the path for the lit portion of the moon
  const createMoonPath = () => {
    if (percent <= 1) {
      // New moon - almost no light
      return "";
    }

    if (percent >= 99) {
      // Full moon - complete circle
      return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r}`;
    }

    // Calculate terminator position
    // The terminator is the boundary between lit and unlit portions
    // For waxing: starts from left (-r) and moves right (+r)
    // For waning: starts from right (+r) and moves left (-r)

    // X-offset of terminator from center (-r to +r)
    // At 0%: offset = -r (far left, new moon)
    // At 50%: offset = 0 (center, half moon)
    // At 100%: offset = +r (far right, full moon)
    const offset = (illumination * 2 - 1) * r;

    // The terminator arc x-radius determines how much it curves
    // Using the absolute offset value creates the correct curvature
    const terminatorCurve = Math.abs(offset);

    if (isWaxing) {
      // Waxing: lit portion on the right side, growing
      // Sweep direction: when offset < 0 (before half), curve outward (sweep=0)
      //                  when offset >= 0 (after half), curve inward (sweep=1)
      const sweep = offset >= 0 ? 1 : 0;

      return `
        M ${cx} ${cy - r}
        A ${r} ${r} 0 0 1 ${cx} ${cy + r}
        A ${terminatorCurve} ${r} 0 0 ${sweep} ${cx} ${cy - r}
        Z
      `;
    } else {
      // Waning: lit portion on the left side, shrinking
      // Sweep direction: when offset <= 0 (before half), curve outward (sweep=1)
      //                  when offset > 0 (after half), curve inward (sweep=0)
      const sweep = offset <= 0 ? 1 : 0;

      return `
        M ${cx} ${cy - r}
        A ${r} ${r} 0 0 0 ${cx} ${cy + r}
        A ${terminatorCurve} ${r} 0 0 ${sweep} ${cx} ${cy - r}
        Z
      `;
    }
  };

  const moonPath = createMoonPath();

  return (
    <div
      className={cn("relative inline-block", className)}
      style={{ width: size, height: size }}
    >
      {/* Glow effect */}
      {glow && percent > 5 && (
        <div
          className="absolute inset-0 rounded-full opacity-30 blur-xl"
          style={{
            background: `radial-gradient(circle, var(--theme-moon-glow, oklch(0.980 0.035 85 / ${0.3 + illumination * 0.4})) 0%, transparent 70%)`,
          }}
        />
      )}

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative z-10"
        style={{ background: 'transparent' }}
      >
        {/* Definitions for gradients and filters */}
        <defs>
          {/* Moon surface gradient - light side */}
          <radialGradient id={`moonSurface-${size}`} cx="40%" cy="40%">
            <stop offset="0%" style={{ stopColor: 'var(--theme-moon-surface-light, oklch(0.985 0.015 80))' }} />
            <stop offset="50%" style={{ stopColor: 'var(--theme-moon-surface-mid, oklch(0.945 0.020 75))' }} />
            <stop offset="100%" style={{ stopColor: 'var(--theme-moon-surface-dark, oklch(0.895 0.025 70))' }} />
          </radialGradient>

          {/* Dark side gradient */}
          <radialGradient id={`moonDark-${size}`} cx="50%" cy="50%">
            <stop offset="0%" style={{ stopColor: 'var(--theme-moon-shadow-light, oklch(0.165 0.015 280))' }} />
            <stop offset="100%" style={{ stopColor: 'var(--theme-moon-shadow-deep, oklch(0.105 0.010 275))' }} />
          </radialGradient>

          {/* Subtle texture (no heavy filters that cause white boxes) */}
          <filter id={`moonTexture-${size}`} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.02"
              numOctaves="2"
              result="noise"
            />
            <feColorMatrix
              in="noise"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0.05 0"
              result="opacity"
            />
            <feBlend in="SourceGraphic" in2="opacity" mode="multiply" />
          </filter>
        </defs>

        {/* Dark base circle (always visible, full moon disk) */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={`url(#moonDark-${size})`}
          filter={`url(#moonTexture-${size})`}
        />

        {/* Lit portion of the moon */}
        {moonPath && (
          <path
            d={moonPath}
            fill={`url(#moonSurface-${size})`}
            filter={`url(#moonTexture-${size})`}
            className="transition-all duration-1000"
          />
        )}

        {/* Subtle rim light for depth */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--theme-moon-rim, oklch(1 0 0 / 0.1))"
          strokeWidth="0.5"
        />
      </svg>
    </div>
  );
}

/**
 * Compact moon phase indicator with emoji and label.
 */
export function MoonPhaseCompact({
  percent,
  isWaxing,
  phaseName,
  className,
}: {
  percent: number;
  isWaxing: boolean;
  phaseName: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <MoonPhase percent={percent} isWaxing={isWaxing} size={48} glow={false} />
      <div>
        <div className="text-sm font-medium text-theme-fg">
          {phaseName}
        </div>
        <div className="text-xs text-theme-fg-muted">
          {percent}% verlicht
        </div>
      </div>
    </div>
  );
}
