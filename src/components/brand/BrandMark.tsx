/** Isotipo: sol de cosecha sobre surcos de chacra. */
export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#2a5022" />
      <circle cx="16" cy="13" r="5.5" fill="#e8b23a" />
      <path d="M5 22c3.5-2.6 7.2-3.9 11-3.9S23.5 19.4 27 22" stroke="#fbf6ec" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M7 26.5c2.9-1.9 5.9-2.8 9-2.8s6.1.9 9 2.8" stroke="#c4552d" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
