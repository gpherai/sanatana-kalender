type Planet = "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter" | "Venus" | "Saturn";

interface PlanetIconProps {
  planet: Planet;
  className?: string;
}

function SunIcon() {
  return (
    <>
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <line
        x1="12"
        y1="3"
        x2="12"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="18"
        x2="12"
        y2="21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="3"
        y1="12"
        x2="6"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="18"
        y1="12"
        x2="21"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="5.64"
        y1="5.64"
        x2="7.76"
        y2="7.76"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="16.24"
        y1="16.24"
        x2="18.36"
        y2="18.36"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="5.64"
        y1="18.36"
        x2="7.76"
        y2="16.24"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="16.24"
        y1="7.76"
        x2="18.36"
        y2="5.64"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </>
  );
}

function MoonIcon() {
  return (
    <path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      fill="currentColor"
      stroke="none"
    />
  );
}

function MarsIcon() {
  return (
    <>
      <circle
        cx="9.5"
        cy="14.5"
        r="5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <line
        x1="13.54"
        y1="10.46"
        x2="20"
        y2="4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <polyline
        points="15,4 20,4 20,9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  );
}

function MercuryIcon() {
  return (
    <>
      {/* Top crescent horns */}
      <path
        d="M9 6.5C9 4.84 10.34 3.5 12 3.5S15 4.84 15 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Circle body */}
      <circle cx="12" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Vertical stem */}
      <line
        x1="12"
        y1="14"
        x2="12"
        y2="20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Horizontal bar */}
      <line
        x1="9"
        y1="18"
        x2="15"
        y2="18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </>
  );
}

function JupiterIcon() {
  return (
    <>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Two banding stripes */}
      <path
        d="M3.5 9.5Q7.5 8 12 8.5T20.5 10"
        stroke="currentColor"
        strokeWidth="0.9"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M3 14Q7 12.5 12 13T21 14.5"
        stroke="currentColor"
        strokeWidth="0.9"
        fill="none"
        strokeLinecap="round"
      />
    </>
  );
}

function VenusIcon() {
  return (
    <>
      <circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line
        x1="12"
        y1="13"
        x2="12"
        y2="20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="9"
        y1="17"
        x2="15"
        y2="17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </>
  );
}

function SaturnIcon() {
  return (
    <>
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Ring — tilted ellipse passing through the planet */}
      <ellipse
        cx="12"
        cy="12"
        rx="10"
        ry="3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        transform="rotate(-20 12 12)"
      />
    </>
  );
}

const PLANET_ICONS: Record<Planet, () => React.JSX.Element> = {
  Sun: SunIcon,
  Moon: MoonIcon,
  Mars: MarsIcon,
  Mercury: MercuryIcon,
  Jupiter: JupiterIcon,
  Venus: VenusIcon,
  Saturn: SaturnIcon,
};

export function PlanetIcon({ planet, className }: PlanetIconProps) {
  const Icon = PLANET_ICONS[planet];
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <Icon />
    </svg>
  );
}
