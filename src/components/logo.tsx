
import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 50" // Adjusted viewBox for "Matrix" and icon
      width="110" // Default width adjustment
      height="30" // Default height
      aria-label="Matrix Logo"
      {...props}
    >
      <rect width="160" height="50" fill="none" />
      {/* Stylized M graphic */}
      <path 
        d="M10 35 V15 L20 25 L30 15 V35" 
        stroke="hsl(var(--primary))" 
        strokeWidth="4" 
        fill="none" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      {/* Optional small elements for matrix feel, can be omitted if too busy */}
      {/* <circle cx="38" cy="12" r="1.5" fill="hsl(var(--primary))" />
      <circle cx="38" cy="25" r="1.5" fill="hsl(var(--primary))" />
      <circle cx="38" cy="38" r="1.5" fill="hsl(var(--primary))" /> */}
      <text
        x="45" // Adjusted x position to follow the 'M' graphic
        y="33" // Adjusted y for better vertical alignment
        fontFamily="var(--font-geist-sans), Arial, sans-serif"
        fontSize="28"
        fontWeight="bold"
        fill="hsl(var(--foreground))"
      >
        Matrix
      </text>
    </svg>
  );
}
