export function CivicShield({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 2L3 7V12C3 17.55 6.84 22.74 12 24C17.16 22.74 21 17.55 21 12V7L12 2Z"
        fill="#0052cc"
        fillOpacity="0.1"
      />
      <path
        d="M12 2L3 7V12C3 17.55 6.84 22.74 12 24C17.16 22.74 21 17.55 21 12V7L12 2Z"
        stroke="#0052cc"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="3" stroke="#0052cc" strokeWidth="2" />
      <path
        d="M12 14C9.5 14 7.5 15.5 7.5 17.5"
        stroke="#0052cc"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16.5 17.5C16.5 15.5 14.5 14 12 14"
        stroke="#0052cc"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
