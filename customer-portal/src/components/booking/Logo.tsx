export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="8" fill="#3cd3d6" />
        <path
          d="M9 9h4l3 9 3-9h4v14h-3v-9.5L17 23h-2L11 13.5V23H8V9h1z"
          fill="#fff"
        />
      </svg>
      <span className="text-[17px] font-bold text-ink tracking-tight">
        Moving Muscle
      </span>
    </div>
  );
}
