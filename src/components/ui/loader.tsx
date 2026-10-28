import { cn } from "@/lib/utils";
export function Loader({ className }: { className?: string }) {
  return (
    <span className={cn("dentora-loader", className)} aria-hidden="true">
      <span className="dentora-loader-ring" />
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M12 5c-3-2-6-1-6 3 0 2 1 3 1.5 6 .4 3 1 5 2 5s1-6 2.5-6 1.5 6 2.5 6 1.6-2 2-5C17 11 18 10 18 8c0-4-3-5-6-3Z" />
      </svg>
    </span>
  );
}
