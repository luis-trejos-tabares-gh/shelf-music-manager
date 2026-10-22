export function ShelfMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M8 4.5v23M24 4.5v23"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="square"
      />
      <path
        d="M8 11h16M8 18.5h16M8 26h16"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="16"
        cy="14.2"
        r="4.2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="16" cy="14.2" r="1.05" fill="currentColor" />
    </svg>
  );
}
