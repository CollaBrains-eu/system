import type { SVGProps } from "react";

export function Wordpress({
  size = 24,
  strokeWidth = 1.8,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="9.25" />
      <path d="m4.6 8.2 4.1 11.1 2.8-7.5-2-5.5M8 8.2h3.1m1.2 0h3.1M13 8.2l3.6 10.2 2.1-6.1c.7-2.1-.2-3.5-1.2-4.1M3.7 8.2h4.4" />
    </svg>
  );
}
