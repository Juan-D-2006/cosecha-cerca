/** Franja inspirada en los tejidos andinos (patrón escalonado), dibujada en SVG. */
export function TextileBand({ className = "", animate = false }: { className?: string; animate?: boolean }) {
  return (
    <svg
      aria-hidden
      className={`block h-3 w-full ${animate ? "weave" : ""} ${className}`}
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id="tejido" width="32" height="12" patternUnits="userSpaceOnUse">
          <rect width="32" height="12" fill="#a8441f" />
          {/* escalones de maíz */}
          <path d="M0 12V8h4V4h4V0h4v4h4v4h4v4z" fill="#e8b23a" />
          {/* rombo verde */}
          <path d="M24 2l4 4-4 4-4-4z" fill="#2a5022" />
          <path d="M24 4.5L25.5 6 24 7.5 22.5 6z" fill="#fbf6ec" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#tejido)" />
    </svg>
  );
}
